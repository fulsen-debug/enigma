const OPENCLAW_WORKSPACE_FILES = [
  "SOUL.md",
  "USER.md",
  "THESIS.md",
  "STATE.json",
  "POSITIONS.json",
  "EXECUTIONS.json"
];

function normalizeSignalStatus(value) {
  const raw = String(value || "").trim().toUpperCase();
  return raw || "SCANNING";
}

function deriveRiskPosture(status) {
  if (status === "FAVORABLE") return "Constructive";
  if (status === "CAUTION") return "Guarded";
  if (status === "HIGH_RISK") return "Defensive";
  return "Standby";
}

function deriveActionIntent(status, decision) {
  if (String(decision || "").trim().toUpperCase() === "BUY_CANDIDATE") return "Engage mission";
  if (status === "FAVORABLE") return "Prepare staged entry";
  if (status === "CAUTION") return "Wait for confirmation";
  return "Stand down";
}

function firstPositive(values = []) {
  for (const value of values) {
    const num = Number(value || 0);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
}

function cloneActivity(activity = []) {
  return Array.isArray(activity) ? activity.map((item) => ({ ...item })) : [];
}

function buildThesisFromDecisionLike(source = {}) {
  const tradePlan = source.tradePlan || {};
  const market = source.market || {};
  const regime = source.marketRegime || {};
  const sentiment = source.sentiment || {};
  const status = normalizeSignalStatus(source.signalStatus || source.status);
  const confidence = Math.max(
    0,
    Math.min(1, Number(source.confidence ?? source.killSwitch?.confidence ?? sentiment?.confidence ?? 0))
  );
  const reasons = Array.isArray(source.reasons) && source.reasons.length
    ? source.reasons.filter(Boolean)
    : [
        String(tradePlan.recommendation || "").trim(),
        String(sentiment.summary || "").trim(),
        String(source.killSwitch?.summary || "").trim()
      ].filter(Boolean);

  return {
    token: source.token || null,
    mint: String(source.mint || source.token?.mint || "").trim(),
    status,
    confidence,
    patternScore: Number(source.patternScore || 0),
    riskPosture: deriveRiskPosture(status),
    actionIntent: deriveActionIntent(status, source.decision),
    executionPosture: "Guarded mission runtime",
    summary:
      reasons[0] ||
      "AIG is waiting for enough market structure to form a high-conviction mission.",
    reasons: reasons.slice(0, 4),
    note:
      status === "FAVORABLE"
        ? "Conditions are supportive enough for guarded execution."
        : status === "CAUTION"
          ? "AIG sees a setup forming, but the mission remains guarded."
          : "Risk pressure is elevated. AIG will prefer observation over entry.",
    priceUsd: Number(market.priceUsd || 0),
    regime: String(regime.regime || ""),
    regimeTimeframe: String(regime.timeframe || ""),
    entryLow: firstPositive([tradePlan.buyZone?.low]),
    entryHigh: firstPositive([tradePlan.buyZone?.high]),
    takeProfit: firstPositive([
      Array.isArray(tradePlan.resistance) ? tradePlan.resistance[0] : tradePlan.resistance
    ]),
    stopLoss: firstPositive([tradePlan.stopLoss]),
    holdHorizon: regime.timeframe ? `${String(regime.timeframe)} horizon` : "Adaptive hold horizon"
  };
}

export function createEmptyMissionModel(provider = "legacy-paper") {
  return {
    provider,
    providerLabel:
      provider === "openclaw"
        ? "OpenClaw Mission Adapter"
        : "Legacy Paper Engine",
    workspaceFiles: OPENCLAW_WORKSPACE_FILES.slice(),
    workspaceArtifacts: {},
    missionStatus: "scanning",
    thesis: buildThesisFromDecisionLike({}),
    executionTrace: {
      previewState: "Not started",
      submitted: "-",
      txHash: "-",
      filledAmount: null,
      averageEntry: null,
      stopLoss: null,
      takeProfit: null,
      holdHorizon: null,
      currentPnlPct: null
    },
    livePosition: null,
    activity: []
  };
}

function actionEventToActivity(action = {}, ts = new Date().toISOString()) {
  const type = String(action?.type || "INFO").toUpperCase();
  const mint = String(action?.mint || "").trim();
  if (type === "OPEN") {
    return {
      ts,
      tone: "ok",
      title: "Position Opened",
      message: "Execution confirmed and a managed position is now live.",
      meta: `${mint} | ${Number(action?.sizeUsd || 0).toFixed(2)} USD`
    };
  }
  if (type === "CLOSE") {
    return {
      ts,
      tone: Number(action?.pnlPct || 0) >= 0 ? "ok" : "error",
      title: "Position Closed",
      message: String(action?.reason || "Position closed."),
      meta: mint ? `${mint} | ${Number(action?.pnlPct || 0).toFixed(2)}%` : ""
    };
  }
  return {
    ts,
    tone: type === "ERROR" ? "error" : "info",
    title: type === "ERROR" ? "Engine Alert" : "Engine Update",
    message: String(action?.note || action?.reason || action?.status || "Mission updated."),
    meta: mint
  };
}

function withProviderMetadata(model, providerId, providerLabel, artifacts = {}) {
  return {
    ...model,
    provider: providerId,
    providerLabel,
    workspaceFiles: OPENCLAW_WORKSPACE_FILES.slice(),
    workspaceArtifacts: artifacts
  };
}

export function createLegacyPaperAgentProvider({ request }) {
  const providerId = "legacy-paper";
  const providerLabel = "Legacy Paper Engine";

  function normalizePaperCycle({ runResponse, engineResponse, mint }) {
    const model = createEmptyMissionModel(providerId);
    const decisions = Array.isArray(runResponse?.decisions) ? runResponse.decisions : [];
    const primary =
      decisions.find((item) => String(item?.mint || "") === String(mint || "").trim()) ||
      decisions[0] ||
      null;
    if (primary) {
      model.thesis = buildThesisFromDecisionLike(primary);
      model.missionStatus =
        String(primary?.decision || "").toUpperCase() === "BUY_CANDIDATE" ? "planning" : "evaluating";
      model.executionTrace.previewState = "Plan refreshed";
      model.executionTrace.averageEntry = model.thesis.entryLow || model.thesis.entryHigh || null;
      model.executionTrace.stopLoss = model.thesis.stopLoss;
      model.executionTrace.takeProfit = model.thesis.takeProfit;
      model.executionTrace.holdHorizon = model.thesis.holdHorizon;
    }
    const open = Array.isArray(engineResponse?.positions?.open) ? engineResponse.positions.open[0] : null;
    if (open) {
      model.livePosition = open;
      model.missionStatus = "monitoring";
      model.executionTrace.submitted = "Confirmed";
      model.executionTrace.txHash = "paper-fill";
      model.executionTrace.filledAmount = Number(open.sizeUsd || 0);
      model.executionTrace.averageEntry = Number(open.entryPriceUsd || 0);
      model.executionTrace.stopLoss = firstPositive([
        open.stopLossPriceUsd,
        Number(open.entryPriceUsd || 0) * (1 - Number(open.slPct || 0) / 100)
      ]);
      model.executionTrace.takeProfit = firstPositive([
        open.targetSellPriceUsd,
        Number(open.entryPriceUsd || 0) * (1 + Number(open.tpPct || 0) / 100)
      ]);
      model.executionTrace.currentPnlPct = Number(open.pnlPct || 0);
    }
    model.activity = (Array.isArray(engineResponse?.actions) ? engineResponse.actions : []).map((action) =>
      actionEventToActivity(action, String(engineResponse?.ts || runResponse?.ts || new Date().toISOString()))
    );
    return withProviderMetadata(model, providerId, providerLabel);
  }

  function normalizeMonitorResponse(response) {
    const model = createEmptyMissionModel(providerId);
    const open = Array.isArray(response?.positions) ? response.positions[0] : null;
    if (open) {
      model.livePosition = open;
      model.missionStatus = "monitoring";
      model.executionTrace.submitted = "Confirmed";
      model.executionTrace.txHash = "paper-fill";
      model.executionTrace.filledAmount = Number(open.sizeUsd || 0);
      model.executionTrace.averageEntry = Number(open.entryPriceUsd || 0);
      model.executionTrace.currentPnlPct = Number(open.pnlPct || 0);
    } else {
      model.missionStatus = "exited";
    }
    model.activity = (Array.isArray(response?.actions) ? response.actions : []).map((action) =>
      actionEventToActivity(action, String(response?.ts || new Date().toISOString()))
    );
    return withProviderMetadata(model, providerId, providerLabel);
  }

  function normalizePositionsResponse(positions = []) {
    const model = createEmptyMissionModel(providerId);
    const open = Array.isArray(positions) ? positions[0] : null;
    if (open) {
      model.livePosition = open;
      model.missionStatus = "monitoring";
      model.executionTrace.submitted = "Confirmed";
      model.executionTrace.txHash = "paper-fill";
      model.executionTrace.filledAmount = Number(open.sizeUsd || 0);
      model.executionTrace.averageEntry = Number(open.entryPriceUsd || 0);
      model.executionTrace.currentPnlPct = Number(open.pnlPct || 0);
    } else {
      model.missionStatus = "exited";
    }
    return withProviderMetadata(model, providerId, providerLabel);
  }

  async function previewMission(workspaceIdOrOptions, budgetUsd) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.mint || workspaceIdOrOptions.workspaceId || ""
        : workspaceIdOrOptions;
    const effectiveBudget =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.budgetUsd
        : budgetUsd;
    const response = await request("/api/signal", { mint: workspaceId }, true, "POST");
    const thesis = buildThesisFromDecisionLike({
      ...(response.signal || {}),
      mint: workspaceId,
      token: response.signal?.token || null
    });
    const model = createEmptyMissionModel(providerId);
    model.missionStatus = "planning";
    model.thesis = thesis;
    model.executionTrace = {
      ...model.executionTrace,
      previewState: "Preview ready",
      averageEntry: thesis.entryLow || thesis.entryHigh || null,
      stopLoss: thesis.stopLoss,
      takeProfit: thesis.takeProfit,
      holdHorizon: thesis.holdHorizon,
      filledAmount: Number(effectiveBudget || 0)
    };
    model.activity = [
      {
        ts: new Date().toISOString(),
        tone: "info",
        title: "Plan Updated",
        message: "Mission thesis refreshed from the latest token scan.",
        meta: thesis.status
      }
    ];
    return { raw: response, mission: withProviderMetadata(model, providerId, providerLabel) };
  }

  async function executeMission(workspaceIdOrOptions, budgetUsd, options = {}) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.mint || workspaceIdOrOptions.workspaceId || ""
        : workspaceIdOrOptions;
    const effectiveBudget =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.budgetUsd
        : budgetUsd;
    const runResponse = await request(
      "/api/autotrade/run",
      {
        mint: workspaceId,
        testModel: "aig-core"
      },
      true,
      "POST"
    );
    const engineResponse = await request("/api/autotrade/engine/tick", { mint: workspaceId }, true, "POST");
    const mission = normalizePaperCycle({ runResponse, engineResponse, mint: workspaceId });
    mission.executionTrace = {
      ...mission.executionTrace,
      filledAmount: Number(
        effectiveBudget || options.tradeAmountUsd || mission.executionTrace.filledAmount || 0
      )
    };
    return { raw: { runResponse, engineResponse }, mission };
  }

  async function closePosition(workspaceIdOrOptions, positionId) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.mint || workspaceIdOrOptions.workspaceId || ""
        : workspaceIdOrOptions;
    const effectivePositionId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.positionId
        : positionId;
    const response = await request(
      "/api/autotrade/positions/close",
      { positionId: effectivePositionId, mint: workspaceId },
      true,
      "POST"
    );
    const model = createEmptyMissionModel(providerId);
    model.missionStatus = "exited";
    model.activity = [
      {
        ts: String(response?.ts || new Date().toISOString()),
        tone: "info",
        title: "Manual Close",
        message: "Operator closed the active position.",
        meta: workspaceId || ""
      }
    ];
    return { raw: response, mission: withProviderMetadata(model, providerId, providerLabel) };
  }

  async function haltMission(workspaceIdOrOptions) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.workspaceId || workspaceIdOrOptions.mint || ""
        : workspaceIdOrOptions;
    const response = await request("/api/autotrade/halt", {}, true, "POST");
    const model = createEmptyMissionModel(providerId);
    model.missionStatus = "halted";
    model.activity = [
      {
        ts: String(response?.ts || new Date().toISOString()),
        tone: "error",
        title: "Emergency Halt",
        message: "Operator halt is active. New actions are blocked until re-armed.",
        meta: workspaceId || "Legacy runtime"
      }
    ];
    return { raw: response, mission: withProviderMetadata(model, providerId, providerLabel) };
  }

  async function getMissionState(workspaceIdOrOptions) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.workspaceId || workspaceIdOrOptions.mint || ""
        : workspaceIdOrOptions;
    const positions = await request("/api/autotrade/positions", null, true, "GET");
    return {
      raw: positions,
      mission: normalizePositionsResponse((positions?.positions || []).filter((position) => {
        if (!workspaceId) return true;
        return String(position?.mint || "") === String(workspaceId || "");
      }))
    };
  }

  async function getActivity(workspaceIdOrOptions) {
    const workspaceId =
      typeof workspaceIdOrOptions === "object" && workspaceIdOrOptions !== null
        ? workspaceIdOrOptions.workspaceId || workspaceIdOrOptions.mint || ""
        : workspaceIdOrOptions;
    const monitor = await request("/api/autotrade/monitor", null, true, "GET");
    const mission = normalizeMonitorResponse(monitor || {});
    if (workspaceId && mission.livePosition && String(mission.livePosition.mint || "") !== String(workspaceId)) {
      mission.livePosition = null;
      mission.missionStatus = "exited";
    }
    return { raw: monitor, mission };
  }

  return {
    id: providerId,
    label: providerLabel,
    workspaceFiles: OPENCLAW_WORKSPACE_FILES.slice(),
    createEmptyMission() {
      return createEmptyMissionModel(providerId);
    },
    getMissionState,
    previewMission,
    executeMission,
    closePosition,
    haltMission,
    getActivity,
    normalizePaperCycle,
    normalizeMonitorResponse,
    normalizePositionsResponse
  };
}

