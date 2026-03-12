import crypto from "node:crypto";
import type { Response } from "express";
import {
  appendMissionSessionEvent,
  getLatestMissionSessionForWorkspace,
  getMissionSessionById,
  getMissionWorkspace,
  listMissionSessionsForWorkspace,
  listMissionSessionEvents,
  listMissionWorkspaceFiles,
  upsertMissionSession,
  upsertMissionWorkspace,
  upsertMissionWorkspaceFile
} from "./db.js";

type MissionArtifactMap = Record<string, string>;
type MissionActivity = Record<string, unknown>;
type MissionModel = Record<string, unknown>;

interface MissionSyncInput {
  userId: number;
  workspaceId: string;
  provider: string;
  budgetUsd?: number;
  mission: MissionModel;
  workspaceArtifacts?: MissionArtifactMap;
  ensureSession?: boolean;
  sessionId?: string | null;
}

interface MissionSnapshot {
  workspaceId: string;
  provider: string;
  sessionId: string | null;
  budgetUsd: number;
  mission: MissionModel | null;
  workspaceArtifacts: MissionArtifactMap;
  activity: MissionActivity[];
  updatedAt: string | null;
}

type MissionStreamEventType = "snapshot" | "heartbeat";
type MissionStreamSubscriber = {
  id: string;
  res: Response;
};

const missionStreamSubscribers = new Map<string, Map<string, MissionStreamSubscriber>>();

function missionStreamKey(userId: number, workspaceId: string) {
  return `${userId}:${workspaceId}`;
}

function parseJsonObject<T extends Record<string, unknown>>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function buildEventKey(item: MissionActivity) {
  return [
    String(item.ts || ""),
    String(item.title || ""),
    String(item.message || ""),
    String(item.meta || "")
  ].join("|");
}

function listActivityForSnapshot(userId: number, workspaceId: string, sessionId?: string | null) {
  return listMissionSessionEvents({ userId, workspaceId, sessionId: sessionId || null, limit: 40 }).map((entry) =>
    parseJsonObject<Record<string, unknown>>(entry.eventJson, {})
  );
}

export function loadMissionWorkspaceSnapshot(userId: number, workspaceId: string): MissionSnapshot {
  const workspace = getMissionWorkspace(userId, workspaceId);
  const session =
    (workspace?.activeSessionId ? getMissionSessionById(userId, workspace.activeSessionId) : null) ||
    getLatestMissionSessionForWorkspace(userId, workspaceId);
  const mission = workspace
    ? parseJsonObject<MissionModel>(workspace.missionJson, null as unknown as MissionModel)
    : session
      ? parseJsonObject<MissionModel>(session.missionJson, null as unknown as MissionModel)
      : null;
  const workspaceArtifacts = Object.fromEntries(
    listMissionWorkspaceFiles(userId, workspaceId).map((entry) => [entry.fileName, entry.content])
  );
  const sessionActivity = listActivityForSnapshot(
    userId,
    workspaceId,
    session?.sessionId || workspace?.activeSessionId || null
  );
  const activity =
    sessionActivity.length > 0
      ? sessionActivity
      : mission && Array.isArray(mission.activity)
        ? (mission.activity as MissionActivity[])
        : [];
  if (mission) {
    mission.activity = activity;
    if (session?.sessionId) {
      mission.sessionId = session.sessionId;
    }
  }
  return {
    workspaceId,
    provider: workspace?.provider || session?.provider || String(mission?.provider || "openclaw"),
    sessionId: workspace?.activeSessionId || session?.sessionId || null,
    budgetUsd: Number(session?.budgetUsd || 0),
    mission,
    workspaceArtifacts,
    activity,
    updatedAt: workspace?.updated_at || session?.updated_at || null
  };
}

export function loadMissionSessionSnapshot(userId: number, sessionId: string): MissionSnapshot | null {
  const session = getMissionSessionById(userId, sessionId);
  if (!session) return null;
  const mission = parseJsonObject<MissionModel>(session.missionJson, null as unknown as MissionModel);
  const workspaceArtifacts = Object.fromEntries(
    listMissionWorkspaceFiles(userId, session.workspaceId).map((entry) => [entry.fileName, entry.content])
  );
  const activity = listActivityForSnapshot(userId, session.workspaceId, session.sessionId);
  if (mission) {
    mission.activity = activity;
    mission.sessionId = session.sessionId;
  }
  return {
    workspaceId: session.workspaceId,
    provider: session.provider,
    sessionId: session.sessionId,
    budgetUsd: Number(session.budgetUsd || 0),
    mission,
    workspaceArtifacts,
    activity,
    updatedAt: session.updated_at || null
  };
}

export function listMissionWorkspaceSessions(
  userId: number,
  workspaceId: string,
  limit = 20
) {
  return listMissionSessionsForWorkspace(userId, workspaceId, limit).map((session) => {
    const mission = parseJsonObject<MissionModel>(session.missionJson, {} as MissionModel);
    const livePosition =
      mission && mission.livePosition && typeof mission.livePosition === "object"
        ? (mission.livePosition as Record<string, unknown>)
        : null;
    return {
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      provider: session.provider,
      budgetUsd: session.budgetUsd,
      missionStatus: session.status,
      startedAt: session.started_at,
      updatedAt: session.updated_at,
      endedAt: session.ended_at,
      outcome: livePosition
        ? "open_position"
        : ["exited", "halted"].includes(session.status)
          ? session.status
          : "active",
      thesisSummary: String((mission.thesis as Record<string, unknown>)?.summary || ""),
      confidence: Number((mission.thesis as Record<string, unknown>)?.confidence || 0)
    };
  });
}

