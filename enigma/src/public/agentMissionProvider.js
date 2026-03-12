export const OPENCLAW_WORKSPACE_FILES = [
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

function formatCompactPct(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(1)}%`;
}

function formatCompactUsd(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
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
    sessionId: null,
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

function resolveWorkspaceId(value, fallback = "") {
  if (typeof value === "object" && value !== null) {
    return String(value.workspaceId || value.mint || fallback || "").trim();
  }
  return String(value || fallback || "").trim();
}

function resolveBudget(value, fallback = 0) {
  if (typeof value === "object" && value !== null) {
    return Number(value.budgetUsd || fallback || 0);
  }
  return Number(value || fallback || 0);
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
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
    const effectiveBudget = resolveBudget(workspaceIdOrOptions, budgetUsd);
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
      filledAmount: effectiveBudget
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
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
    const effectiveBudget = resolveBudget(workspaceIdOrOptions, budgetUsd);
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
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
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
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
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
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
    const positions = await request("/api/autotrade/positions", null, true, "GET");
    return {
      raw: positions,
      mission: normalizePositionsResponse((positions?.positions || []).filter((position) => {
        if (!workspaceId) return true;
        return String(position?.mint || "") === workspaceId;
      }))
    };
  }

  async function getActivity(workspaceIdOrOptions) {
    const workspaceId = resolveWorkspaceId(workspaceIdOrOptions);
    const monitor = await request("/api/autotrade/monitor", null, true, "GET");
    const mission = normalizeMonitorResponse(monitor || {});
    if (workspaceId && mission.livePosition && String(mission.livePosition.mint || "") !== workspaceId) {
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
      "Primary workflow: allocate budget, preview thesis, execute, monitor, explain.",
      "Execution backend: guarded paper runtime until live execution is explicitly enabled."
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
      thesis.summary || "No thesis recorded yet.",
      "",
      ...(Array.isArray(thesis.reasons) ? thesis.reasons.map((reason) => `- ${reason}`) : [])
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

function createMissionActivity(title, message, tone = "info", meta = "", ts = new Date().toISOString()) {
  return { ts, title, message, tone, meta };
}

function quoteFromSignal(signal, budgetUsd) {
  const tradePlan = signal?.tradePlan || {};
  const entryLow = firstPositive([tradePlan.buyZone?.low]);
  const entryHigh = firstPositive([tradePlan.buyZone?.high, entryLow]);
  const entryMid =
    entryLow && entryHigh ? Number(((entryLow + entryHigh) / 2).toFixed(12)) : firstPositive([entryLow, entryHigh]);
  return {
    budgetUsd: Number(budgetUsd || 0),
    entryLow,
    entryHigh,
    entryMid,
    takeProfit: firstPositive([
      Array.isArray(tradePlan.resistance) ? tradePlan.resistance[0] : tradePlan.resistance
    ]),
    stopLoss: firstPositive([tradePlan.stopLoss]),
    holdHorizon: signal?.marketRegime?.timeframe
      ? `${String(signal.marketRegime.timeframe)} horizon`
      : "Adaptive hold horizon"
  };
}

function createOpenClawRuntimeThesis({ workspaceId, signal, quote, marketSnapshot, position }) {
  const base = buildThesisFromDecisionLike({
    ...(signal || {}),
    mint: workspaceId,
    token: signal?.token || null
  });
  const snapshot = marketSnapshot || signal?.market || {};
  const status = normalizeSignalStatus(signal?.status || signal?.signalStatus);
  const confidence = Math.max(
    0,
    Math.min(1, Number(signal?.confidence ?? signal?.killSwitch?.confidence ?? base.confidence ?? 0))
  );
  const buys = Number(signal?.market?.flow24h?.buys || 0);
  const sells = Number(signal?.market?.flow24h?.sells || 0);
  const bundleRisk = Number(signal?.bundleRiskScore || 0);
  const connected = Number(signal?.holderProfile?.connectedPct || 0);
  const newWallets = Number(signal?.holderProfile?.newWalletPct || 0);
  const reasons = [
    status === "FAVORABLE"
      ? "OpenClaw sees constructive structure and can request guarded execution."
      : status === "CAUTION"
        ? "OpenClaw sees partial confirmation and keeps the mission selective."
        : "OpenClaw sees elevated risk and keeps the mission in observation mode.",
    `Order flow reads ${buys} buys vs ${sells} sells in the latest 24h sample.`,
    `Connected holders ${formatCompactPct(connected)} | new wallets ${formatCompactPct(newWallets)} | bundle risk ${formatCompactPct(bundleRisk)}.`,
    snapshot?.priceUsd ? `Spot ${formatCompactUsd(snapshot.priceUsd)} | liquidity ${formatCompactUsd(signal?.market?.liquidityUsd || 0)}.` : ""
  ].filter(Boolean);
  return {
    ...base,
    status,
    confidence,
    riskPosture:
      bundleRisk >= 55 || connected >= 30
        ? "Defensive"
        : status === "FAVORABLE"
          ? "Constructive"
          : status === "CAUTION"
            ? "Guarded"
            : "Standby",
    actionIntent:
      position
        ? "Manage active position"
        : status === "FAVORABLE"
          ? "Request guarded execution"
          : status === "CAUTION"
            ? "Preview and wait for confirmation"
            : "Stand down",
    executionPosture: position ? "Monitoring guarded execution" : "OpenClaw planned / guarded execution",
    summary:
      position
        ? "OpenClaw is actively supervising a live guarded position."
        : reasons[0] || base.summary,
    reasons,
    note:
      position
        ? "Position is live. OpenClaw keeps adjusting around runtime feedback and market structure."
        : status === "FAVORABLE"
          ? "OpenClaw sees enough structure to request guarded execution."
          : status === "CAUTION"
            ? "OpenClaw keeps the thesis live but execution stays selective."
            : "OpenClaw keeps the token under review and avoids weak structure.",
    priceUsd: Number(snapshot?.priceUsd || base.priceUsd || 0),
    entryLow: firstPositive([quote?.entryLow, base.entryLow]),
    entryHigh: firstPositive([quote?.entryHigh, base.entryHigh]),
    stopLoss: firstPositive([quote?.stopLoss, base.stopLoss]),
    takeProfit: firstPositive([quote?.takeProfit, base.takeProfit]),
    holdHorizon: quote?.holdHorizon || base.holdHorizon
  };
}

export function createOpenClawMissionTools({ request, fallbackProvider }) {
  return {
    async getCurrentWorkspaceToken(input) {
      const workspaceId = resolveWorkspaceId(input);
      if (!workspaceId) throw new Error("workspace token is missing");
      return { workspaceId, mint: workspaceId };
    },
    async getSignalPreview({ mint }) {
      return request("/api/signal", { mint }, true, "POST");
    },
    async getTokenMarketSnapshot({ mint, signalResponse }) {
      if (signalResponse?.signal?.market) return signalResponse.signal.market;
      const latest = await request("/api/signal", { mint }, true, "POST");
      return latest?.signal?.market || {};
    },
    async getQuoteForBudget({ budgetUsd, signalResponse }) {
      return quoteFromSignal(signalResponse?.signal || null, budgetUsd);
    },
    async executeGuardedPaperTrade({ workspaceId, budgetUsd, tradeAmountUsd }) {
      return fallbackProvider.executeMission(
        { workspaceId, mint: workspaceId, budgetUsd, tradeAmountUsd },
        budgetUsd,
        { tradeAmountUsd }
      );
    },
    async getOpenPosition({ workspaceId }) {
      const response = await fallbackProvider.getMissionState({ workspaceId });
      return {
        raw: response.raw,
        position: response?.mission?.livePosition || null,
        mission: response?.mission || null
      };
    },
    async closeOpenPosition({ workspaceId, positionId }) {
      return fallbackProvider.closePosition({ workspaceId, mint: workspaceId, positionId });
    },
    async haltMission({ workspaceId }) {
      return fallbackProvider.haltMission({ workspaceId });
    }
  };
}

export function createOpenClawRuntime({ tools, request, now = () => new Date().toISOString() }) {
  const providerId = "openclaw";
  const providerLabel = "OpenClaw Mission Adapter";

  async function loadWorkspaceSnapshot(workspaceId) {
    try {
      return await request(`/api/mission/workspaces/${encodeURIComponent(workspaceId)}`, null, true, "GET");
    } catch (error) {
      if (Number(error?.status || 0) === 404) {
        return null;
      }
      throw error;
    }
  }

  async function persistMission(workspaceId, mission, options = {}) {
    const workspaceArtifacts = createOpenClawWorkspaceArtifacts(workspaceId, mission);
    const snapshot = await request(
      `/api/mission/workspaces/${encodeURIComponent(workspaceId)}/sync`,
      {
        provider: providerId,
        budgetUsd: Number(options.budgetUsd || mission?.budgetUsd || 0),
        ensureSession: Boolean(options.ensureSession),
        sessionId: options.sessionId || mission?.sessionId || null,
        mission,
        workspaceArtifacts
      },
      true,
      "POST"
    );
    return {
      snapshot,
      mission: withProviderMetadata(
        {
          ...(snapshot?.mission || mission),
          activity: Array.isArray(snapshot?.activity) ? snapshot.activity : mission.activity || [],
          sessionId: snapshot?.sessionId || mission?.sessionId || null
        },
        providerId,
        providerLabel,
        snapshot?.workspaceArtifacts || workspaceArtifacts
      )
    };
  }

  async function wrapMission(workspaceId, mission, options = {}) {
    return persistMission(workspaceId, mission, options);
  }

  function buildMission({
    workspaceId,
    missionStatus,
    signalResponse = null,
    marketSnapshot = null,
    quote = null,
    livePosition = null,
    executionTrace = {},
    activity = [],
    previousMission = null
  }) {
    const mission = {
      ...createEmptyMissionModel(providerId),
      missionStatus,
      thesis: createOpenClawRuntimeThesis({
        workspaceId,
        signal: signalResponse?.signal || previousMission?.rawSignal || null,
        quote,
        marketSnapshot,
        position: livePosition
      }),
      rawSignal: signalResponse?.signal || previousMission?.rawSignal || null,
      livePosition,
      activity: cloneActivity(activity),
      executionTrace: {
        ...createEmptyMissionModel(providerId).executionTrace,
        ...(previousMission?.executionTrace || {}),
        ...executionTrace
      }
    };
    return mission;
  }

  async function previewMission(workspaceIdOrOptions, budgetUsd) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const effectiveBudget = resolveBudget(workspaceIdOrOptions, budgetUsd);
    const signalResponse = await tools.getSignalPreview({ mint: token.mint, budgetUsd: effectiveBudget });
    const marketSnapshot = await tools.getTokenMarketSnapshot({ mint: token.mint, signalResponse });
    const quote = await tools.getQuoteForBudget({ workspaceId: token.workspaceId, budgetUsd: effectiveBudget, signalResponse, marketSnapshot });
    const activity = [
      createMissionActivity("Mission Initialized", "OpenClaw loaded workspace context and budget.", "info", `${effectiveBudget.toFixed(2)} USD`, now()),
      createMissionActivity("Thesis Updated", "OpenClaw synthesized a fresh token thesis from live market and risk signals.", "info", normalizeSignalStatus(signalResponse?.signal?.status), now()),
      createMissionActivity("Confidence Revised", "OpenClaw recalibrated confidence after reading structure, liquidity, and holder pressure.", "info", `${Math.round(Number(signalResponse?.signal?.confidence || 0) * 100)}%`, now()),
      createMissionActivity("Preview Requested", "OpenClaw prepared a guarded execution outline and wrote mission artifacts.", "info", token.workspaceId, now())
    ];
    const mission = buildMission({
      workspaceId: token.workspaceId,
      missionStatus: "planning",
      signalResponse,
      marketSnapshot,
      quote,
      activity,
      executionTrace: {
        previewState: "OpenClaw mission preview ready",
        submitted: "Awaiting Let AI Trade",
        filledAmount: effectiveBudget,
        averageEntry: quote.entryMid,
        stopLoss: quote.stopLoss,
        takeProfit: quote.takeProfit,
        holdHorizon: quote.holdHorizon
      }
    });
    const persisted = await wrapMission(token.workspaceId, mission, { budgetUsd: effectiveBudget });
    return {
      raw: { signal: signalResponse.signal, signalResponse, marketSnapshot, quote, snapshot: persisted.snapshot },
      mission: persisted.mission
    };
  }

  async function executeMission(workspaceIdOrOptions, budgetUsd) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const effectiveBudget = resolveBudget(workspaceIdOrOptions, budgetUsd);
    const preview = await previewMission({ workspaceId: token.workspaceId, mint: token.mint, budgetUsd: effectiveBudget }, effectiveBudget);
    const execution = await tools.executeGuardedPaperTrade({
      workspaceId: token.workspaceId,
      budgetUsd: effectiveBudget,
      tradeAmountUsd: effectiveBudget
    });
    const livePosition = execution?.mission?.livePosition || null;
    const activity = [
      createMissionActivity("Execution Requested", "OpenClaw requested guarded paper execution from the runtime backend.", "ok", `${effectiveBudget.toFixed(2)} USD`, now()),
      createMissionActivity(livePosition ? "Execution Confirmed" : "Execution Deferred", livePosition ? "Guarded runtime confirmed a paper position for the mission." : "Guarded runtime evaluated the mission and kept execution on hold.", livePosition ? "ok" : "info", token.workspaceId, now()),
      ...cloneActivity(preview.mission.activity || []),
      ...cloneActivity(execution?.mission?.activity || [])
    ].slice(0, 40);
    const mission = buildMission({
      workspaceId: token.workspaceId,
      missionStatus: livePosition ? "monitoring" : "executing",
      signalResponse: preview.raw.signalResponse,
      marketSnapshot: preview.raw.marketSnapshot,
      quote: preview.raw.quote,
      livePosition,
      activity,
      executionTrace: {
        previewState: "OpenClaw preview executed",
        submitted: livePosition ? "Execution confirmed" : "Execution evaluated",
        txHash: execution?.mission?.executionTrace?.txHash || "paper-fill",
        filledAmount: execution?.mission?.executionTrace?.filledAmount || effectiveBudget,
        averageEntry: execution?.mission?.executionTrace?.averageEntry || preview.mission.executionTrace.averageEntry,
        stopLoss: execution?.mission?.executionTrace?.stopLoss || preview.mission.executionTrace.stopLoss,
        takeProfit: execution?.mission?.executionTrace?.takeProfit || preview.mission.executionTrace.takeProfit,
        holdHorizon: execution?.mission?.executionTrace?.holdHorizon || preview.mission.executionTrace.holdHorizon,
        currentPnlPct: execution?.mission?.executionTrace?.currentPnlPct ?? null
      }
    });
    const persisted = await wrapMission(token.workspaceId, mission, {
      budgetUsd: effectiveBudget,
      ensureSession: true,
      sessionId: preview.mission?.sessionId || null
    });
    return { raw: { ...preview.raw, execution, snapshot: persisted.snapshot }, mission: persisted.mission };
  }

  async function getMissionState(workspaceIdOrOptions) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const storedSnapshot = await loadWorkspaceSnapshot(token.workspaceId);
    const stored = storedSnapshot?.mission || null;
    const openPosition = await tools.getOpenPosition({ workspaceId: token.workspaceId });
    const livePosition = openPosition?.position || null;
    const mission = buildMission({
      workspaceId: token.workspaceId,
      missionStatus: livePosition ? "monitoring" : stored?.missionStatus || "scanning",
      signalResponse: stored?.rawSignal ? { signal: stored.rawSignal } : null,
      marketSnapshot: stored?.rawSignal?.market || null,
      quote: {
        entryMid: stored?.executionTrace?.averageEntry || null,
        stopLoss: stored?.executionTrace?.stopLoss || null,
        takeProfit: stored?.executionTrace?.takeProfit || null,
        holdHorizon: stored?.executionTrace?.holdHorizon || null
      },
      livePosition,
      previousMission: stored,
      activity: cloneActivity(stored?.activity || []),
      executionTrace: {
        ...(stored?.executionTrace || {}),
        currentPnlPct: openPosition?.mission?.executionTrace?.currentPnlPct ?? stored?.executionTrace?.currentPnlPct ?? null
      }
    });
    const persisted = await wrapMission(token.workspaceId, {
      ...mission,
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    }, {
      budgetUsd: Number(storedSnapshot?.budgetUsd || stored?.budgetUsd || 0),
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    });
    return { raw: openPosition?.raw || storedSnapshot || null, mission: persisted.mission };
  }

  async function getActivity(workspaceIdOrOptions) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const state = await getMissionState(workspaceIdOrOptions);
    const mission = {
      ...state.mission,
      activity: [
        createMissionActivity(
          "Monitoring Tick",
          state.mission.livePosition
            ? "OpenClaw refreshed the mission after a monitoring pass."
            : "OpenClaw checked the workspace and found no active guarded position.",
          "info",
          token.workspaceId,
          now()
        ),
        ...cloneActivity(state.mission.activity || [])
      ].slice(0, 40)
    };
    const persisted = await wrapMission(token.workspaceId, mission, {
      budgetUsd: Number(state.raw?.budgetUsd || state.mission?.budgetUsd || 0),
      sessionId: state.mission?.sessionId || state.raw?.sessionId || null
    });
    return { raw: state.raw, mission: persisted.mission };
  }

  async function closePosition(workspaceIdOrOptions, positionId) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const response = await tools.closeOpenPosition({ workspaceId: token.workspaceId, positionId });
    const storedSnapshot = await loadWorkspaceSnapshot(token.workspaceId);
    const stored = storedSnapshot?.mission || null;
    const mission = buildMission({
      workspaceId: token.workspaceId,
      missionStatus: "exited",
      signalResponse: stored?.rawSignal ? { signal: stored.rawSignal } : null,
      marketSnapshot: stored?.rawSignal?.market || null,
      previousMission: stored,
      activity: [
        createMissionActivity("Position Closed", "OpenClaw acknowledged the operator close and archived the mission.", "info", token.workspaceId, now()),
        ...cloneActivity(response?.mission?.activity || stored?.activity || [])
      ],
      executionTrace: {
        ...(stored?.executionTrace || {}),
        submitted: "Closed by operator",
        currentPnlPct: null
      }
    });
    const persisted = await wrapMission(token.workspaceId, {
      ...mission,
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    }, {
      budgetUsd: Number(storedSnapshot?.budgetUsd || 0),
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    });
    return { raw: response?.raw || response, mission: persisted.mission };
  }

  async function haltMission(workspaceIdOrOptions) {
    const token = await tools.getCurrentWorkspaceToken(workspaceIdOrOptions);
    const response = await tools.haltMission({ workspaceId: token.workspaceId });
    const storedSnapshot = await loadWorkspaceSnapshot(token.workspaceId);
    const stored = storedSnapshot?.mission || null;
    const mission = buildMission({
      workspaceId: token.workspaceId,
      missionStatus: "halted",
      signalResponse: stored?.rawSignal ? { signal: stored.rawSignal } : null,
      marketSnapshot: stored?.rawSignal?.market || null,
      previousMission: stored,
      activity: [
        createMissionActivity("Halt Acknowledged", "OpenClaw marked the mission halted and blocked further actions.", "error", token.workspaceId, now()),
        ...cloneActivity(response?.mission?.activity || stored?.activity || [])
      ],
      executionTrace: {
        ...(stored?.executionTrace || {}),
        submitted: "Halt engaged"
      }
    });
    const persisted = await wrapMission(token.workspaceId, {
      ...mission,
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    }, {
      budgetUsd: Number(storedSnapshot?.budgetUsd || 0),
      sessionId: storedSnapshot?.sessionId || stored?.sessionId || null
    });
    return { raw: response?.raw || response, mission: persisted.mission };
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
    getActivity
  };
}

export function createOpenClawAgentProvider({ request, fallbackProvider, storage }) {
  const tools = createOpenClawMissionTools({ request, fallbackProvider });
  const runtime = createOpenClawRuntime({ tools, request, storage });
  return {
    ...runtime,
    normalizePaperCycle(payload) {
      const legacyMission = fallbackProvider.normalizePaperCycle(payload);
      const workspaceId = resolveWorkspaceId(payload?.mint || payload?.workspaceId || "");
      const mission = {
        ...legacyMission,
        thesis: createOpenClawRuntimeThesis({
          workspaceId,
          signal: payload?.runResponse?.decisions?.[0] || null,
          quote: payload?.runResponse?.decisions?.[0]
            ? quoteFromSignal(payload.runResponse.decisions[0], legacyMission.executionTrace?.filledAmount || 0)
            : null,
          marketSnapshot: payload?.runResponse?.decisions?.[0]?.market || null,
          position: legacyMission.livePosition || null
        }),
        activity: [
          createMissionActivity("Execution Delegated", "OpenClaw synchronized guarded execution into mission state.", "info", workspaceId),
          ...cloneActivity(legacyMission.activity || [])
        ]
      };
      return withProviderMetadata(
        mission,
        "openclaw",
        "OpenClaw Mission Adapter",
        createOpenClawWorkspaceArtifacts(workspaceId, mission)
      );
    },
    normalizeMonitorResponse(response) {
      const legacyMission = fallbackProvider.normalizeMonitorResponse(response);
      const workspaceId = legacyMission.livePosition?.mint || "";
      const mission = {
        ...legacyMission,
        activity: [
          createMissionActivity("Monitoring Tick", "OpenClaw refreshed guarded runtime monitoring state.", "info", workspaceId),
          ...cloneActivity(legacyMission.activity || [])
        ]
      };
      return withProviderMetadata(mission, "openclaw", "OpenClaw Mission Adapter", createOpenClawWorkspaceArtifacts(workspaceId, mission));
    },
    normalizePositionsResponse(positions = []) {
      const legacyMission = fallbackProvider.normalizePositionsResponse(positions);
      const workspaceId = Array.isArray(positions) && positions[0] ? String(positions[0].mint || "") : "";
      return withProviderMetadata(legacyMission, "openclaw", "OpenClaw Mission Adapter", createOpenClawWorkspaceArtifacts(workspaceId, legacyMission));
    }
  };
}

export function createFutureOpenClawAgentProvider(options) {
  return createOpenClawAgentProvider(options);
}