function createOpenClawWorkspaceArtifacts(workspaceId, mission) {
  const thesis = mission?.thesis || {};
  const executionTrace = mission?.executionTrace || {};
  const livePosition = mission?.livePosition || null;
  const activity = cloneActivity(mission?.activity || []);
  return {
    "SOUL.md": [
      "# OpenClaw Mission Soul",
      "",
      `Workspace: ${workspaceId || "unassigned"}`,
      "Mission profile: Kobecoin AI operator console",
      "Primary workflow: allocate budget, preview thesis, execute, monitor, explain."
    ].join("\n"),
    "USER.md": [
      "# Operator Intent",
      "",
      "- Operator supplies budget only in the primary flow.",
      "- Advanced controls remain secondary and collapsed.",
      "- Scanner Workspace remains isolated from mission execution."
    ].join("\n"),
    "THESIS.md": [
      "# Current Thesis",
      "",
      `Status: ${thesis.status || "SCANNING"}`,
      `Confidence: ${Math.round(Number(thesis.confidence || 0) * 100)}%`,
      `Risk posture: ${thesis.riskPosture || "Standby"}`,
      "",
      thesis.summary || "No thesis recorded yet."
    ].join("\n"),
    "STATE.json": JSON.stringify(
      {
        workspaceId,
        missionStatus: mission?.missionStatus || "scanning",
        provider: "openclaw",
        executionTrace,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    ),
    "POSITIONS.json": JSON.stringify(
      {
        workspaceId,
        positions: livePosition ? [livePosition] : []
      },
      null,
      2
    ),
    "EXECUTIONS.json": JSON.stringify(
      {
        workspaceId,
        activity
      },
      null,
      2
    )
  };
}

export function createFutureOpenClawAgentProvider({ request, fallbackProvider, storage }) {
  const providerId = "openclaw";
  const providerLabel = "OpenClaw Mission Adapter";
  const baseStorage =
    storage ||
    {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {}
    };

  function workspaceKey(workspaceId) {
    return `enigma_openclaw_workspace:${String(workspaceId || "default")}`;
  }

  function readWorkspaceState(workspaceId) {
    try {
      const raw = baseStorage.getItem(workspaceKey(workspaceId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeWorkspaceState(workspaceId, mission) {
    const artifacts = createOpenClawWorkspaceArtifacts(workspaceId, mission);
    const payload = {
      workspaceId,
      provider: providerId,
      workspaceFiles: OPENCLAW_WORKSPACE_FILES.slice(),
      artifacts,
      mission
    };
    try {
      baseStorage.setItem(workspaceKey(workspaceId), JSON.stringify(payload));
    } catch {
      return artifacts;
    }
    return artifacts;
  }

  function wrapMission(workspaceId, mission, extras = {}) {
    const baseMission = mission ? { ...mission, activity: cloneActivity(mission.activity || []) } : createEmptyMissionModel(providerId);
    const stored = readWorkspaceState(workspaceId);
    const artifacts = extras.artifacts || stored?.artifacts || writeWorkspaceState(workspaceId, baseMission);
    const activity = cloneActivity(baseMission.activity || stored?.mission?.activity || []);
    return withProviderMetadata(
      {
        ...baseMission,
        activity
      },
      providerId,
      providerLabel,
      artifacts
    );
  }

  async function getMissionState(workspaceId) {
    const fromRuntime = await fallbackProvider.getMissionState(workspaceId);
    const mission = wrapMission(workspaceId, fromRuntime.mission);
    writeWorkspaceState(workspaceId, mission);
    return { raw: fromRuntime.raw, mission };
  }

  async function previewMission(workspaceId, budgetUsd) {
    const preview = await fallbackProvider.previewMission(workspaceId, budgetUsd);
    const mission = wrapMission(workspaceId, {
      ...preview.mission,
      missionStatus: "planning",
      executionTrace: {
        ...preview.mission.executionTrace,
        previewState: "OpenClaw mission preview ready",
        filledAmount: Number(budgetUsd || 0)
      },
      activity: [
        {
          ts: new Date().toISOString(),
          tone: "info",
          title: "Mission Briefed",
          message: "OpenClaw adapter prepared the mission workspace and preview plan.",
          meta: String(workspaceId || "")
        },
        ...cloneActivity(preview.mission.activity || [])
      ]
    });
    writeWorkspaceState(workspaceId, mission);
    return { raw: preview.raw, mission };
  }

  async function executeMission(workspaceId, budgetUsd, options = {}) {
    const execution = await fallbackProvider.executeMission(workspaceId, budgetUsd, options);
    const mission = wrapMission(workspaceId, {
      ...execution.mission,
      missionStatus: execution.mission.livePosition ? "monitoring" : "executing",
      activity: [
        {
          ts: new Date().toISOString(),
          tone: "ok",
          title: "Execution Routed",
          message: "OpenClaw adapter delegated execution to the guarded runtime.",
          meta: `${Number(budgetUsd || 0).toFixed(2)} USD`
        },
        ...cloneActivity(execution.mission.activity || [])
      ]
    });
    writeWorkspaceState(workspaceId, mission);
    return { raw: execution.raw, mission };
  }

  async function closePosition(workspaceId, positionId) {
    const result = await fallbackProvider.closePosition(workspaceId, positionId);
    const mission = wrapMission(workspaceId, {
      ...result.mission,
      activity: [
        {
          ts: new Date().toISOString(),
          tone: "info",
          title: "Operator Override",
          message: "Position close was routed through the mission adapter.",
          meta: String(positionId || workspaceId || "")
        },
        ...cloneActivity(result.mission.activity || [])
      ]
    });
    writeWorkspaceState(workspaceId, mission);
    return { raw: result.raw, mission };
  }

  async function haltMission(workspaceId) {
    const result = await fallbackProvider.haltMission(workspaceId);
    const mission = wrapMission(workspaceId, {
      ...result.mission,
      activity: [
        {
          ts: new Date().toISOString(),
          tone: "error",
          title: "Mission Halted",
          message: "OpenClaw mission adapter marked the workspace halted.",
          meta: "Operator action"
        },
        ...cloneActivity(result.mission.activity || [])
      ]
    });
    writeWorkspaceState(workspaceId, mission);
    return { raw: result.raw, mission };
  }

  async function getActivity(workspaceId) {
    const activity = await fallbackProvider.getActivity(workspaceId);
    const mission = wrapMission(workspaceId, activity.mission);
    writeWorkspaceState(workspaceId, mission);
    return { raw: activity.raw, mission };
  }

  return {
    id: providerId,
    label: providerLabel,
    workspaceFiles: OPENCLAW_WORKSPACE_FILES.slice(),
    createEmptyMission() {
      return createEmptyMissionModel(providerId);
    },
    getMissionState,
    previewMission,
    executeMission,
    closePosition,
    haltMission,
    getActivity,
    normalizePaperCycle(payload) {
      const mission = fallbackProvider.normalizePaperCycle(payload);
      return wrapMission(payload?.mint || payload?.workspaceId || "", mission);
    },
    normalizeMonitorResponse(response) {
      const mission = fallbackProvider.normalizeMonitorResponse(response);
      const workspaceId = mission.livePosition?.mint || "";
      return wrapMission(workspaceId, mission);
    },
    normalizePositionsResponse(positions = []) {
      const mission = fallbackProvider.normalizePositionsResponse(positions);
      const workspaceId = Array.isArray(positions) && positions[0] ? String(positions[0].mint || "") : "";
      return wrapMission(workspaceId, mission);
    }
  };
}