function broadcastMissionSnapshot(userId: number, workspaceId: string, snapshot: MissionSnapshot) {
  const channel = missionStreamSubscribers.get(missionStreamKey(userId, workspaceId));
  if (!channel?.size) return;
  const payload = JSON.stringify({ type: "snapshot", snapshot });
  for (const subscriber of channel.values()) {
    subscriber.res.write(`event: snapshot\n`);
    subscriber.res.write(`data: ${payload}\n\n`);
  }
}

function broadcastMissionStructuredEvents(
  userId: number,
  workspaceId: string,
  previousSnapshot: MissionSnapshot | null,
  snapshot: MissionSnapshot
) {
  const channel = missionStreamSubscribers.get(missionStreamKey(userId, workspaceId));
  if (!channel?.size) return;
  const write = (event: string, payload: Record<string, unknown>) => {
    const serialized = JSON.stringify(payload);
    for (const subscriber of channel.values()) {
      subscriber.res.write(`event: ${event}\n`);
      subscriber.res.write(`data: ${serialized}\n\n`);
    }
  };

  if ((previousSnapshot?.sessionId || null) !== (snapshot.sessionId || null) && snapshot.sessionId) {
    write("session", {
      type: "session",
      workspaceId,
      sessionId: snapshot.sessionId,
      provider: snapshot.provider,
      budgetUsd: snapshot.budgetUsd,
      ts: snapshot.updatedAt
    });
  }

  const previousStatus = String(previousSnapshot?.mission?.missionStatus || "");
  const nextStatus = String(snapshot.mission?.missionStatus || "");
  if (nextStatus && previousStatus !== nextStatus) {
    write("status", {
      type: "status",
      workspaceId,
      sessionId: snapshot.sessionId,
      missionStatus: nextStatus,
      ts: snapshot.updatedAt
    });
  }

  const previousKeys = new Set(
    (previousSnapshot?.activity || []).map((item) => buildEventKey(item))
  );
  const appended = (snapshot.activity || []).filter((item) => !previousKeys.has(buildEventKey(item)));
  for (const item of appended) {
    write("activity", {
      type: "activity",
      workspaceId,
      sessionId: snapshot.sessionId,
      activity: item
    });
  }
}

export function syncMissionWorkspace(input: MissionSyncInput): MissionSnapshot {
  const workspaceId = String(input.workspaceId || "").trim();
  if (!workspaceId) {
    throw new Error("workspaceId is required");
  }
  const previousSnapshot = loadMissionWorkspaceSnapshot(input.userId, workspaceId);
  const mission = {
    ...(input.mission || {})
  };
  const requestedSessionId =
    String(input.sessionId || mission.sessionId || "").trim() ||
    (input.ensureSession ? crypto.randomUUID() : "");
  if (requestedSessionId) {
    mission.sessionId = requestedSessionId;
  }

  const status = String(mission.missionStatus || "scanning");
  const activeSessionId = requestedSessionId || null;
  const missionJson = JSON.stringify(mission);
  const endedAt = ["exited", "halted"].includes(status) ? new Date().toISOString() : null;

  upsertMissionWorkspace({
    userId: input.userId,
    workspaceId,
    provider: input.provider,
    activeSessionId,
    missionJson
  });

  for (const [fileName, content] of Object.entries(input.workspaceArtifacts || {})) {
    upsertMissionWorkspaceFile({
      userId: input.userId,
      workspaceId,
      fileName,
      content: String(content || "")
    });
  }

  if (activeSessionId) {
    upsertMissionSession({
      sessionId: activeSessionId,
      userId: input.userId,
      workspaceId,
      provider: input.provider,
      budgetUsd: Number(input.budgetUsd || 0),
      status,
      missionJson,
      endedAt
    });
    const activity = Array.isArray(mission.activity) ? mission.activity : [];
    for (const item of activity) {
      appendMissionSessionEvent({
        sessionId: activeSessionId,
        userId: input.userId,
        workspaceId,
        eventKey: buildEventKey(item as MissionActivity),
        eventJson: JSON.stringify(item)
      });
    }
  }

  const snapshot = loadMissionWorkspaceSnapshot(input.userId, workspaceId);
  broadcastMissionStructuredEvents(input.userId, workspaceId, previousSnapshot, snapshot);
  broadcastMissionSnapshot(input.userId, workspaceId, snapshot);
  return snapshot;
}

export function subscribeMissionWorkspaceStream(
  userId: number,
  workspaceId: string,
  res: Response
) {
  const key = missionStreamKey(userId, workspaceId);
  const subscriberId = crypto.randomUUID();
  const current = missionStreamSubscribers.get(key) || new Map<string, MissionStreamSubscriber>();
  current.set(subscriberId, { id: subscriberId, res });
  missionStreamSubscribers.set(key, current);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (type: MissionStreamEventType, payload: Record<string, unknown>) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send("snapshot", { type: "snapshot", snapshot: loadMissionWorkspaceSnapshot(userId, workspaceId) });

  const heartbeat = setInterval(() => {
    send("heartbeat", { type: "heartbeat", ts: new Date().toISOString() });
  }, 20000);

  const cleanup = () => {
    clearInterval(heartbeat);
    const channel = missionStreamSubscribers.get(key);
    if (!channel) return;
    channel.delete(subscriberId);
    if (!channel.size) {
      missionStreamSubscribers.delete(key);
    }
  };

  res.on("close", cleanup);
  res.on("finish", cleanup);
}
