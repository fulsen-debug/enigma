import test from "node:test";
import assert from "node:assert/strict";

import {
  OPENCLAW_WORKSPACE_FILES,
  createEmptyMissionModel,
  createLegacyPaperAgentProvider,
  createOpenClawAgentProvider
} from "../src/public/agentMissionProvider.js";

function createSignalPayload(mint = "mint-1") {
  return {
    signal: {
      mint,
      status: "FAVORABLE",
      confidence: 0.83,
      patternScore: 78,
      token: {
        mint,
        symbol: "AIGT",
        name: "AI Test"
      },
      market: {
        priceUsd: 0.0042,
        liquidityUsd: 153000,
        flow24h: { buys: 19, sells: 7 }
      },
      tradePlan: {
        buyZone: { low: 0.004, high: 0.0044 },
        resistance: [0.0054],
        stopLoss: 0.0037
      },
      marketRegime: {
        regime: "Trending & Stable",
        timeframe: "1h"
      },
      holderProfile: {
        connectedPct: 11.4,
        newWalletPct: 18.2
      },
      bundleRiskScore: 14,
      reasons: ["Trend is constructive and liquidity remains healthy."]
    }
  };
}

test("openclaw provider preview persists workspace artifacts and thesis", async () => {
  let syncedSnapshot: Record<string, any> | null = null;
  const legacy = createLegacyPaperAgentProvider({
    async request(url: string) {
      if (url === "/api/signal") return createSignalPayload();
      throw new Error(`unexpected request ${url}`);
    }
  });
  const provider = createOpenClawAgentProvider({
    request: async (url: string, body?: Record<string, unknown>, _requireAuth?: boolean, method = "GET") => {
      if (url === "/api/mission/workspaces/mint-1/preview" && method === "POST") {
        syncedSnapshot = {
          workspaceId: "mint-1",
          provider: "openclaw",
          sessionId: "session-preview",
          budgetUsd: Number(body?.budgetUsd || 0),
          mission: {
            ...createEmptyMissionModel("openclaw"),
            provider: "openclaw",
            sessionId: "session-preview",
            missionStatus: "planning",
            thesis: {
              ...createEmptyMissionModel("openclaw").thesis,
              summary: "OpenClaw prepared a thesis.",
              confidence: 0.83
            },
            activity: [
              {
                ts: new Date().toISOString(),
                title: "Preview Requested",
                message: "OpenClaw prepared the mission preview.",
                tone: "info",
                meta: "mint-1"
              }
            ]
          },
          workspaceArtifacts: {
            "THESIS.md": "# Current Thesis\n\nOpenClaw prepared a thesis."
          },
          activity: [
            {
              ts: new Date().toISOString(),
              title: "Preview Requested",
              message: "OpenClaw prepared the mission preview.",
              tone: "info",
              meta: "mint-1"
            }
          ],
          updatedAt: new Date().toISOString()
        };
        return {
          workspaceId: "mint-1",
          sessionId: "session-preview",
          budgetUsd: Number(body?.budgetUsd || 0),
          signalId: 12,
          signal: createSignalPayload().signal,
          decision: { decision: "BUY_CANDIDATE" },
          quote: { entryMid: 0.0042, stopLoss: 0.0037, takeProfit: 0.0054, holdHorizon: "1h horizon" },
          snapshot: syncedSnapshot
        };
      }
      if (url === "/api/mission/workspaces/mint-1" && method === "GET") {
        return syncedSnapshot;
      }
      throw new Error(`unexpected request ${url}`);
    },
    fallbackProvider: legacy
  });

  const result = await provider.previewMission({ workspaceId: "mint-1", mint: "mint-1", budgetUsd: 250 }, 250);

  assert.equal(result.mission.provider, "openclaw");
  assert.equal(result.mission.missionStatus, "planning");
  assert.match(result.mission.thesis.summary, /OpenClaw/i);
  assert.equal(result.mission.workspaceFiles.length, OPENCLAW_WORKSPACE_FILES.length);
  assert.ok(syncedSnapshot);
  assert.ok(String(syncedSnapshot?.workspaceArtifacts?.["THESIS.md"] || "").includes("Current Thesis"));
  assert.equal(syncedSnapshot?.mission?.provider, "openclaw");
});

test("openclaw provider executes via guarded fallback and exposes monitoring state", async () => {
  let syncedSnapshot: Record<string, any> | null = null;
  const legacyMission = createEmptyMissionModel("legacy-paper");
  legacyMission.livePosition = {
    id: "pos-1",
    mint: "mint-1",
    sizeUsd: 250,
    entryPriceUsd: 0.0042,
    lastPriceUsd: 0.0044,
    pnlPct: 4.5,
    opened_at: new Date().toISOString()
  };
  legacyMission.executionTrace = {
    ...legacyMission.executionTrace,
    submitted: "Confirmed",
    txHash: "paper-fill",
    filledAmount: 250,
    averageEntry: 0.0042,
    stopLoss: 0.0037,
    takeProfit: 0.0054,
    holdHorizon: "1h horizon",
    currentPnlPct: 4.5
  };
  legacyMission.activity = [
    {
      ts: new Date().toISOString(),
      tone: "ok",
      title: "Position Opened",
      message: "Execution confirmed.",
      meta: "mint-1"
    }
  ];
  const provider = createOpenClawAgentProvider({
    request: async (url: string, body?: Record<string, unknown>, _requireAuth?: boolean, method = "GET") => {
      if (url === "/api/mission/workspaces/mint-1/execute" && method === "POST") {
        syncedSnapshot = {
          workspaceId: "mint-1",
          provider: "openclaw",
          sessionId: "session-1",
          budgetUsd: Number(body?.budgetUsd || 0),
          mission: {
            ...createEmptyMissionModel("openclaw"),
            provider: "openclaw",
            sessionId: "session-1",
            missionStatus: "monitoring",
            livePosition: legacyMission.livePosition,
            executionTrace: legacyMission.executionTrace,
            activity: [
              {
                ts: new Date().toISOString(),
                title: "Execution Requested",
                message: "OpenClaw requested guarded execution.",
                tone: "ok",
                meta: "mint-1"
              },
              {
                ts: new Date().toISOString(),
                title: "Execution Confirmed",
                message: "Guarded runtime confirmed the mission.",
                tone: "ok",
                meta: "mint-1"
              }
            ]
          },
          workspaceArtifacts: {
            "STATE.json": "{\"missionStatus\":\"monitoring\"}"
          },
          activity: [
            {
              ts: new Date().toISOString(),
              title: "Execution Requested",
              message: "OpenClaw requested guarded execution.",
              tone: "ok",
              meta: "mint-1"
            },
            {
              ts: new Date().toISOString(),
              title: "Execution Confirmed",
              message: "Guarded runtime confirmed the mission.",
              tone: "ok",
              meta: "mint-1"
            }
          ],
          updatedAt: new Date().toISOString()
        };
        return {
          workspaceId: "mint-1",
          sessionId: "session-1",
          budgetUsd: Number(body?.budgetUsd || 0),
          snapshot: syncedSnapshot
        };
      }
      if (url === "/api/mission/workspaces/mint-1" && method === "GET") {
        return syncedSnapshot;
      }
      throw new Error(`unexpected request ${url}`);
    },
    fallbackProvider: {
      ...createLegacyPaperAgentProvider({
        async request(url: string) {
          if (url === "/api/signal") return createSignalPayload();
          throw new Error(`unexpected request ${url}`);
        }
      }),
      async executeMission() {
        return {
          raw: {
            runResponse: { ts: new Date().toISOString() },
            engineResponse: { ts: new Date().toISOString(), positions: { open: [legacyMission.livePosition], openCount: 1 } }
          },
          mission: legacyMission
        };
      },
      async getMissionState() {
        return { raw: {}, mission: legacyMission };
      }
    }
  });

  const result = await provider.executeMission({ workspaceId: "mint-1", mint: "mint-1", budgetUsd: 250 }, 250);

  assert.equal(result.mission.provider, "openclaw");
  assert.equal(result.mission.missionStatus, "monitoring");
  assert.equal(result.mission.livePosition?.id, "pos-1");
  assert.equal(result.mission.sessionId, "session-1");
  assert.ok(result.mission.activity.some((item) => item.title === "Execution Requested"));
  assert.ok(result.mission.activity.some((item) => item.title === "Execution Confirmed"));
});

test("openclaw provider halt and close preserve normalized mission contract", async () => {
  let syncedSnapshot: Record<string, any> | null = {
    workspaceId: "mint-1",
    provider: "openclaw",
    sessionId: "session-1",
    budgetUsd: 250,
    mission: {
      ...createEmptyMissionModel("openclaw"),
      sessionId: "session-1",
      rawSignal: createSignalPayload().signal
    },
    workspaceArtifacts: {},
    activity: [],
    updatedAt: new Date().toISOString()
  };
  const provider = createOpenClawAgentProvider({
    request: async (url: string, body?: Record<string, unknown>, _requireAuth?: boolean, method = "GET") => {
      if (url === "/api/mission/workspaces/mint-1" && method === "GET") {
        return syncedSnapshot;
      }
      if ((url === "/api/mission/workspaces/mint-1/close" || url === "/api/mission/workspaces/mint-1/halt") && method === "POST") {
        const missionStatus = url.endsWith("/halt") ? "halted" : "exited";
        syncedSnapshot = {
          workspaceId: "mint-1",
          provider: "openclaw",
          sessionId: "session-1",
          budgetUsd: 250,
          mission: {
            ...createEmptyMissionModel("openclaw"),
            provider: "openclaw",
            sessionId: "session-1",
            missionStatus,
            rawSignal: createSignalPayload().signal
          },
          workspaceArtifacts: {},
          activity: [],
          updatedAt: new Date().toISOString()
        };
        return {
          ok: true,
          snapshot: syncedSnapshot
        };
      }
      throw new Error(`unexpected request ${url}`);
    },
    fallbackProvider: {
      ...createLegacyPaperAgentProvider({
        async request(url: string) {
          if (url === "/api/signal") return createSignalPayload();
          throw new Error(`unexpected request ${url}`);
        }
      }),
      async closePosition() {
        const mission = createEmptyMissionModel("legacy-paper");
        mission.missionStatus = "exited";
        return { raw: { ts: new Date().toISOString() }, mission };
      },
      async haltMission() {
        const mission = createEmptyMissionModel("legacy-paper");
        mission.missionStatus = "halted";
        return { raw: { ts: new Date().toISOString() }, mission };
      },
      async getMissionState() {
        return { raw: {}, mission: createEmptyMissionModel("legacy-paper") };
      }
    }
  });

  const closed = await provider.closePosition({ workspaceId: "mint-1", mint: "mint-1", positionId: "p-1" }, "p-1");
  const halted = await provider.haltMission({ workspaceId: "mint-1", mint: "mint-1" });

  assert.equal(closed.mission.missionStatus, "exited");
  assert.equal(closed.mission.provider, "openclaw");
  assert.equal(halted.mission.missionStatus, "halted");
  assert.equal(halted.mission.provider, "openclaw");
});
