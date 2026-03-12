import { buildMarketRegimeViewModel } from "./marketRegimeView.js";
import {
  createEmptyMissionModel,
  createFutureOpenClawAgentProvider,
  createLegacyPaperAgentProvider
} from "./agentMissionProvider.js";

const authState = document.querySelector("#auth-state");
const showScannerWorkspaceButton = document.querySelector("#show-scanner-workspace");
const showAgentWorkspaceButton = document.querySelector("#show-agent-workspace");
const showProfileWorkspaceButton = document.querySelector("#show-profile-workspace");
const workspaceSummary = document.querySelector("#workspace-summary");
const networkStatusBadge = document.querySelector("#network-status");
const brandLogo = document.querySelector(".brand-logo");
const sidebarNebula = document.querySelector("#sidebar-nebula");
const sidebarOrb = document.querySelector("#sidebar-orb");
const sidebarHero = document.querySelector("#sidebar-hero");
const sidebarShapeA = document.querySelector("#sidebar-shape-a");
const sidebarShapeB = document.querySelector("#sidebar-shape-b");
const sidebarShapeC = document.querySelector("#sidebar-shape-c");
const mainHeroVisual = document.querySelector("#main-hero-visual");
const mainShapesVisual = document.querySelector("#main-shapes-visual");
const refreshProfileWorkspaceButton = document.querySelector("#refresh-profile-workspace");
const manualMintInput = document.querySelector("#manual-mint");
const scannerModeNote = document.querySelector("#scanner-mode-note");
const riskPresetSelect = document.querySelector("#risk-preset");
const thresholdFavorablePatternInput = document.querySelector("#threshold-favorable-pattern");
const thresholdRiskKillInput = document.querySelector("#threshold-risk-kill");
const thresholdConnectedMaxInput = document.querySelector("#threshold-connected-max");
const statsGrid = document.querySelector("#stats-grid");
const statsMeta = document.querySelector("#stats-meta");
const heatmapStrip = document.querySelector("#heatmap-strip");
const sessionTrend = document.querySelector("#session-trend");
const signalFeed = document.querySelector("#signal-feed");
const resultFilterSelect = document.querySelector("#result-filter");
const resultSortSelect = document.querySelector("#result-sort");
const discoveryList = document.querySelector("#discovery-list");
const messages = document.querySelector("#messages");
const alertFeed = document.querySelector("#alert-feed");
const scanStatus = document.querySelector("#scan-status");
const toastStack = document.querySelector("#toast-stack");
const fullscreenLoader = document.querySelector("#fullscreen-loader");
const fullscreenLoaderText = document.querySelector("#fullscreen-loader-text");
const fullscreenLoaderLogo = document.querySelector("#fullscreen-loader-logo");
const planStatus = document.querySelector("#plan-status");
const paperTestStatus = document.querySelector("#paper-test-status");
const paperMinPatternInput = document.querySelector("#paper-min-pattern");
const paperMinConfidenceInput = document.querySelector("#paper-min-confidence");
const paperMaxConnectedInput = document.querySelector("#paper-max-connected");
const paperAllowCautionInput = document.querySelector("#paper-allow-caution");
const paperAllowHighRiskInput = document.querySelector("#paper-allow-high-risk");
const paperTestModelSelect = document.querySelector("#paper-test-model");
const paperTestModelNote = document.querySelector("#paper-test-model-note");
const paperMaxPositionInput = document.querySelector("#paper-max-position");
const paperBudgetInput = document.querySelector("#paper-budget");
const paperIntervalInput = document.querySelector("#paper-interval");
const agentPreviewPlanButton = document.querySelector("#agent-preview-plan");
const agentClosePositionButton = document.querySelector("#agent-close-position");
const agentEmergencyHaltButton = document.querySelector("#agent-emergency-halt");
const agentCurrentTokenAvatar = document.querySelector("#agent-current-token-avatar");
const agentCurrentTokenLabel = document.querySelector("#agent-current-token-label");
const agentCurrentTokenMint = document.querySelector("#agent-current-token-mint");
const agentProviderBadge = document.querySelector("#agent-provider-badge");
const agentMissionStatusLabel = document.querySelector("#agent-mission-status-label");
const agentMissionStatusNote = document.querySelector("#agent-mission-status-note");
const agentRiskPosture = document.querySelector("#agent-risk-posture");
const agentRiskPostureNote = document.querySelector("#agent-risk-posture-note");
const agentActionIntent = document.querySelector("#agent-action-intent");
const agentActionIntentNote = document.querySelector("#agent-action-intent-note");
const agentExecutionPosture = document.querySelector("#agent-execution-posture");
const agentExecutionPostureNote = document.querySelector("#agent-execution-posture-note");
const agentThesisSummary = document.querySelector("#agent-thesis-summary");
const agentThesisReasons = document.querySelector("#agent-thesis-reasons");
const agentConfidenceMeter = document.querySelector("#agent-confidence-meter");
const agentExecutionMode = document.querySelector("#agent-execution-mode");
const agentExecutionTrace = document.querySelector("#agent-execution-trace");
const agentPriceStripPrice = document.querySelector("#agent-price-strip-price");
const agentPriceStripContext = document.querySelector("#agent-price-strip-context");
const agentActivityFeed = document.querySelector("#agent-activity-feed");
const agentAdvancedDrawer = document.querySelector("#agent-advanced-drawer");
const agentDiagnosticsDrawer = document.querySelector("#agent-diagnostics-drawer");
const agentSessionHistory = document.querySelector("#agent-session-history");
const agentWorkerDiagnostics = document.querySelector("#agent-worker-diagnostics");
const agentModeView = document.querySelector("#agent-mode-view");
const agentTrailingPreview = document.querySelector("#agent-trailing-preview");
const agentOpenSlotsPreview = document.querySelector("#agent-open-slots-preview");
const agentHaltState = document.querySelector("#agent-halt-state");
const agentProviderTag = document.querySelector("#agent-provider-tag");
const paperBeginner25Button = document.querySelector("#paper-beginner-25");
const paperSummary = document.querySelector("#paper-summary");
const paperSessionTiming = document.querySelector("#paper-session-timing");
const paperResults = document.querySelector("#paper-results");
const paperEquityChart = document.querySelector("#paper-equity-chart");
const paperPerformanceSummary = document.querySelector("#paper-performance-summary");
const paperPerformanceRuns = document.querySelector("#paper-performance-runs");
const agentTargetMintInput = document.querySelector("#agent-target-mint");
const agentOperatingPresetSelect = document.querySelector("#agent-operating-preset");
const agentRunTestButton = document.querySelector("#agent-run-test");
const agentRunLiveButton = document.querySelector("#agent-run-live");
const agentStopAllButton = document.querySelector("#agent-stop-all");
const agentPriceStatus = document.querySelector("#agent-price-status");
const agentPriceChart = document.querySelector("#agent-price-chart");
const agentPriceMeta = document.querySelector("#agent-price-meta");
const dashboardProfileOverview = document.querySelector("#dashboard-profile-overview");
const dashboardSignalTimeline = document.querySelector("#dashboard-signal-timeline");
const dashboardPaymentHistory = document.querySelector("#dashboard-payment-history");
const dashboardPositionHistory = document.querySelector("#dashboard-position-history");
const dashboardWithdrawHistory = document.querySelector("#dashboard-withdraw-history");
const engineAmountInput = document.querySelector("#engine-amount");
const engineMaxOpenInput = document.querySelector("#engine-max-open");
const engineTpInput = document.querySelector("#engine-tp");
const engineSlInput = document.querySelector("#engine-sl");
const engineTrailingInput = document.querySelector("#engine-trailing");
const engineHoldMinutesInput = document.querySelector("#engine-hold-minutes");
const engineCooldownInput = document.querySelector("#engine-cooldown");
const enginePollInput = document.querySelector("#engine-poll");
const engineSummary = document.querySelector("#engine-summary");
const engineOpenPositions = document.querySelector("#engine-open-positions");
const tradeActivityChart = document.querySelector("#trade-activity-chart");
const tradeActivityLog = document.querySelector("#trade-activity-log");
const tradeActivityClearButton = document.querySelector("#trade-activity-clear");
const liveMonitorStatus = document.querySelector("#live-monitor-status");
const agentScannerSummary = document.querySelector("#agent-scanner-summary");

const connectWalletButton = document.querySelector("#connect-wallet");
const applyProPresetButton = document.querySelector("#apply-pro-preset");
const discoverTokensButton = document.querySelector("#discover-tokens");
const scanManualButton = document.querySelector("#scan-manual");
const alertFavorableInput = document.querySelector("#alert-favorable");
const alertHighRiskInput = document.querySelector("#alert-high-risk");
const alertSoundInput = document.querySelector("#alert-sound");
const enableBrowserAlertsButton = document.querySelector("#enable-browser-alerts");
const paperStartLoopButton = document.querySelector("#paper-start-loop");
const paperStopLoopButton = document.querySelector("#paper-stop-loop");
const agentSaveTargetButton = document.querySelector("#agent-save-target");
const engineStartLoopButton = document.querySelector("#engine-start-loop");
const engineStopLoopButton = document.querySelector("#engine-stop-loop");
const PAPER_ONLY_MODE = true;
const LIVE_MODE_PREVIEW_DISABLED = PAPER_ONLY_MODE;
const HOLDER_SAMPLE_LIMIT = 10;
const HOLDER_DEEP_LIMIT = 20;
const KOBX_MINT = "48iJcUv9jsiZ7cCisyVFLPFLMoNBKg3L43bRvktXpump";
const KOBX_REQUIRED_BALANCE = 500_000;
const KOBX_BUY_URL = `https://pump.fun/coin/${KOBX_MINT}`;
const PAPER_RUN_MAX_MINUTES = 8;
const OPENCLAW_PROVIDER_ENABLED =
  localStorage.getItem("enigma_agent_provider") !== "legacy-paper";
const AGENT_MISSION_SESSION_KEY = "enigma_agent_session_id";

let authToken = "";
let userWallet = localStorage.getItem("enigma_wallet") || "";
let userPlan = localStorage.getItem("enigma_plan") || "free";
let agentTargetMints = [];
let agentTargetMint = "";
let lastSignalItems = [];
let historicalStats = null;
let alertEvents = [];
let sessionTrendPoints = [];
let paperTradeTimer = null;
let paperRunCapTimer = null;
let paperRunHistory = [];
let paperRunInFlight = false;
let paperSessionStartedAt = null;
let paperSessionStoppedAt = null;
let engineTimer = null;
let engineTickInFlight = false;
let realtimeMonitorTimer = null;
let realtimeMonitorInFlight = false;
let realtimeMonitorMode = "paper";
let agentPriceTimer = null;
let agentPriceInFlight = false;
let agentPricePoints = [];
let agentPriceWindowSec = normalizeAgentPriceWindowSec(
  Number(localStorage.getItem("enigma_agent_price_window_sec") || 300)
);
let profileWorkspaceLoadedAt = 0;
let profileWorkspaceLoading = false;
let scannerAccessStatus = null;
let tradeActivityEvents = [];
let tradeActivitySystemNotes = [];
let latestEngineOpenPositions = [];
let reconnectTimer = null;
let reconnectBackoffMs = 5000;
let reconnectNoticeShown = false;
let agentPriceLastErrorNoticeTs = 0;
let fullscreenBlockDepth = 0;
const recentErrorNoticeByKey = new Map();
const sessionAnalytics = {
  batches: 0,
  tokensSeen: 0,
  favorable: 0,
  caution: 0,
  highRisk: 0,
  patternTotal: 0,
  confidenceTotal: 0,
  connectedTotal: 0,
  lastBatchAt: ""
};
const previousStatusByMint = new Map();
const thresholdStateByMint = new Map();
const alertPrefs = {
  favorable: localStorage.getItem("enigma_alert_favorable") !== "0",
  highRisk: localStorage.getItem("enigma_alert_highrisk") !== "0",
  sound: localStorage.getItem("enigma_alert_sound") !== "0"
};
const riskPresets = {
  conservative: { favorablePatternMin: 80, riskKillMax: 62, connectedMax: 18 },
  balanced: { favorablePatternMin: 72, riskKillMax: 50, connectedMax: 25 },
  aggressive: { favorablePatternMin: 66, riskKillMax: 40, connectedMax: 34 }
};
const engineExitPresets = {
  scalp: {
    tpPct: 2.2,
    slPct: 1.2,
    trailingStopPct: 0.8,
    maxHoldMinutes: 8,
    cooldownSec: 8,
    pollIntervalSec: 5
  },
  balanced: {
    tpPct: 8,
    slPct: 4,
    trailingStopPct: 3,
    maxHoldMinutes: 120,
    cooldownSec: 30,
    pollIntervalSec: 15
  },
  swing: {
    tpPct: 14,
    slPct: 6,
    trailingStopPct: 4.5,
    maxHoldMinutes: 360,
    cooldownSec: 45,
    pollIntervalSec: 20
  }
};
const CORE_AGENT_MODEL_KEY = "guardian_core";
const paperTestModels = {
  [CORE_AGENT_MODEL_KEY]: {
    label: "AIG Core",
    minPatternScore: 68,
    minConfidence: 0.72,
    maxConnectedHolderPct: 25,
    allowCautionEntries: true,
    allowHighRiskEntries: false,
    description: "Single production model for autonomous paper trading with fixed internal risk rules."
  }
};
const CORE_ENGINE_PROFILE = {
  maxOpenPositions: 1,
  tpPct: 8,
  slPct: 4,
  trailingStopPct: 3,
  maxHoldMinutes: 120,
  cooldownSec: 30
};
const DEFAULT_AGENT_MISSION_STATE = {
  missionStatus: "scanning",
  budgetUsd: 100,
  preview: null,
  decision: null,
  position: null,
  activity: [],
  isPreviewLoading: false,
  isExecuteLoading: false,
  emergencyStopEnabled: false,
  advancedOpen: false,
  error: null,
  missionModel: createEmptyMissionModel(OPENCLAW_PROVIDER_ENABLED ? "openclaw" : "legacy-paper"),
  executionTrace: {
    previewState: "Not started",
    submitted: "-",
    txHash: "-",
    filledAmount: "-",
    averageEntry: "-",
    stopLoss: "-",
    takeProfit: "-",
    holdHorizon: "-",
    currentPnl: "-"
  }
};
let agentTradeState = { ...DEFAULT_AGENT_MISSION_STATE };
let agentMissionStream = null;
let agentMissionStreamWorkspaceId = "";
let agentMissionStreamReconnectTimer = null;
let agentMissionStreamStatus = "idle";
let agentMissionLastEventAt = "";
let agentMissionLastHeartbeatAt = "";
let agentMissionDiagnostics = null;
let agentMissionSessions = [];
const legacyPaperAgentProvider = createLegacyPaperAgentProvider({ request: api });
const futureOpenClawAgentProvider = createFutureOpenClawAgentProvider({
  request: api,
  fallbackProvider: legacyPaperAgentProvider,
  storage: window.localStorage
});

function getActiveAgentProvider() {
  return OPENCLAW_PROVIDER_ENABLED ? futureOpenClawAgentProvider : legacyPaperAgentProvider;
}

function stopAgentMissionStream() {
  if (agentMissionStreamReconnectTimer) {
    clearTimeout(agentMissionStreamReconnectTimer);
    agentMissionStreamReconnectTimer = null;
  }
  if (agentMissionStream) {
    agentMissionStream.close();
    agentMissionStream = null;
  }
  agentMissionStreamWorkspaceId = "";
  agentMissionStreamStatus = "idle";
}

function saveAgentMissionSessionId(sessionId) {
  const normalized = String(sessionId || "").trim();
  if (!normalized) {
    localStorage.removeItem(AGENT_MISSION_SESSION_KEY);
    return;
  }
  localStorage.setItem(AGENT_MISSION_SESSION_KEY, normalized);
}

function getStoredAgentMissionSessionId() {
  return String(localStorage.getItem(AGENT_MISSION_SESSION_KEY) || "").trim();
}

function appendAgentMissionActivity(item) {
  if (!item || typeof item !== "object") return;
  const current = Array.isArray(agentTradeState.activity) ? agentTradeState.activity : [];
  const next = [item, ...current].filter(Boolean).slice(0, 40);
  updateAgentTradeState({
    activity: next,
    missionModel: {
      ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
      activity: next
    }
  });
}

function applyMissionStreamSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const missionModel = snapshot.mission || null;
  if (!missionModel) return;
  const normalizedMissionModel = {
    ...missionModel,
    sessionId: snapshot.sessionId || missionModel.sessionId || null
  };
  saveAgentMissionSessionId(normalizedMissionModel.sessionId);
  updateAgentTradeState({
    missionStatus: normalizedMissionModel.missionStatus || agentTradeState.missionStatus,
    missionModel: normalizedMissionModel,
    activity: Array.isArray(snapshot.activity) ? snapshot.activity : normalizedMissionModel.activity || [],
    position: normalizedMissionModel.livePosition || null,
    executionTrace: {
      previewState: normalizedMissionModel.executionTrace?.previewState || agentTradeState.executionTrace.previewState,
      submitted: normalizedMissionModel.executionTrace?.submitted || agentTradeState.executionTrace.submitted,
      txHash: normalizedMissionModel.executionTrace?.txHash || agentTradeState.executionTrace.txHash,
      filledAmount: normalizedMissionModel.executionTrace?.filledAmount ?? agentTradeState.executionTrace.filledAmount,
      averageEntry: normalizedMissionModel.executionTrace?.averageEntry ?? agentTradeState.executionTrace.averageEntry,
      stopLoss: normalizedMissionModel.executionTrace?.stopLoss ?? agentTradeState.executionTrace.stopLoss,
      takeProfit: normalizedMissionModel.executionTrace?.takeProfit ?? agentTradeState.executionTrace.takeProfit,
      holdHorizon: normalizedMissionModel.executionTrace?.holdHorizon || agentTradeState.executionTrace.holdHorizon,
      currentPnl: normalizedMissionModel.executionTrace?.currentPnlPct ?? agentTradeState.executionTrace.currentPnl
    }
  });
}

function applyMissionStreamSessionEvent(payload) {
  if (!payload || typeof payload !== "object") return;
  agentMissionLastEventAt = String(payload.ts || new Date().toISOString());
  saveAgentMissionSessionId(payload.sessionId);
  if (payload.sessionId) {
    updateAgentTradeState({
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        sessionId: payload.sessionId
      }
    });
  }
}

function applyMissionStreamStatusEvent(payload) {
  if (!payload || typeof payload !== "object") return;
  agentMissionLastEventAt = String(payload.ts || new Date().toISOString());
  const nextStatus = String(payload.missionStatus || "").trim().toLowerCase();
  if (!nextStatus) return;
  updateAgentTradeState({
    missionStatus: nextStatus,
    missionModel: {
      ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
      missionStatus: nextStatus,
      sessionId: payload.sessionId || agentTradeState.missionModel?.sessionId || null
    }
  });
}

function applyMissionStreamActivityEvent(payload) {
  if (!payload || typeof payload !== "object" || !payload.activity) return;
  agentMissionLastEventAt = String(payload.activity?.ts || new Date().toISOString());
  if (payload.sessionId) {
    saveAgentMissionSessionId(payload.sessionId);
  }
  appendAgentMissionActivity(payload.activity);
}

function startAgentMissionStream(workspaceId) {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  if (!normalizedWorkspaceId || !authToken || getActiveAgentProvider().id !== "openclaw") {
    stopAgentMissionStream();
    return;
  }
  if (agentMissionStreamWorkspaceId === normalizedWorkspaceId && agentMissionStream) {
    return;
  }
  stopAgentMissionStream();
  agentMissionStreamWorkspaceId = normalizedWorkspaceId;
  agentMissionStreamStatus = "connecting";
  const source = new EventSource(
    `/api/mission/workspaces/${encodeURIComponent(normalizedWorkspaceId)}/stream`
  );
  source.addEventListener("snapshot", (event) => {
    try {
      const payload = JSON.parse(event.data || "{}");
      if (payload?.snapshot) {
        agentMissionStreamStatus = "live";
        agentMissionLastEventAt = String(payload.snapshot?.updatedAt || new Date().toISOString());
        applyMissionStreamSnapshot(payload.snapshot);
      }
    } catch {}
  });
  source.addEventListener("heartbeat", (event) => {
    try {
      const payload = JSON.parse(event.data || "{}");
      agentMissionStreamStatus = "live";
      agentMissionLastHeartbeatAt = String(payload.ts || new Date().toISOString());
      renderAgentDiagnostics();
    } catch {}
  });
  source.addEventListener("session", (event) => {
    try {
      applyMissionStreamSessionEvent(JSON.parse(event.data || "{}"));
    } catch {}
  });
  source.addEventListener("status", (event) => {
    try {
      applyMissionStreamStatusEvent(JSON.parse(event.data || "{}"));
    } catch {}
  });
  source.addEventListener("activity", (event) => {
    try {
      applyMissionStreamActivityEvent(JSON.parse(event.data || "{}"));
    } catch {}
  });
  source.onerror = () => {
    if (agentMissionStream) {
      agentMissionStream.close();
      agentMissionStream = null;
    }
    agentMissionStreamStatus = "reconnecting";
    renderAgentDiagnostics();
    if (agentMissionStreamReconnectTimer || !authToken || agentMissionStreamWorkspaceId !== normalizedWorkspaceId) {
      return;
    }
    agentMissionStreamReconnectTimer = setTimeout(() => {
      agentMissionStreamReconnectTimer = null;
      if (agentMissionStreamWorkspaceId === normalizedWorkspaceId) {
        startAgentMissionStream(normalizedWorkspaceId);
      }
    }, 4000);
  };
  agentMissionStream = source;
  renderAgentDiagnostics();
}

async function restoreAgentMissionSession(workspaceId) {
  const sessionId = getStoredAgentMissionSessionId();
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  if (!sessionId || !normalizedWorkspaceId || !authToken || getActiveAgentProvider().id !== "openclaw") {
    return false;
  }
  try {
    const snapshot = await api(
      `/api/mission/sessions/${encodeURIComponent(sessionId)}`,
      null,
      true,
      "GET"
    );
    if (!snapshot || String(snapshot.workspaceId || "") !== normalizedWorkspaceId) {
      return false;
    }
    applyMissionStreamSnapshot(snapshot);
    return true;
  } catch (error) {
    if (Number(error?.status || 0) === 404) {
      saveAgentMissionSessionId("");
      return false;
    }
    throw error;
  }
}

async function loadAgentMissionSessions(workspaceId) {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  if (!normalizedWorkspaceId || !authToken || getActiveAgentProvider().id !== "openclaw") {
    agentMissionSessions = [];
    renderMissionSessionHistory();
    return [];
  }
  const response = await api(
    `/api/mission/workspaces/${encodeURIComponent(normalizedWorkspaceId)}/sessions?limit=12`,
    null,
    true,
    "GET"
  );
  agentMissionSessions = Array.isArray(response?.sessions) ? response.sessions : [];
  renderMissionSessionHistory();
  return agentMissionSessions;
}

async function loadAgentMissionDiagnostics(workspaceId) {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  if (!normalizedWorkspaceId || !authToken || getActiveAgentProvider().id !== "openclaw") {
    agentMissionDiagnostics = null;
    renderAgentDiagnostics();
    return null;
  }
  const response = await api(
    `/api/mission/workspaces/${encodeURIComponent(normalizedWorkspaceId)}/diagnostics`,
    null,
    true,
    "GET"
  );
  agentMissionDiagnostics = response || null;
  renderAgentDiagnostics();
  return agentMissionDiagnostics;
}

function getPaperTestModelLabel(key) {
  const model = paperTestModels[String(key || "").trim().toLowerCase()];
  return model?.label || "AIG Core";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setNetworkStatus(text, tone = "ok") {
  if (!networkStatusBadge) return;
  networkStatusBadge.textContent = text;
  networkStatusBadge.classList.remove("ok", "busy", "error");
  if (tone) {
    networkStatusBadge.classList.add(tone);
  }
}

function annotateApiError(error, patch = {}) {
  if (!error || typeof error !== "object") return error;
  Object.entries(patch).forEach(([key, value]) => {
    if (!(key in error)) {
      error[key] = value;
    }
  });
  return error;
}

function isAuthFailure(error) {
  const status = Number(error?.status || 0);
  return status === 401 || status === 403 || String(error?.code || "") === "AUTH_REQUIRED";
}

function isTransientApiFailure(error) {
  if (!error) return false;
  if (error.name === "AbortError") return true;
  if (error.transient) return true;
  const status = Number(error.status || 0);
  if ([408, 425, 500, 502, 503, 504].includes(status)) return true;
  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("temporary gateway response")
  );
}

function scheduleSessionReconnect(reason = "connection issue") {
  if (reconnectTimer || !authToken) return;
  const waitMs = reconnectBackoffMs;
  reconnectBackoffMs = Math.min(60000, Math.floor(reconnectBackoffMs * 1.7));
  setNetworkStatus(`Reconnecting (${Math.ceil(waitMs / 1000)}s)`, "busy");
  if (!reconnectNoticeShown) {
    reconnectNoticeShown = true;
    pushMessage(`Connection unstable (${reason}). Auto-retrying session sync.`, "error");
  }
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await hydrateSession();
  }, waitMs);
}
const agentTempoPresets = {
  scalp_1m: {
    label: "1m Scalp",
    paperIntervalSec: 10,
    enginePollSec: 5,
    maxOpenPositions: 8,
    tpPct: 1.8,
    slPct: 1.0,
    trailingStopPct: 0.6,
    maxHoldMinutes: 20,
    cooldownSec: 5,
    minPatternScore: 0,
    minConfidence: 0.45,
    maxConnectedHolderPct: 60,
    allowCautionEntries: true,
    allowHighRiskEntries: true
  },
  momentum_5m: {
    label: "5m Momentum",
    paperIntervalSec: 15,
    enginePollSec: 10,
    maxOpenPositions: 6,
    tpPct: 3.2,
    slPct: 1.8,
    trailingStopPct: 1.1,
    maxHoldMinutes: 75,
    cooldownSec: 10,
    minPatternScore: 10,
    minConfidence: 0.72,
    maxConnectedHolderPct: 30,
    allowCautionEntries: true,
    allowHighRiskEntries: false
  },
  cycle_15m: {
    label: "15m Cycle",
    paperIntervalSec: 30,
    enginePollSec: 15,
    maxOpenPositions: 4,
    tpPct: 4.8,
    slPct: 2.4,
    trailingStopPct: 1.6,
    maxHoldMinutes: 180,
    cooldownSec: 20,
    minPatternScore: 20,
    minConfidence: 0.75,
    maxConnectedHolderPct: 26,
    allowCautionEntries: false,
    allowHighRiskEntries: false
  }
};
const alertThresholds = {
  favorablePatternMin: Number(localStorage.getItem("enigma_threshold_fav_pattern") || 72),
  riskKillMax: Number(localStorage.getItem("enigma_threshold_risk_kill") || 50),
  connectedMax: Number(localStorage.getItem("enigma_threshold_connected_max") || 25)
};
const expandedHolders = new Set();
const loadingHolders = new Set();
const mintDisplayCache = new Map();
const PROFILE_WORKSPACE_CACHE_MS = 30 * 1000;
const AGENT_PRICE_POLL_MS = 5000;
const MANUAL_SCAN_TIMEOUT_MS = 90000;
function applyTheme() {
  document.body.classList.remove("theme-light");
  document.body.classList.add("theme-dark");
  document.body.dataset.theme = "dark";
}

function initBrandLogoAsset() {
  if (!brandLogo) return;
  resolveFirstAsset(["/assets/icon.png"]).then((logoPng) => {
    if (!logoPng) return;
    brandLogo.src = logoPng;
    if (fullscreenLoaderLogo) {
      fullscreenLoaderLogo.src = logoPng;
    }
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.setAttribute("href", logoPng);
      favicon.setAttribute("type", "image/png");
    }
  });
}

function probeImageAsset(path) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(path);
    probe.onerror = () => resolve("");
    probe.src = path;
  });
}

async function resolveFirstAsset(paths = []) {
  for (const path of paths) {
    const ok = await probeImageAsset(path);
    if (ok) return ok;
  }
  return "";
}

async function initSidebarVisualAssets() {
  const [nebulaAsset, characterAsset, shapesAsset, orbAsset] = await Promise.all([
    resolveFirstAsset([
      "/assets/bg-nebula.jpg",
      "/assets/bg-nebula.png",
    ]),
    resolveFirstAsset([
      "/assets/hero-character.png",
      "/assets/hero.png"
    ]),
    resolveFirstAsset([
      "/assets/floating-shapes.png",
    ]),
    resolveFirstAsset([
      "/assets/orb-glow.png",
    ])
  ]);

  if (sidebarNebula && nebulaAsset) {
    sidebarNebula.src = nebulaAsset;
    sidebarNebula.classList.add("is-ready");
  }
  if (sidebarHero && characterAsset) {
    sidebarHero.src = characterAsset;
    sidebarHero.classList.add("is-ready");
  }
  if (mainHeroVisual && characterAsset) {
    mainHeroVisual.src = characterAsset;
    mainHeroVisual.classList.add("is-ready");
  }
  if (shapesAsset) {
    [sidebarShapeA, sidebarShapeB, sidebarShapeC].forEach((shape) => {
      if (!shape) return;
      shape.src = shapesAsset;
      shape.classList.add("is-ready");
    });
    if (mainShapesVisual) {
      mainShapesVisual.src = shapesAsset;
      mainShapesVisual.classList.add("is-ready");
    }
  }
  if (sidebarOrb && orbAsset) {
    sidebarOrb.src = orbAsset;
    sidebarOrb.classList.add("is-ready");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortMint(mint, start = 6, end = 6) {
  const value = String(mint || "").trim();
  if (!value) return "N/A";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatNumber(value, digits = 2) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatUsd(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "$0";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatSignedUsd(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "$0";
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatUsdPrice(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) {
    return `$${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })}`;
  }
  if (n >= 0.01) {
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
  }
  return `$${n.toFixed(12).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function formatPrice(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  return `$${n.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function formatPct(value, digits = 2) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(digits)}%`;
}

function formatDateTime(value) {
  const ts = Date.parse(String(value || ""));
  if (!Number.isFinite(ts)) return "N/A";
  return new Date(ts).toLocaleString();
}

function formatSol(lamports) {
  const sol = Number(lamports || 0) / 1_000_000_000;
  if (!Number.isFinite(sol)) return "0";
  return sol.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function renderProfileWorkspacePlaceholder(text, tone = "") {
  const toneClass = tone ? ` ${tone}` : "";
  const content = `<div class="msg${toneClass}">${escapeHtml(text)}</div>`;
  if (dashboardProfileOverview) dashboardProfileOverview.innerHTML = content;
  if (dashboardSignalTimeline) dashboardSignalTimeline.innerHTML = content;
  if (dashboardPaymentHistory) dashboardPaymentHistory.innerHTML = content;
  if (dashboardPositionHistory) dashboardPositionHistory.innerHTML = content;
  if (dashboardWithdrawHistory) dashboardWithdrawHistory.innerHTML = content;
}

function renderDashboardProfileOverview(data) {
  if (!dashboardProfileOverview) return;
  const user = data?.user || {};
  const balance = data?.balance || {};
  const stats = data?.stats || {};
  const totals = stats?.totals || {};
  const access = data?.access || scannerAccessStatus || {};
  const wallet = String(user.wallet || "");
  const kobxBalance = Number(access.actualBalance || 0);
  const scanLimit = Number(access.scannerDailyLimit || 0);
  const scanRemaining = Number(access.scannerDailyRemaining || 0);
  const scanTier = String(access.scannerTier || "none").toUpperCase();
  dashboardProfileOverview.innerHTML = `
    <div class="paper-kpi"><span>Connected Wallet</span><strong>${escapeHtml(wallet ? shortMint(wallet, 6, 6) : "N/A")}</strong></div>
    <div class="paper-kpi"><span>Plan</span><strong>${escapeHtml(String(user.plan || "free").toUpperCase())}</strong></div>
    <div class="paper-kpi"><span>Managed Balance</span><strong>${formatSol(balance.lamports)} SOL</strong></div>
    <div class="paper-kpi"><span>Open Positions</span><strong>${formatNumber(data?.openPositionsCount || 0, 0)}</strong></div>
    <div class="paper-kpi"><span>KOBX Balance</span><strong>${formatNumber(kobxBalance, 2)} KOBX</strong></div>
    <div class="paper-kpi"><span>Scan Tier</span><strong>${escapeHtml(scanTier)}</strong></div>
    <div class="paper-kpi"><span>Scans Remaining</span><strong>${formatNumber(scanRemaining, 0)} / ${formatNumber(scanLimit, 0)}</strong></div>
    <div class="paper-kpi"><span>Total Scans</span><strong>${formatNumber(totals.signals || 0, 0)}</strong></div>
    <div class="paper-kpi"><span>Total Forecasts</span><strong>${formatNumber(totals.forecasts || 0, 0)}</strong></div>
    <div class="paper-kpi"><span>Total Wins</span><strong>${formatNumber(totals.wins || 0, 0)}</strong></div>
    <div class="paper-kpi"><span>Win Rate</span><strong>${formatPct(totals.winRatePct || 0, 2)}</strong></div>
  `;
}

function renderDashboardSignalTimeline(signals = [], runs = []) {
  if (!dashboardSignalTimeline) return;
  const signalRows = (signals || []).map((item) => ({
    type: "Scan",
    time: String(item.created_at || ""),
    mint: String(item.mint || ""),
    status: String(item.action || "N/A"),
    confidence: Number(item.confidence || 0) * 100,
    score: Number(item.score || 0),
    note: String(item.verdict || "N/A")
  }));
  const runRows = (runs || []).map((item) => ({
    type: "Paper Run",
    time: String(item.created_at || ""),
    mint: "",
    status: String(item.mode || "paper"),
    confidence: null,
    score: Number(item.buyCandidates || 0),
    note: `${formatNumber(item.scannedCount || 0, 0)} scanned, ${formatNumber(item.buyCandidates || 0, 0)} candidates`
  }));
  const rows = [...signalRows, ...runRows]
    .filter((row) => row.time)
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
    .slice(0, 120);

  if (!rows.length) {
    dashboardSignalTimeline.innerHTML = `<div class="msg">No connected wallet activity yet.</div>`;
    return;
  }

  dashboardSignalTimeline.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Type</th>
          <th>Mint</th>
          <th>Status</th>
          <th>Confidence</th>
          <th>Score</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(formatDateTime(row.time))}</td>
                <td>${escapeHtml(row.type)}</td>
                <td>${row.mint ? `<code>${escapeHtml(shortMint(row.mint, 6, 6))}</code>` : "-"}</td>
                <td>${escapeHtml(row.status)}</td>
                <td>${row.confidence === null ? "-" : `${formatNumber(row.confidence, 1)}%`}</td>
                <td>${formatNumber(row.score, 2)}</td>
                <td>${escapeHtml(row.note)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDashboardPaymentHistory(payments = []) {
  if (!dashboardPaymentHistory) return;
  if (!payments.length) {
    dashboardPaymentHistory.innerHTML = `<div class="msg">No premium payments yet.</div>`;
    return;
  }

  dashboardPaymentHistory.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Tier</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Tx</th>
        </tr>
      </thead>
      <tbody>
        ${payments
          .map((payment) => {
            const tx = String(payment.txSignature || "").trim();
            return `
              <tr>
                <td>${escapeHtml(formatDateTime(payment.created_at))}</td>
                <td>${escapeHtml(String(payment.tier || "N/A"))}</td>
                <td>${formatSol(payment.lamports)} SOL</td>
                <td>${escapeHtml(String(payment.status || "N/A"))}</td>
                <td>${tx ? `<code>${escapeHtml(shortMint(tx, 8, 8))}</code>` : "-"}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDashboardPositionHistory(positions = []) {
  if (!dashboardPositionHistory) return;
  if (!positions.length) {
    dashboardPositionHistory.innerHTML = `<div class="msg">No autopilot positions yet.</div>`;
    return;
  }

  dashboardPositionHistory.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Mint</th>
          <th>Status</th>
          <th>Mode</th>
          <th>Size</th>
          <th>PnL %</th>
          <th>Opened</th>
          <th>Closed</th>
        </tr>
      </thead>
      <tbody>
        ${positions
          .map(
            (position) => `
              <tr>
                <td>${formatNumber(position.id || 0, 0)}</td>
                <td><code>${escapeHtml(shortMint(String(position.mint || ""), 6, 6))}</code></td>
                <td>${escapeHtml(String(position.status || "N/A"))}</td>
                <td>${escapeHtml(String(position.mode || "N/A"))}</td>
                <td>${formatUsd(position.sizeUsd || 0)}</td>
                <td>${position.pnlPct === null || position.pnlPct === undefined ? "-" : formatPct(position.pnlPct || 0, 2)}</td>
                <td>${escapeHtml(formatDateTime(position.opened_at))}</td>
                <td>${position.closed_at ? escapeHtml(formatDateTime(position.closed_at)) : "-"}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderDashboardWithdrawalHistory(withdrawals = []) {
  if (!dashboardWithdrawHistory) return;
  if (!withdrawals.length) {
    dashboardWithdrawHistory.innerHTML = `<div class="msg">No withdrawal requests yet.</div>`;
    return;
  }

  dashboardWithdrawHistory.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Amount</th>
          <th>Destination</th>
          <th>Status</th>
          <th>Payout Tx</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${withdrawals
          .map((request) => {
            const payout = String(request.payoutSignature || "").trim();
            return `
              <tr>
                <td>${formatNumber(request.id || 0, 0)}</td>
                <td>${formatSol(request.lamports)} SOL</td>
                <td><code>${escapeHtml(shortMint(String(request.destinationWallet || ""), 6, 6))}</code></td>
                <td>${escapeHtml(String(request.status || "N/A"))}</td>
                <td>${payout ? `<code>${escapeHtml(shortMint(payout, 8, 8))}</code>` : "-"}</td>
                <td>${escapeHtml(formatDateTime(request.created_at))}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

async function loadProfileWorkspaceData({ force = false, silent = false } = {}) {
  if (!dashboardProfileOverview) return;
  if (!authToken) {
    profileWorkspaceLoadedAt = 0;
    renderProfileWorkspacePlaceholder("Connect wallet to load profile and history.");
    return;
  }
  if (!force && Date.now() - profileWorkspaceLoadedAt < PROFILE_WORKSPACE_CACHE_MS) {
    return;
  }
  if (profileWorkspaceLoading) return;

  profileWorkspaceLoading = true;
  setButtonBusy(refreshProfileWorkspaceButton, true, "Refreshing...");
  try {
    const [overviewData, historyData] = await Promise.all([
      api("/api/profile/overview", null, true, "GET"),
      api("/api/profile/history", null, true, "GET")
    ]);
    if (overviewData?.access) {
      scannerAccessStatus = overviewData.access;
      renderScannerAccessSummary(scannerAccessStatus);
    }
    renderDashboardProfileOverview(overviewData);
    renderDashboardSignalTimeline(historyData.recentSignals || [], historyData.recentRuns || []);
    renderDashboardPaymentHistory(historyData.payments || []);
    renderDashboardPositionHistory(historyData.positions || []);
    renderDashboardWithdrawalHistory(historyData.withdrawals || []);
    profileWorkspaceLoadedAt = Date.now();
    if (!silent) {
      pushMessage("Profile workspace refreshed.", "ok");
    }
  } catch (error) {
    renderProfileWorkspacePlaceholder(friendlyErrorMessage(error, "load profile workspace"), "error");
    if (!silent) {
      notifyActionError(error, "refresh profile workspace");
    }
  } finally {
    profileWorkspaceLoading = false;
    setButtonBusy(refreshProfileWorkspaceButton, false);
  }
}

function buildBeginnerSentimentLines(signal) {
  const plainLanguage = signal?.sentiment?.plainLanguage || {};
  if (plainLanguage.current || plainLanguage.action || plainLanguage.coverage) {
    return [
      String(plainLanguage.current || "").trim(),
      String(plainLanguage.action || "").trim(),
      String(plainLanguage.coverage || "").trim()
    ].filter(Boolean);
  }

  const status = String(signal?.status || "HIGH_RISK");
  const killVerdict = String(signal?.killSwitch?.verdict || "N/A");
  const killScore = Number(signal?.killSwitch?.score || 0);
  const patternScore = Number(signal?.patternScore || 0);
  const confidence = Number(signal?.confidence || 0);
  const priceChange24h = Number(signal?.market?.priceChange24hPct || 0);
  const connectedPct = Number(signal?.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0);
  const newWalletPct = Number(signal?.killSwitch?.risk?.holderBehavior?.newWalletHolderPct || 0);
  const buys24h = Number(signal?.sentiment?.orderFlow?.buys24h || 0);
  const sells24h = Number(signal?.sentiment?.orderFlow?.sells24h || 0);
  const buyRatio = Number(signal?.sentiment?.orderFlow?.buyRatio || 0.5);

  const nowLine = `Now: ${status} because kill-switch is ${killVerdict} (${formatNumber(killScore, 0)}/100), pattern is ${formatNumber(patternScore, 1)}/100, and confidence is ${formatNumber(confidence, 2)}.`;

  const flowLine = `Flow: ${formatNumber(buys24h, 0)} buys vs ${formatNumber(sells24h, 0)} sells in 24h (${formatNumber(
    buyRatio * 100,
    1
  )}% buy-side) with 24h price move ${formatPct(priceChange24h, 2)}.`;

  const behaviorLine = `Holder behavior: connected-wallet exposure ${formatPct(
    connectedPct,
    2
  )}, new-wallet exposure ${formatPct(newWalletPct, 2)}. Higher values usually increase manipulation risk.`;

  let actionLine =
    "Action: stay patient and wait for clearer confirmation near support before sizing up.";
  if (status === "FAVORABLE") {
    actionLine =
      "Action: setup looks cleaner right now, but still confirm with volume/price reaction at support before entry.";
  } else if (status === "HIGH_RISK") {
    actionLine =
      "Action: avoid fresh entries until kill-switch risk and holder behavior improve.";
  }

  return [nowLine, flowLine, behaviorLine, actionLine];
}

function holderCoverageNote(holderBehavior) {
  const coverage = holderBehavior?.analysisCoverage || {};
  const explicitNote = String(coverage.note || "").trim();
  const dataSources = (coverage.dataSources && typeof coverage.dataSources === "object")
    ? coverage.dataSources
    : {};
  const sourceParts = [];
  if (dataSources.topHolders) sourceParts.push(`holders: ${String(dataSources.topHolders)}`);
  if (dataSources.holderActivity) sourceParts.push(`activity: ${String(dataSources.holderActivity)}`);
  if (dataSources.walletLabels) sourceParts.push(`labels: ${String(dataSources.walletLabels)}`);
  if (explicitNote) return explicitNote;
  const topAccounts = Number(coverage.topAccountsAnalyzed || holderBehavior?.analyzedTopAccounts || 0);
  if (topAccounts <= 0) {
    return "Holder profile did not return in this pass. Scanner uses recent transaction windows by default.";
  }
  const buySellLimit = Number(coverage.buySellTxSamplePerAccount || 8);
  const sampledAccounts = Number(coverage.accountsWithBuySellSampling || 5);
  const signatureLimit = Number(coverage.signatureSamplePerAccount || 20);
  return `Coverage note: analyzed top ${topAccounts} holder accounts; buy/sell counts use recent provider-backed wallet history when available and RPC fallback otherwise; cluster links use recent ${signatureLimit} signatures per account. Sources: ${sourceParts.join(", ") || "rpc"}.`;
}

const walletSourceDescriptions = {
  "liquidity-pool-candidate": "Likely liquidity pool vault account, usually not a normal trader wallet.",
  "clustered-new-wallet": "Fresh wallet linked with other holders via shared recent signatures.",
  "clustered-wallet": "Wallet appears in a connected holder cluster.",
  "new-wallet": "Wallet looks recently created or newly active.",
  "active-trader-wallet": "Wallet shows notable recent token-account trading activity.",
  "token-account-owner": "Owner resolves directly to the token account.",
  "unattributed-wallet": "No explicit exchange/source label was detected from current heuristics."
};

function describeWalletSource(source) {
  const key = String(source || "unattributed-wallet").trim();
  return (
    walletSourceDescriptions[key] ||
    "Source label provided by configured wallet mapping or inferred heuristics."
  );
}

function sourceLegendHtml() {
  const entries = Object.entries(walletSourceDescriptions);
  return `
    <details class="source-legend">
      <summary>Wallet Source Legend</summary>
      <div class="source-legend-items">
        ${entries
          .map(
            ([name, description]) =>
              `<span class="source-pill" title="${escapeHtml(description)}">${escapeHtml(name)}</span>`
          )
          .join("")}
      </div>
    </details>
  `;
}

function formatPctCompact(value, digits = 1) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0%";
  return `${formatNumber(num, digits)}%`;
}

function humanizeFundingSource(source) {
  const key = String(source || "unattributed-wallet").trim().toLowerCase();
  if (key === "liquidity-pool-candidate") return "LP vault";
  if (key === "token-account-owner") return "Token owner";
  if (key === "clustered-new-wallet") return "Clustered new wallets";
  if (key === "clustered-wallet") return "Clustered wallets";
  if (key === "new-wallet") return "New wallets";
  if (key === "active-trader-wallet") return "Active traders";
  if (key === "unattributed-wallet") return "Unattributed";
  return key
    .split(/[-_ ]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildScannerForensics(signal) {
  const risk = signal?.killSwitch?.risk || {};
  const holderBehavior = risk.holderBehavior || {};
  const holderProfiles = Array.isArray(risk.holderProfiles) ? risk.holderProfiles : [];
  const fundingBreakdownRaw = Array.isArray(risk.fundingSourceBreakdown) ? risk.fundingSourceBreakdown : [];
  const fundingBreakdown = fundingBreakdownRaw.length
    ? fundingBreakdownRaw
    : (() => {
        const map = new Map();
        holderProfiles.forEach((holder) => {
          const key = String(holder.walletSource || "unattributed-wallet").trim().toLowerCase();
          const current = map.get(key) || { source: key, holderCount: 0, holdPct: 0 };
          current.holderCount += 1;
          current.holdPct += Number(holder.amountPct || 0);
          map.set(key, current);
        });
        return Array.from(map.values()).sort((a, b) => Number(b.holdPct || 0) - Number(a.holdPct || 0));
      })();

  const marketPrice = Number(signal?.market?.priceUsd || 0);
  const analyzedHolderCount = Number(risk.analyzedHolderCount || holderProfiles.length || 0);
  const top10ExLp = Number(risk.top10HolderSharePct || risk.top3HolderSharePct || 0);
  const top20ExLp = Number(risk.top20HolderSharePct || top10ExLp || 0);
  const topClusterPct = Number(risk.topClusterHolderSharePct || 0);
  const topClusterMode = String(risk.topClusterMode || "");
  const connectedPct = Number(holderBehavior.connectedHolderPct || 0);
  const newWalletPct = Number(holderBehavior.newWalletHolderPct || 0);
  const bundleRiskScore = Number(risk.bundleRiskScore || 0);
  const bundleRiskVerdict = String(risk.bundleRiskVerdict || (bundleRiskScore >= 70 ? "HIGH" : bundleRiskScore >= 45 ? "CAUTION" : "LOW"));
  const avgBagUsd =
    holderProfiles.length && marketPrice > 0
      ? holderProfiles.reduce((sum, holder) => sum + Number(holder.amountUi || 0) * marketPrice, 0) / holderProfiles.length
      : 0;
  const lpIncluded = !String(risk.concentrationMode || "").includes("excluding_lp");
  const clusterLpIncluded = !topClusterMode.includes("excluding_lp");
  const fundingSummary = fundingBreakdown
    .slice(0, 4)
    .map((entry) => `${humanizeFundingSource(entry.source)} ${formatPctCompact(entry.holdPct, 1)}`)
    .join(", ");
  const coverageSources =
    holderBehavior?.analysisCoverage && typeof holderBehavior.analysisCoverage.dataSources === "object"
      ? holderBehavior.analysisCoverage.dataSources
      : {};
  const verificationNote = [
    `Verified concentration: ${String(risk.concentrationSource || "rpc-top20")}`,
    `Wallet activity: ${String(coverageSources.holderActivity || "rpc")}`,
    `Wallet labels: ${String(coverageSources.walletLabels || "heuristic")}`
  ].join(" | ");

  let verdictLine = "No major linked-holder bundle detected in this pass.";
  if (bundleRiskVerdict === "HIGH") {
    verdictLine = `Bundled/clustered launch risk is high. Largest linked cluster controls ${formatPctCompact(topClusterPct, 1)} and connected holders control ${formatPctCompact(connectedPct, 1)}.`;
  } else if (bundleRiskVerdict === "CAUTION") {
    verdictLine = `Coordinated holder risk is elevated. Connected holders control ${formatPctCompact(connectedPct, 1)} with ${formatPctCompact(newWalletPct, 1)} new-wallet exposure.`;
  }

  const taLine = `Top 20 largest holders control ${formatPctCompact(top20ExLp, 1)}, top 10 control ${formatPctCompact(top10ExLp, 1)}${lpIncluded ? " (LP may still be included)" : " (ex-LP)"} using getTokenLargestAccounts.`;
  const liquidityLine = fundingSummary
    ? `Source mix: ${fundingSummary}. LP bucket is shown separately here and is not counted in ex-LP concentration metrics when confidently identified.`
    : "Source mix is not yet labeled in this pass.";

  const shareText = [
    `${String(signal?.token?.symbol || "TOKEN")} (${String(signal?.token?.mint || signal?.mint || "").trim()})`,
    `AIG verdict: ${String(signal?.status || "N/A")} | Bundle risk ${bundleRiskScore}/100 (${bundleRiskVerdict})`,
    verdictLine,
    taLine,
    `Top linked cluster ${formatPctCompact(topClusterPct, 1)}${clusterLpIncluded ? " (LP maybe included)" : " (ex-LP)"} | New-wallet exposure ${formatPctCompact(newWalletPct, 1)} | Holder groups ${formatNumber(holderBehavior.connectedGroupCount || 0, 0)}.`,
    `Analyzed holders ${formatNumber(analyzedHolderCount, 0)} | Avg bag ${avgBagUsd > 0 ? formatUsd(avgBagUsd) : "n/a"}.`,
    liquidityLine,
    verificationNote,
    "NFA. Powered by Kobecoin."
  ].join("\n");

  return {
    bundleRiskScore,
    bundleRiskVerdict,
    verdictLine,
    taLine,
    liquidityLine,
    verificationNote,
    top10ExLp,
    top20ExLp,
    topClusterPct,
    clusterLpIncluded,
    connectedPct,
    newWalletPct,
    analyzedHolderCount,
    avgBagUsd,
    fundingBreakdown,
    shareText
  };
}

function scannerBundleTone(score) {
  if (score >= 70) return "bad";
  if (score >= 45) return "warn";
  return "good";
}

async function loadCanvasImage(url) {
  const source = String(url || "").trim();
  if (!source) return null;
  try {
    const response = await fetch(source, { credentials: "omit" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });
      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (_error) {
    return null;
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function buildScannerShareImage(signal) {
  const forensics = buildScannerForensics(signal);
  const token = signal?.token || {};
  const mint = String(token.mint || signal?.mint || "").trim();
  const symbol = String(token.symbol || token.name || "TOKEN");
  const status = String(signal?.status || "N/A");
  const price = formatUsdPrice(signal?.market?.priceUsd || 0);
  const aigLogo = await loadCanvasImage("/assets/icon.png");
  const tokenImage = await loadCanvasImage(String(token.imageUrl || ""));
  const lines = [
    `Bundle Risk ${formatNumber(forensics.bundleRiskScore, 0)}/100 (${forensics.bundleRiskVerdict})`,
    `Top 10 Share ${formatPctCompact(forensics.top10ExLp, 1)} | Top 20 Share ${formatPctCompact(forensics.top20ExLp, 1)}`,
    `Linked Cluster ${formatPctCompact(forensics.topClusterPct, 1)} | New Wallets ${formatPctCompact(forensics.newWalletPct, 1)}`,
    `Avg Bag ${forensics.avgBagUsd > 0 ? formatUsd(forensics.avgBagUsd) : "n/a"}`,
    forensics.verdictLine
  ];
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 880;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#060916");
  bg.addColorStop(0.5, "#11163a");
  bg.addColorStop(1, "#1a1046");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(137, 92, 255, 0.15)";
  ctx.beginPath();
  ctx.arc(1180, 140, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(240, 720, 230, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(112, 126, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  drawRoundedRect(ctx, 72, 66, 96, 96, 24);
  ctx.fillStyle = "rgba(12, 19, 49, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(132, 148, 255, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (aigLogo) {
    ctx.save();
    drawRoundedRect(ctx, 72, 66, 96, 96, 24);
    ctx.clip();
    ctx.drawImage(aigLogo, 72, 66, 96, 96);
    ctx.restore();
  }

  ctx.fillStyle = "#f5f7ff";
  ctx.font = "700 62px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("AIG Token Forensics", 196, 120);

  ctx.fillStyle = "#aab6ef";
  ctx.font = "400 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Powered by Kobecoin", 198, 164);

  const tokenCardX = 72;
  const tokenCardY = 214;
  drawRoundedRect(ctx, tokenCardX, tokenCardY, 112, 112, 28);
  ctx.fillStyle = "rgba(16, 25, 62, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(129, 145, 244, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (tokenImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(tokenCardX + 56, tokenCardY + 56, 44, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(tokenImage, tokenCardX + 12, tokenCardY + 12, 88, 88);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(98, 120, 236, 0.22)";
    ctx.beginPath();
    ctx.arc(tokenCardX + 56, tokenCardY + 56, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eef2ff";
    ctx.font = "700 40px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(String(symbol || "?").slice(0, 1).toUpperCase(), tokenCardX + 42, tokenCardY + 70);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 54px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(symbol, 210, 278);
  ctx.fillStyle = "#d6dcff";
  ctx.font = "400 26px ui-monospace, monospace";
  ctx.fillText(mint, 210, 320);

  ctx.fillStyle = "#91f0c2";
  ctx.font = "700 42px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(price, 1040, 118);
  ctx.fillStyle = "#b6c1f2";
  ctx.font = "600 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(status, 1110, 164);

  const tone = scannerBundleTone(forensics.bundleRiskScore);
  ctx.fillStyle = tone === "bad" ? "#ff6f88" : tone === "warn" ? "#ffd36f" : "#88f2c4";
  ctx.font = "700 44px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`Bundle Risk ${formatNumber(forensics.bundleRiskScore, 0)}/100`, 72, 420);

  ctx.fillStyle = "#e8edff";
  ctx.font = "600 30px ui-sans-serif, system-ui, sans-serif";
  lines.forEach((line, index) => {
    ctx.fillText(line, 72, 500 + index * 68);
  });

  ctx.fillStyle = "#99a6df";
  ctx.font = "400 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Scanner report generated by AIG.", 72, 818);

  return canvas;
}

async function downloadScannerCardPng(signal) {
  const canvas = await buildScannerShareImage(signal);
  const token = signal?.token || {};
  const symbol = String(token.symbol || token.name || "token").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const link = document.createElement("a");
  link.download = `aig-${symbol || "token"}-forensics.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function shareScannerCardToX(signal) {
  const forensics = buildScannerForensics(signal);
  const token = signal?.token || {};
  const symbol = String(token.symbol || token.name || "TOKEN").trim();
  const mint = String(token.mint || signal?.mint || "").trim();
  const status = String(signal?.status || "N/A").replace(/_/g, " ");
  const bundleTone = forensics.bundleRiskVerdict === "HIGH" ? "HIGH" : forensics.bundleRiskVerdict === "CAUTION" ? "ELEVATED" : "LOW";
  const summaryLine =
    forensics.bundleRiskVerdict === "HIGH"
      ? "Heavy linked-holder risk is showing in this pass."
      : forensics.bundleRiskVerdict === "CAUTION"
        ? "Some coordination risk is showing here, so this needs caution."
        : "No major linked-holder bundle is showing in this pass.";
  const activityLine = `Top 20 holders: ${formatPctCompact(forensics.top20ExLp, 1)} | Top 10: ${formatPctCompact(forensics.top10ExLp, 1)}${forensics.clusterLpIncluded ? " (LP may still be mixed in)" : " (ex-LP)"}`;
  const riskLine = `Linked cluster: ${formatPctCompact(forensics.topClusterPct, 1)}${forensics.clusterLpIncluded ? " (LP maybe included)" : ""} | New wallets: ${formatPctCompact(forensics.newWalletPct, 1)}`;
  const dataLine = `Data: ${String(forensics.verificationNote || "")
    .replace("Verified concentration: ", "")
    .replace("Wallet activity: ", "activity ")
    .replace("Wallet labels: ", "labels ")}`;
  const shareText = [
    `${symbol} (${mint})`,
    `AIG read: ${status} | Bundle risk ${formatNumber(forensics.bundleRiskScore, 0)}/100 ${bundleTone}`,
    summaryLine,
    activityLine,
    riskLine,
    `Avg bag: ${forensics.avgBagUsd > 0 ? formatUsd(forensics.avgBagUsd) : "n/a"}`,
    dataLine,
    "NFA. Powered by Kobecoin. @Kobecoin_X0214 @heliuslabs"
  ].join("\n");
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function isValidSolanaMint(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || "").trim());
}

const trackedSymbolAliases = {
  BTC: "BTC",
  BTCUSD: "BTC",
  BTCUSDT: "BTC",
  XBT: "BTC",
  XBTUSD: "BTC",
  XBTUSDT: "BTC",
  ETH: "ETH",
  ETHUSD: "ETH",
  ETHUSDT: "ETH"
};

function normalizeTrackedTokenId(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (isValidSolanaMint(trimmed)) return trimmed;
  const key = trimmed.toUpperCase().replace(/[\s/_-]/g, "");
  return trackedSymbolAliases[key] || "";
}

function isValidTrackedToken(value) {
  return Boolean(normalizeTrackedTokenId(value));
}

function isMacroTrackedToken(value) {
  const normalized = normalizeTrackedTokenId(value);
  return normalized === "BTC" || normalized === "ETH";
}

function parseAgentTargetMints(input, max = 1) {
  return Array.from(
    new Set(
      String(input || "")
        .split(",")
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .map((mint) => normalizeTrackedTokenId(mint))
        .filter(Boolean)
    )
  ).slice(0, max);
}

function persistAgentTargetMints(mints = []) {
  const clean = parseAgentTargetMints(mints.join(","), 1);
  agentTargetMints = clean;
  agentTargetMint = clean[0] || "";
  localStorage.setItem("enigma_agent_mints", clean.join(","));
  localStorage.setItem("enigma_agent_mint", agentTargetMint || "");
}

function hydrateAgentTargetMintsFromStorage() {
  const csv = String(
    localStorage.getItem("enigma_agent_mints") || localStorage.getItem("enigma_agent_mint") || ""
  ).trim();
  persistAgentTargetMints(parseAgentTargetMints(csv, 1));
}

function syncAgentTargetMintUi() {
  if (!agentTargetMintInput) return;
  agentTargetMintInput.value = agentTargetMints.join(", ");
  renderAgentMissionConsole();
}

function resolveAgentTargetMints(options = {}) {
  const notify = Boolean(options.notify);
  const raw = String(agentTargetMintInput?.value || agentTargetMints.join(",") || "").trim();
  if (!raw) {
    if (notify) pushMessage("Set 1 Agent Token first for paper agent testing.", "error");
    return [];
  }
  const requested = Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
  const parsed = parseAgentTargetMints(raw, 1);
  if (!parsed.length) {
    if (notify) pushMessage("Agent Token format looks invalid. Use Solana mint, BTC, or ETH.", "error");
    return [];
  }
  if (requested.length > 1 && notify) {
    pushMessage("Only 1 Agent Token is supported in this workspace. Extra entries were ignored.", "info");
  }
  if (parsed.length !== requested.length && notify) {
    pushMessage("Some provided token entries were invalid and skipped.", "info");
  }
  if (parsed.join(",") !== agentTargetMints.join(",")) {
    persistAgentTargetMints(parsed);
    agentPricePoints = [];
    renderAgentPriceGraph();
    syncAgentTargetMintUi();
  }
  return agentTargetMints.slice();
}

function resolveAgentTargetMint(options = {}) {
  const list = resolveAgentTargetMints(options);
  return list[0] || "";
}

function saveAgentTargetMint(options = {}) {
  if (!ensureWalletConnected("set agent tokens")) return false;
  const notify = options.notify !== false;
  const mints = resolveAgentTargetMints({ notify });
  if (!mints.length) return false;
  updateAgentTradeState({
    preview: null,
    decision: null,
    position: null,
    missionStatus: "scanning",
    error: null,
    executionTrace: {
      previewState: "Ready to preview",
      submitted: "-",
      txHash: "-",
      filledAmount: "-",
      averageEntry: "-",
      stopLoss: "-",
      takeProfit: "-",
      holdHorizon: "-",
      currentPnl: "-"
    }
  });
  recordAgentActivity("Mission token saved. AIG is ready to evaluate this market.", "ok", {
    title: "Mission Armed",
    meta: shortMint(mints[0], 8, 8)
  });
  if (notify) {
    pushMessage(
      `Agent token set saved (${mints.length}/1): ${mints.map((mint) => shortMint(mint, 6, 6)).join(", ")}`,
      "ok"
    );
  }
  if (authToken) {
    startAgentPriceMonitor();
    startAgentMissionStream(mints[0]);
    void restoreAgentMissionSession(mints[0]);
    void loadAgentMissionSessions(mints[0]);
    void loadAgentMissionDiagnostics(mints[0]);
  }
  renderAgentScannerSummary([]);
  return true;
}

function setAgentPriceStatus(text, mode = "idle") {
  if (!agentPriceStatus) return;
  agentPriceStatus.textContent = text;
  agentPriceStatus.classList.remove("ok", "busy", "error");
  if (mode !== "idle") agentPriceStatus.classList.add(mode);
}

function normalizeAgentPriceWindowSec(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 300;
  if (n <= 90) return 60;
  if (n <= 420) return 300;
  return 900;
}

function syncAgentPriceWindowButtons() {
  const selected = normalizeAgentPriceWindowSec(agentPriceWindowSec);
  document.querySelectorAll("button[data-agent-price-window]").forEach((button) => {
    const buttonWindow = normalizeAgentPriceWindowSec(button.getAttribute("data-agent-price-window"));
    button.classList.toggle("active", buttonWindow === selected);
  });
}

function windowLabelBySeconds(seconds) {
  if (seconds <= 60) return "1m";
  if (seconds <= 300) return "5m";
  return "15m";
}

function normalizeClientTsMs(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return Date.now();
  return n < 1_000_000_000_000 ? n * 1000 : n;
}

function appendAgentPricePoint(price, ts = Date.now()) {
  const p = Number(price || 0);
  if (!Number.isFinite(p) || p <= 0) return;
  const t = normalizeClientTsMs(ts);
  agentPricePoints.push({ ts: t, price: p });
  agentPricePoints = agentPricePoints
    .map((item) => ({
      ts: normalizeClientTsMs(item.ts),
      price: Number(item.price || 0)
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0)
    .sort((a, b) => a.ts - b.ts)
    .slice(-320);
}

function renderAgentPriceGraph() {
  if (!agentPriceChart) return;
  const now = Date.now();
  const selectedWindowSec = normalizeAgentPriceWindowSec(agentPriceWindowSec);
  const cutoff = now - selectedWindowSec * 1000;
  const points = agentPricePoints
    .map((item) => ({
      ts: normalizeClientTsMs(item.ts),
      price: Number(item.price || 0)
    }))
    .filter((item) => Number.isFinite(item.price) && item.price > 0 && item.ts >= cutoff)
    .sort((a, b) => a.ts - b.ts)
    .slice(-180);
  if (!points.length) {
    agentPriceChart.innerHTML =
      `<div class="muted">Set Agent Token and wait for price ticks to render live chart.</div>`;
    if (agentPriceStripPrice) agentPriceStripPrice.textContent = "$0.00";
    if (agentPriceStripContext) {
      agentPriceStripContext.textContent = agentTargetMint
        ? "Waiting for live price ticks from the market feed."
        : "Save one token to arm the market panel.";
    }
    if (agentPriceMeta) {
      agentPriceMeta.innerHTML = `
        <span><b>Token</b> ${escapeHtml(shortMint(agentTargetMint || "N/A", 7, 7))}</span>
        <span><b>Monitoring</b> ${formatNumber(agentTargetMints.length || 0, 0)} token(s)</span>
        <span><b>Window</b> ${windowLabelBySeconds(selectedWindowSec)}</span>
      `;
    }
    syncAgentPriceWindowButtons();
    return;
  }

  const drawPoints =
    points.length >= 2 ? points : [points[0], { ts: points[0].ts + 1_000, price: points[0].price }];
  const values = drawPoints.map((item) => Number(item.price || 0)).filter((item) => item > 0);

  const width = 520;
  const height = 130;
  const padX = 10;
  const padY = 10;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = padX + (index / Math.max(1, values.length - 1)) * usableW;
      const y = padY + (1 - (value - min) / span) * usableH;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

  let oneMinuteBase = last;
  const oneMinuteCutoff = Date.now() - 60_000;
  for (let i = drawPoints.length - 1; i >= 0; i -= 1) {
    if (drawPoints[i].ts <= oneMinuteCutoff) {
      oneMinuteBase = Number(drawPoints[i].price || first);
      break;
    }
  }
  const oneMinuteChange = oneMinuteBase > 0 ? ((last - oneMinuteBase) / oneMinuteBase) * 100 : 0;

  agentPriceChart.innerHTML = `
    <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" ry="8"></rect>
      <path class="trend-line pattern" d="${path}" />
    </svg>
  `;
  if (agentPriceStripPrice) {
    agentPriceStripPrice.textContent = formatPrice(last);
  }
  if (agentPriceStripContext) {
    agentPriceStripContext.textContent = `1m ${formatPct(oneMinuteChange, 2)} | ${windowLabelBySeconds(selectedWindowSec)} ${formatPct(changePct, 2)} | ${points.length} ticks tracked`;
  }
  if (agentPriceMeta) {
    agentPriceMeta.innerHTML = `
      <span><b>Token</b> ${escapeHtml(shortMint(agentTargetMint || "N/A", 7, 7))}</span>
      <span><b>Monitoring</b> ${formatNumber(agentTargetMints.length || 0, 0)} token(s)</span>
      <span><b>Now</b> ${formatPrice(last)}</span>
      <span><b>1m</b> ${formatPct(oneMinuteChange, 2)}</span>
      <span><b>${windowLabelBySeconds(selectedWindowSec)}</b> ${formatPct(changePct, 2)}</span>
      ${points.length < 2 ? `<span><b>Status</b> Collecting ticks...</span>` : ""}
    `;
  }
  syncAgentPriceWindowButtons();
}

async function fetchAgentPriceTick() {
  if (!authToken || agentPriceInFlight) return;
  const mint = String(agentTargetMint || "").trim();
  if (!mint) {
    setAgentPriceStatus("Idle");
    return;
  }

  agentPriceInFlight = true;
  try {
    const response = await api(
      `/api/token/market/live?mint=${encodeURIComponent(mint)}&windowSec=${encodeURIComponent(
        String(agentPriceWindowSec)
      )}`,
      null,
      true,
      "GET"
    );
    const market = response.market || {};

    const priceUsd = Number(market.priceUsd || 0);
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
      throw new Error("price unavailable");
    }

    const chartPointsRaw = Array.isArray(response.chart?.points) ? response.chart.points : [];
    const chartPoints = chartPointsRaw
      .map((item) => ({
        ts: normalizeClientTsMs(Number(item?.ts || 0)),
        price: Number(item?.price || 0)
      }))
      .filter((item) => Number.isFinite(item.ts) && item.ts > 0 && Number.isFinite(item.price) && item.price > 0)
      .sort((a, b) => a.ts - b.ts)
      .slice(-300);

    if (chartPoints.length >= 2) {
      agentPricePoints = chartPoints;
      const lastPoint = chartPoints[chartPoints.length - 1];
      if (Math.abs(lastPoint.price - priceUsd) > Math.max(0.000000001, priceUsd * 0.000001)) {
        appendAgentPricePoint(priceUsd, Date.now());
      }
    } else {
      appendAgentPricePoint(priceUsd, Date.now());
    }

    renderAgentPriceGraph();
    setAgentPriceStatus(response.stale ? "Stale" : "Live", response.stale ? "busy" : "ok");
  } catch (error) {
    setAgentPriceStatus("Issue", "error");
    const now = Date.now();
    if (now - agentPriceLastErrorNoticeTs > 30_000) {
      agentPriceLastErrorNoticeTs = now;
      pushMessage(`Agent price feed issue: ${String(error?.message || "temporary source unavailable")}`, "error");
    }
    renderAgentPriceGraph();
  } finally {
    agentPriceInFlight = false;
  }
}

function stopAgentPriceMonitor() {
  if (agentPriceTimer) {
    clearInterval(agentPriceTimer);
    agentPriceTimer = null;
  }
  setAgentPriceStatus("Idle");
}

function shouldRunAgentPriceMonitor() {
  return Boolean(
    authToken &&
    agentTargetMint &&
    document.body.classList.contains("workspace-agent") &&
    document.visibilityState === "visible"
  );
}

function startAgentPriceMonitor() {
  if (!shouldRunAgentPriceMonitor()) return;
  if (agentPriceTimer) return;
  setAgentPriceStatus("Live", "ok");
  void fetchAgentPriceTick();
  agentPriceTimer = setInterval(() => {
    void fetchAgentPriceTick();
  }, AGENT_PRICE_POLL_MS);
}

function resetSessionAnalytics() {
  sessionAnalytics.batches = 0;
  sessionAnalytics.tokensSeen = 0;
  sessionAnalytics.favorable = 0;
  sessionAnalytics.caution = 0;
  sessionAnalytics.highRisk = 0;
  sessionAnalytics.patternTotal = 0;
  sessionAnalytics.confidenceTotal = 0;
  sessionAnalytics.connectedTotal = 0;
  sessionAnalytics.lastBatchAt = "";
  sessionTrendPoints = [];
  previousStatusByMint.clear();
  thresholdStateByMint.clear();
  alertEvents = [];
  renderAlertFeed();
  renderSessionTrend();
}

function buzzAlert() {
  if (!alertPrefs.sound || !window.AudioContext) return;
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = 720;
  gain.gain.value = 0.03;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    audioContext.close();
  }, 170);
}

function normalizeToastTone(tone) {
  const value = String(tone || "info").toLowerCase();
  if (value === "good" || value === "ok") return "ok";
  if (value === "warn" || value === "error") return "error";
  if (value === "busy") return "busy";
  return "info";
}

function showToastWindow(text, tone = "info", options = {}) {
  if (!toastStack) return;
  const message = String(text || "").trim();
  if (!message) return;

  const normalizedTone = normalizeToastTone(tone);
  const title = String(options.title || (normalizedTone === "error" ? "Warning" : normalizedTone === "ok" ? "Update" : "Notice"));
  const durationMs = Math.max(1800, Math.min(15000, Number(options.durationMs || 4200)));
  const actionLabel = String(options.actionLabel || "").trim();
  const actionHref = String(options.actionHref || "").trim();

  const item = document.createElement("article");
  item.className = `toast-window ${normalizedTone}`;
  item.innerHTML = `
    <div class="toast-head">
      <strong class="toast-title">${escapeHtml(title)}</strong>
      <button class="toast-close" type="button" aria-label="Dismiss notification">x</button>
    </div>
    <div class="toast-body">${escapeHtml(message)}</div>
    ${actionLabel && actionHref ? `<div class="toast-actions"><a class="toast-action-link" href="${escapeHtml(actionHref)}" target="_blank" rel="noreferrer">${escapeHtml(actionLabel)}</a></div>` : ""}
    <div class="toast-progress"></div>
  `;
  toastStack.prepend(item);

  while (toastStack.children.length > 4) {
    toastStack.lastElementChild?.remove();
  }

  window.requestAnimationFrame(() => {
    item.classList.add("show");
  });

  let removed = false;
  const removeItem = () => {
    if (removed) return;
    removed = true;
    item.classList.remove("show");
    window.setTimeout(() => item.remove(), 180);
  };

  const closeButton = item.querySelector(".toast-close");
  closeButton?.addEventListener("click", removeItem);

  const progress = item.querySelector(".toast-progress");
  if (progress instanceof HTMLElement) {
    progress.style.animationDuration = `${durationMs}ms`;
  }

  window.setTimeout(removeItem, durationMs);
}

function clearLocalSessionState() {
  stopAgentMissionStream();
  authToken = "";
  userWallet = "";
  userPlan = "free";
  scannerAccessStatus = null;
  agentMissionSessions = [];
  agentMissionDiagnostics = null;
  agentMissionLastEventAt = "";
  agentMissionLastHeartbeatAt = "";
  saveAgentMissionSessionId("");
  localStorage.removeItem("enigma_wallet");
  localStorage.removeItem("enigma_plan");
  setAuthState();
}

async function disconnectPhantom(provider = window.solana) {
  try {
    if (provider && typeof provider.disconnect === "function") {
      await provider.disconnect();
    }
  } catch {
    // Ignore provider disconnect errors; local session state is authoritative here.
  }
}

function showKobxAccessBlocked(access = {}) {
  const actualBalance = Number(access.actualBalance || 0);
  const requiredBalance = Number(access.requiredBalance || KOBX_REQUIRED_BALANCE);
  const tierHint = requiredBalance <= 500000
    ? "Hold at least 500,000 KOBX to unlock 2 scans/day."
    : "Hold at least 3,000,000 KOBX to unlock 5 scans/day.";
  const message = `Access requires at least ${formatNumber(requiredBalance, 2)} KOBX. Connected wallet balance: ${formatNumber(actualBalance, 2)} KOBX. ${tierHint}`;
  pushMessage(`${message} Buy KOBX on Pump.fun to continue.`, "error", { toast: false });
  showToastWindow(message, "error", {
    title: "KOBX Required",
    durationMs: 9000,
    actionLabel: "Buy KOBX",
    actionHref: String(access.buyUrl || KOBX_BUY_URL)
  });
}

function triggerAlert(text, tone = "info") {
  pushMessage(text, tone === "warn" ? "error" : "ok", { toast: false });
  showToastWindow(text, tone, { title: "Scanner Alert", durationMs: 5200 });
  buzzAlert();
  pushAlertEvent(text, tone);

  const permission = window.Notification?.permission || "denied";
  if (permission === "granted" && document.hidden) {
    try {
      new window.Notification("AI Guardian Alert", { body: text });
    } catch {
      // Ignore notification errors in unsupported environments.
    }
  }
}

function evaluateSignalAlerts(items) {
  (items || [])
    .filter((item) => item.ok && item.signal)
    .forEach((item) => {
      const signal = item.signal || {};
      const token = signal.token || {};
      const mint = String(item.mint || signal.mint || token.mint || "");
      const symbol = String(token.symbol || shortMint(mint));
      const status = String(signal.status || "HIGH_RISK");
      const prev = previousStatusByMint.get(mint);
      const pattern = Number(signal.patternScore || 0);
      const killScore = Number(signal.killSwitch?.score || 0);
      const connectedPct = Number(signal.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0);

      if (prev && prev !== status) {
        if (status === "FAVORABLE" && alertPrefs.favorable) {
          triggerAlert(`${symbol} flipped to FAVORABLE`, "good");
        }
        if (status === "HIGH_RISK" && alertPrefs.highRisk) {
          triggerAlert(`${symbol} flipped to HIGH_RISK`, "warn");
        }
      }

      const currentThresholdState = {
        favorable: status === "FAVORABLE" && pattern >= alertThresholds.favorablePatternMin,
        risk:
          status === "HIGH_RISK" ||
          killScore <= alertThresholds.riskKillMax ||
          connectedPct >= alertThresholds.connectedMax
      };
      const prevThresholdState = thresholdStateByMint.get(mint);
      if (prevThresholdState) {
        if (!prevThresholdState.favorable && currentThresholdState.favorable && alertPrefs.favorable) {
          triggerAlert(
            `${symbol} crossed favorable threshold (pattern ${formatNumber(pattern, 1)} >= ${alertThresholds.favorablePatternMin})`,
            "good"
          );
        }
        if (!prevThresholdState.risk && currentThresholdState.risk && alertPrefs.highRisk) {
          triggerAlert(
            `${symbol} crossed risk threshold (kill ${formatNumber(killScore, 0)}, connected ${formatPct(connectedPct, 1)})`,
            "warn"
          );
        }
      }

      if (mint) {
        previousStatusByMint.set(mint, status);
        thresholdStateByMint.set(mint, currentThresholdState);
      }
    });
}

function buildAlertItemsFromDecisions(decisions = []) {
  return (Array.isArray(decisions) ? decisions : [])
    .map((decision) => {
      const mint = String(decision?.mint || decision?.token?.mint || "").trim();
      if (!mint) return null;

      const patternScore = Number(decision?.patternScore || 0);
      const confidence = Number(decision?.confidence || 0);
      const killSwitchScore = Number(decision?.killSwitchScore ?? 100);
      const connectedHolderPct = Number(decision?.connectedHolderPct ?? 0);
      return {
        ok: true,
        mint,
        signal: {
          mint,
          status: String(decision?.signalStatus || "HIGH_RISK"),
          patternScore: Number.isFinite(patternScore) ? patternScore : 0,
          confidence: Number.isFinite(confidence) ? confidence : 0,
          token: {
            mint,
            symbol: String(decision?.token?.symbol || "")
          },
          // Agent decisions do not currently include full kill-switch internals.
          // Keep a neutral placeholder and rely on status/pattern transitions.
          killSwitch: {
            score: Number.isFinite(killSwitchScore) ? killSwitchScore : 100,
            risk: {
              holderBehavior: {
                connectedHolderPct: Number.isFinite(connectedHolderPct) ? connectedHolderPct : 0
              }
            }
          }
        }
      };
    })
    .filter(Boolean);
}

function updateSessionAnalyticsFromItems(items) {
  const okItems = (items || []).filter((item) => item.ok && item.signal);
  if (!okItems.length) return;

  sessionAnalytics.batches += 1;
  sessionAnalytics.tokensSeen += okItems.length;
  sessionAnalytics.lastBatchAt = new Date().toISOString();

  okItems.forEach((item) => {
    const signal = item.signal || {};
    const status = String(signal.status || "HIGH_RISK");
    if (status === "FAVORABLE") sessionAnalytics.favorable += 1;
    else if (status === "CAUTION") sessionAnalytics.caution += 1;
    else sessionAnalytics.highRisk += 1;

    sessionAnalytics.patternTotal += Number(signal.patternScore || 0);
    sessionAnalytics.confidenceTotal += Number(signal.confidence || 0);
    sessionAnalytics.connectedTotal += Number(
      signal.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0
    );
  });

  const patternAvg =
    okItems.reduce((sum, item) => sum + Number(item.signal?.patternScore || 0), 0) / okItems.length;
  const favorableCount = okItems.filter((item) => String(item.signal?.status || "") === "FAVORABLE").length;
  const highRiskCount = okItems.filter((item) => String(item.signal?.status || "") === "HIGH_RISK").length;
  const killAvg =
    okItems.reduce((sum, item) => sum + Number(item.signal?.killSwitch?.score || 0), 0) / okItems.length;

  sessionTrendPoints.push({
    ts: new Date().toISOString(),
    patternAvg,
    favorablePct: (favorableCount / okItems.length) * 100,
    highRiskPct: (highRiskCount / okItems.length) * 100,
    killAvg
  });
  sessionTrendPoints = sessionTrendPoints.slice(-40);
  renderSessionTrend();
}

function heatTone(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "FAVORABLE") return "good";
  if (normalized === "CAUTION") return "warn";
  return "bad";
}

function renderHeatmap(items = []) {
  if (!heatmapStrip) return;
  const okItems = (items || []).filter((item) => item.ok && item.signal);
  if (!okItems.length) {
    heatmapStrip.innerHTML = `<div class="heat-cell muted">Run a scan to populate heatmap.</div>`;
    return;
  }

  heatmapStrip.innerHTML = okItems
    .map((item) => {
      const signal = item.signal || {};
      const token = signal.token || {};
      const market = signal.market || {};
      const symbol = String(token.symbol || shortMint(item.mint || token.mint || ""));
      const tone = heatTone(signal.status);
      return `
        <div class="heat-cell ${tone}" title="Pattern ${formatNumber(signal.patternScore || 0, 1)} | Kill ${formatNumber(signal.killSwitch?.score || 0, 0)} | Connected ${formatPct(signal.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0, 1)}">
          <strong>${escapeHtml(symbol)}</strong>
          <span>${escapeHtml(String(signal.status || "N/A"))}</span>
          <em>${formatUsdPrice(market.priceUsd || 0)}</em>
        </div>
      `;
    })
    .join("");
}

function renderSessionTrend() {
  if (!sessionTrend) return;
  if (sessionTrendPoints.length < 2) {
    sessionTrend.innerHTML = `<div class="muted">Session trend appears after at least 2 scan batches.</div>`;
    return;
  }

  const width = 520;
  const height = 130;
  const padX = 10;
  const padY = 10;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const lastIndex = sessionTrendPoints.length - 1;
  const toY = (value) => padY + (100 - Math.max(0, Math.min(100, value))) / 100 * usableH;
  const toX = (index) => padX + (index / Math.max(1, lastIndex)) * usableW;
  const pathFor = (values) =>
    values
      .map((value, index) => `${index === 0 ? "M" : "L"}${toX(index).toFixed(2)},${toY(value).toFixed(2)}`)
      .join(" ");

  const patternPath = pathFor(sessionTrendPoints.map((point) => point.patternAvg));
  const highRiskPath = pathFor(sessionTrendPoints.map((point) => point.highRiskPct));
  const latest = sessionTrendPoints[lastIndex];

  sessionTrend.innerHTML = `
    <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" ry="8"></rect>
      <path class="trend-line pattern" d="${patternPath}" />
      <path class="trend-line risk" d="${highRiskPath}" />
    </svg>
    <div class="trend-legend">
      <span><b>Pattern Avg</b> ${formatNumber(latest.patternAvg, 1)}</span>
      <span><b>High-Risk %</b> ${formatPct(latest.highRiskPct, 1)}</span>
      <span><b>Kill Avg</b> ${formatNumber(latest.killAvg, 1)}</span>
    </div>
  `;
}

function renderAlertFeed() {
  if (!alertFeed) return;
  if (!alertEvents.length) {
    alertFeed.innerHTML = `<div class="alert-item muted">No alerts yet. Alerts appear on status flips.</div>`;
    return;
  }

  alertFeed.innerHTML = alertEvents
    .slice(0, 24)
    .map(
      (entry) => `
        <div class="alert-item ${escapeHtml(entry.tone)}">
          <span>${escapeHtml(new Date(entry.ts).toLocaleTimeString())}</span>
          <strong>${escapeHtml(entry.text)}</strong>
        </div>
      `
    )
    .join("");
}

function pushAlertEvent(text, tone) {
  alertEvents.unshift({ ts: new Date().toISOString(), text, tone });
  alertEvents = alertEvents.slice(0, 60);
  renderAlertFeed();
}

function filteredAndSortedItems(items) {
  const filter = String(resultFilterSelect?.value || "all");
  const sortKey = String(resultSortSelect?.value || "pattern_desc");
  const base = (items || []).slice();

  const filtered = base.filter((item) => {
    if (!item?.ok || !item.signal) return filter === "all";
    const status = String(item.signal.status || "high_risk").toLowerCase();
    if (filter === "all") return true;
    return status === filter;
  });

  filtered.sort((a, b) => {
    if (!a.ok && b.ok) return 1;
    if (a.ok && !b.ok) return -1;
    if (!a.ok && !b.ok) return 0;

    const aSignal = a.signal || {};
    const bSignal = b.signal || {};
    const aRisk = Number(aSignal.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0);
    const bRisk = Number(bSignal.killSwitch?.risk?.holderBehavior?.connectedHolderPct || 0);
    const aLiquidity = Number(aSignal.market?.liquidityUsd || 0);
    const bLiquidity = Number(bSignal.market?.liquidityUsd || 0);
    const aPattern = Number(aSignal.patternScore || 0);
    const bPattern = Number(bSignal.patternScore || 0);
    const aConfidence = Number(aSignal.confidence || 0);
    const bConfidence = Number(bSignal.confidence || 0);

    if (sortKey === "confidence_desc") return bConfidence - aConfidence;
    if (sortKey === "liquidity_desc") return bLiquidity - aLiquidity;
    if (sortKey === "risk_desc") return bRisk - aRisk;
    return bPattern - aPattern;
  });

  return filtered;
}

function holderTier(amountPct) {
  const share = Number(amountPct || 0);
  if (share >= 2) return { icon: "🐋", label: "Whale", className: "tier-whale" };
  if (share >= 0.75) return { icon: "🐟", label: "Fish", className: "tier-fish" };
  return { icon: "🦐", label: "Shrimp", className: "tier-shrimp" };
}

function flowClass(buys, sells) {
  const b = Number(buys || 0);
  const s = Number(sells || 0);
  if (b > s) return "flow-buy";
  if (s > b) return "flow-sell";
  return "flow-neutral";
}

function buildGuardianViewModel(signal, regimeVm) {
  const kill = signal?.killSwitch || {};
  const risk = kill?.risk || {};
  const holderBehavior = risk?.holderBehavior || {};
  const market = signal?.market || {};
  const status = String(signal?.status || "HIGH_RISK");
  const killVerdict = String(kill?.verdict || "BLOCK");
  const connected = Number(holderBehavior?.connectedHolderPct || 0);
  const newWallet = Number(holderBehavior?.newWalletHolderPct || 0);
  const liquidity = Number(market?.liquidityUsd || 0);
  const volume = Number(market?.volume24hUsd || 0);
  const participation = volume / Math.max(1, liquidity);
  const volIndex = Number(regimeVm?.volatilityIndex ?? NaN);
  const adx = Number(regimeVm?.adx ?? NaN);
  const regime = String(regimeVm?.regime || "Unavailable");
  const strategy = String(regimeVm?.strategyHint || "Wait for sufficient data");

  let riskScore = 0;
  if (status === "HIGH_RISK") riskScore += 45;
  else if (status === "CAUTION") riskScore += 22;
  else riskScore += 8;

  if (killVerdict === "BLOCK") riskScore += 25;
  else if (killVerdict !== "PASS") riskScore += 10;

  if (connected > 35) riskScore += 18;
  else if (connected > 25) riskScore += 10;
  else if (connected > 15) riskScore += 4;

  if (newWallet > 30) riskScore += 12;
  else if (newWallet > 20) riskScore += 7;
  else if (newWallet > 10) riskScore += 3;

  if (liquidity < 15000) riskScore += 20;
  else if (liquidity < 40000) riskScore += 12;
  else if (liquidity < 80000) riskScore += 6;

  if (participation < 0.15) riskScore += 12;
  else if (participation < 0.35) riskScore += 6;
  else if (participation > 1) riskScore -= 3;

  if (regime.includes("Choppy & Volatile")) riskScore += 14;
  else if (regime.includes("Trending & Expanding")) riskScore += 8;
  else if (regime.includes("Ranging & Quiet")) riskScore += 4;
  else if (regime.includes("Trending & Stable")) riskScore -= 4;

  if (Number.isFinite(volIndex)) {
    if (volIndex >= 75) riskScore += 10;
    else if (volIndex >= 60) riskScore += 6;
    else if (volIndex <= 30) riskScore -= 3;
  }

  if (Number.isFinite(adx)) {
    if (adx < 18) riskScore += 5;
    else if (adx >= 30) riskScore -= 2;
  }

  riskScore = Math.max(0, Math.min(100, Number(riskScore.toFixed(2))));
  const guardianStatus = riskScore > 65 ? "DANGER" : riskScore > 35 ? "CAUTION" : "SAFE";
  const tone = guardianStatus === "DANGER" ? "bad" : guardianStatus === "CAUTION" ? "warn" : "good";

  let action = "Monitor mode.";
  if (guardianStatus === "DANGER") {
    action = "Avoid entry now. Keep this token in monitor-only mode until risk improves.";
  } else if (guardianStatus === "CAUTION") {
    action = regime.includes("Trending")
      ? "Entry-wait: use small test entries only after confirmation."
      : "Wait for cleaner confirmation before entry.";
  } else {
    action = "Setup supports cautious staged entry with strict risk controls.";
  }

  const stopGuidance = Number.isFinite(volIndex) && volIndex >= 70
    ? "High volatility: tighten stop by 20-30%."
    : Number.isFinite(volIndex) && volIndex >= 45
      ? "Moderate volatility: keep standard stop and trail."
      : "Low volatility: allow normal breathing room, trail gradually.";

  return {
    status: guardianStatus,
    tone,
    score: riskScore,
    strategy,
    action,
    stopGuidance
  };
}

function sparklineSvg(points = []) {
  const values = (points || []).map((value) => Number(value || 0)).filter((value) => value > 0);
  if (values.length < 2) {
    return `<svg class="sparkline" viewBox="0 0 120 36"><text x="4" y="22">No chart</text></svg>`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 116 + 2;
      const y = 30 - ((value - min) / span) * 24;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const trendUp = values[values.length - 1] >= values[0];
  const lineClass = trendUp ? "up" : "down";
  return `<svg class="sparkline ${lineClass}" viewBox="0 0 120 36"><path d="${path}" /></svg>`;
}

function avatarHtml(token, sizeClass = "token-avatar") {
  const symbol = String(token?.symbol || "?").toUpperCase();
  const initial = escapeHtml(symbol.slice(0, 1) || "?");
  const imageUrl = String(token?.imageUrl || "").trim();

  if (!imageUrl) {
    return `<div class="${sizeClass} fallback">${initial}</div>`;
  }

  return `
    <div class="${sizeClass}">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(symbol)}" loading="lazy" onerror="this.remove()" />
      <span>${initial}</span>
    </div>
  `;
}

function sanitizeTokenMeta(rawToken, mintFallback = "") {
  const token = rawToken || {};
  return {
    mint: String(token.mint || mintFallback || "").trim(),
    symbol: String(token.symbol || "").trim(),
    name: String(token.name || "Unknown Token").trim(),
    imageUrl: String(token.imageUrl || "").trim()
  };
}

function cacheTokenMeta(tokenLike, mintFallback = "") {
  const token = sanitizeTokenMeta(tokenLike, mintFallback);
  const mint = token.mint || mintFallback;
  if (!mint) return;
  const existing = mintDisplayCache.get(mint) || {};
  mintDisplayCache.set(mint, {
    mint,
    symbol: token.symbol || existing.symbol || "",
    name: token.name || existing.name || "Unknown Token",
    imageUrl: token.imageUrl || existing.imageUrl || ""
  });
}

function getTokenMetaForMint(mint, directToken = null) {
  const direct = sanitizeTokenMeta(directToken, mint);
  if (direct.mint || direct.symbol || direct.imageUrl) {
    cacheTokenMeta(direct, mint);
  }
  return mintDisplayCache.get(mint) || sanitizeTokenMeta(directToken, mint);
}

function firstPrice(values = []) {
  for (const value of values) {
    const n = Number(value || 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function explainDecisionReason(reason) {
  const text = String(reason || "").trim();
  if (!text) return "No clear reason provided.";
  if (text.includes("requires FAVORABLE")) return "Token status is not favorable yet.";
  if (text.includes("patternScore")) return "Quality score is below your minimum rule.";
  if (text.includes("confidence")) return "Confidence is below your minimum rule.";
  if (text.includes("connectedHolderPct")) return "Connected wallet risk is above your max rule.";
  if (text.includes("killSwitch verdict")) return "Kill-switch is not PASS.";
  if (text.includes("all policy gates passed")) return "All rules passed. Candidate is valid.";
  return text;
}

function pushMessage(text, type = "info", options = {}) {
  if (!messages) return;
  const item = document.createElement("div");
  item.className = `msg ${type}`;
  item.textContent = `${new Date().toLocaleTimeString()} - ${text}`;
  messages.prepend(item);

  const shouldToast =
    options.toast === true || (options.toast !== false && String(type || "info") !== "info");
  if (shouldToast) {
    showToastWindow(text, type, {
      title: options.title || (type === "error" ? "Warning" : type === "ok" ? "Success" : "Notice"),
      durationMs: options.durationMs
    });
  }
}

const AUTH_REQUIRED_CONTROL_SELECTORS = [
  "#discover-tokens",
  "#manual-mint",
  "#scan-manual",
  "#start-guided-scan",
  "#start-scan",
  "#scan-speed",
  "#scan-seconds",
  "#scan-hours",
  "#apply-pro-preset",
  "#paper-start-loop",
  "#paper-stop-loop",
  "#agent-run-test",
  "#agent-stop-all",
  "#agent-save-target",
  "#agent-target-mint",
  "#agent-operating-preset",
  "#paper-max-position",
  "#paper-budget",
  "#paper-interval",
  "#refresh-profile-workspace"
];

function setAuthRequiredControlsLocked(locked) {
  AUTH_REQUIRED_CONTROL_SELECTORS.forEach((selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.disabled = Boolean(locked);
    if (locked) {
      element.setAttribute("title", "Connect wallet first to unlock this action.");
    } else {
      element.removeAttribute("title");
    }
  });
}

function buildWalletRequiredError(actionLabel = "continue") {
  return annotateApiError(new Error(`Connect wallet first to ${actionLabel}.`), {
    code: "AUTH_REQUIRED",
    status: 401
  });
}

function friendlyErrorMessage(error, actionLabel = "continue") {
  const code = String(error?.code || "").toUpperCase();
  const status = Number(error?.status || 0);
  const raw = String(error?.message || "").trim();
  const lower = raw.toLowerCase();

  if (code === "AUTH_REQUIRED" || status === 401 || status === 403) {
    return `Connect wallet first to ${actionLabel}. If already connected, reconnect Phantom and retry.`;
  }
  if (code === "SCANNER_LIMIT_REACHED") {
    const remaining = Number(error?.scannerDailyRemaining ?? 0);
    const limit = Number(error?.scannerDailyLimit ?? 0);
    const resetHint = "Daily limit reached. Wait for UTC reset or increase KOBX holdings.";
    return limit > 0 ? `Daily scan limit reached (${remaining}/${limit} left). ${resetHint}` : resetHint;
  }
  if (status === 429 || code === "HTTP_429") {
    return "Too many requests right now. Wait a few seconds, then retry.";
  }
  if (code === "REQUEST_TIMEOUT" || lower.includes("timeout")) {
    return "Request timed out. Check your connection and retry.";
  }
  if (code === "NON_JSON") {
    return "Temporary gateway response issue. Retry in a few seconds.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("temporary gateway response")
  ) {
    return "Network issue: unable to reach the service. Refresh and retry.";
  }
  if (status === 404 || code === "HTTP_404") {
    return "Requested service route was not found. Refresh the app and retry.";
  }
  if (!raw) {
    return `Could not ${actionLabel}. Please retry.`;
  }
  return raw;
}

function isRateLimitedError(error) {
  const status = Number(error?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  return status === 429 || code === "HTTP_429";
}

function notifyActionError(error, actionLabel = "continue", options = {}) {
  const text = friendlyErrorMessage(error, actionLabel);
  const key = `${actionLabel}|${text}`;
  const now = Date.now();
  const prev = Number(recentErrorNoticeByKey.get(key) || 0);
  if (now - prev < 7000) {
    return;
  }
  recentErrorNoticeByKey.set(key, now);
  pushMessage(text, "error", {
    toast: options.toast !== false,
    title: "Action Blocked"
  });
}

function ensureWalletConnected(actionLabel = "continue") {
  if (authToken) return true;
  notifyActionError(buildWalletRequiredError(actionLabel), actionLabel, { toast: true });
  return false;
}

function setAuthState() {
  if (!authState) return;
  authState.textContent = authToken
    ? `Connected: ${userWallet.slice(0, 6)}...${userWallet.slice(-6)}`
    : "Not connected";

  if (!planStatus) return;
  if (!authToken) {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    reconnectNoticeShown = false;
    stopPaperLoop();
    stopEngineLoop();
    stopRealtimeMonitor();
    stopAgentPriceMonitor();
    planStatus.textContent = "FREE";
    planStatus.className = "badge";
    setAuthRequiredControlsLocked(true);
    if (navigator.onLine) {
      setNetworkStatus("Wallet required", "busy");
    }
    syncScannerModeUi();
    renderScannerAccessSummary(null);
    return;
  }

  setAuthRequiredControlsLocked(false);
  const normalizedPlan = String(userPlan || "free").toLowerCase() === "pro" ? "pro" : "free";
  planStatus.textContent = normalizedPlan.toUpperCase();
  planStatus.className = normalizedPlan === "pro" ? "badge ok" : "badge busy";
  syncScannerModeUi();
  renderScannerAccessSummary(scannerAccessStatus);
}

function formatScannerTierPill(access = {}) {
  const tier = String(access.scannerTier || "none").toLowerCase();
  if (tier === "high") {
    return `<span class="tier-pill high">High Tier</span>`;
  }
  if (tier === "base") {
    return `<span class="tier-pill">Base Tier</span>`;
  }
  return "<span class=\"tier-pill\">No Access</span>";
}

function renderScannerAccessSummary(access = {}) {
  const walletSummary = document.querySelector("#wallet-access-summary");
  const quotaSummary = document.querySelector("#scanner-quota-summary");
  if (!walletSummary && !quotaSummary) return;
  if (!authToken || !access || Object.keys(access).length === 0) {
    const guide = "Connect wallet to view KOBX balance and scanner quota. Tiers: 500K KOBX = 2 scans/day, 3M+ KOBX = 5 scans/day.";
    if (walletSummary) walletSummary.textContent = guide;
    if (quotaSummary) quotaSummary.textContent = guide;
    return;
  }
  const actual = Number(access.actualBalance || 0);
  const required = Number(access.requiredBalance || KOBX_REQUIRED_BALANCE);
  const limit = Number(access.scannerDailyLimit || 0);
  const used = Number(access.scannerDailyUsed || 0);
  const remaining = Number(access.scannerDailyRemaining || 0);
  const tierLabel = formatScannerTierPill(access);
  const eligible = Boolean(access.eligible);
  const nextTierHint = "Hold 3,000,000+ KOBX to unlock 5 scans/day.";
  const gateHint = "Hold at least 500,000 KOBX to unlock the scanner.";
  const walletLine = eligible
    ? `Balance: <strong>${formatNumber(actual, 2)} KOBX</strong>${tierLabel}`
    : `Balance: <strong>${formatNumber(actual, 2)} KOBX</strong>${tierLabel}<br>${gateHint}`;
  const quotaLine = eligible
    ? `Daily scans: <strong>${remaining}</strong> left of ${limit}. Used ${used} today. ${tierLabel}<br>${nextTierHint}`
    : `Daily scans: <strong>0</strong> available. ${gateHint}`;
  if (walletSummary) {
    walletSummary.innerHTML = walletLine;
  }
  if (quotaSummary) {
    quotaSummary.innerHTML = quotaLine;
  }
}

function syncScannerModeUi() {
  if (scannerModeNote) {
    if (!authToken) {
      scannerModeNote.textContent = "Manual mode active. Connect wallet to scan. Holder behavior uses recent on-chain transactions by default.";
    } else {
      scannerModeNote.textContent = "Manual mode active. Use Scanner Tools -> Manual token scan. Results are based on rolling recent transactions (not full lifetime history).";
    }
  }
}

function setScanStatus(text, mode = "idle") {
  if (!scanStatus) return;
  scanStatus.textContent = text;
  scanStatus.classList.remove("ok", "busy", "error");
  if (mode !== "idle") scanStatus.classList.add(mode);
}

function setPaperStatus(text, mode = "idle") {
  if (!paperTestStatus) return;
  paperTestStatus.textContent = text;
  paperTestStatus.classList.remove("ok", "busy", "error");
  if (mode !== "idle") paperTestStatus.classList.add(mode);

  const nextStatus = (() => {
    const lower = String(text || "").trim().toLowerCase();
    if (lower.includes("halt")) return "halted";
    if (lower.includes("exit")) return "exited";
    if (lower.includes("run")) return "monitoring";
    if (mode === "busy") return "executing";
    if (mode === "error") return "halted";
    return "scanning";
  })();
  updateAgentTradeState({ missionStatus: nextStatus });
}

function getMissionStatusPresentation(status) {
  const key = String(status || "scanning").trim().toLowerCase();
  const map = {
    scanning: {
      label: "Scanning",
      note: "AIG is checking current token conditions.",
      badgeClass: "busy"
    },
    evaluating: {
      label: "Evaluating",
      note: "Risk posture and confidence are being recalculated.",
      badgeClass: "busy"
    },
    planning: {
      label: "Planning",
      note: "Preview plan is ready for operator review.",
      badgeClass: "ok"
    },
    executing: {
      label: "Executing",
      note: "Paper execution is being submitted and validated.",
      badgeClass: "busy"
    },
    monitoring: {
      label: "Monitoring",
      note: "AIG is actively managing the open mission.",
      badgeClass: "ok"
    },
    exited: {
      label: "Exited",
      note: "Mission completed and no live paper position remains.",
      badgeClass: "ok"
    },
    halted: {
      label: "Halted",
      note: "Operator halt is active. New actions are blocked.",
      badgeClass: "error"
    }
  };
  return map[key] || map.scanning;
}

function buildAgentThesisView(source) {
  if (!source || typeof source !== "object") return null;
  const tradePlan = source.tradePlan || {};
  const market = source.market || {};
  const regime = source.marketRegime || {};
  const sentiment = source.sentiment || {};
  const signalStatus = String(source.signalStatus || source.status || "SCANNING").toUpperCase();
  const decision = String(source.decision || "").toUpperCase();
  const confidenceRaw = Number(
    source.confidence ??
    source.killSwitch?.confidence ??
    sentiment?.confidence ??
    0
  );
  const confidence = Math.max(0, Math.min(1, confidenceRaw));
  const patternScore = Number(source.patternScore || 0);
  const reasons = Array.isArray(source.reasons) && source.reasons.length
    ? source.reasons.filter(Boolean)
    : [
        String(tradePlan.recommendation || "").trim(),
        String(source.killSwitch?.summary || "").trim(),
        String(sentiment.summary || "").trim()
      ].filter(Boolean);
  const actionIntent = (() => {
    if (decision === "BUY_CANDIDATE") return "Engage mission";
    if (signalStatus === "FAVORABLE") return "Prepare staged entry";
    if (signalStatus === "CAUTION") return "Wait for confirmation";
    return "Stand down";
  })();
  const riskPosture = (() => {
    if (signalStatus === "FAVORABLE") return "Constructive";
    if (signalStatus === "CAUTION") return "Guarded";
    if (signalStatus === "HIGH_RISK") return "Defensive";
    return "Standby";
  })();
  const thesisSummary =
    reasons[0] ||
    String(tradePlan.recommendation || "").trim() ||
    "AIG is waiting for enough market structure to form a plan.";

  return {
    status: signalStatus,
    confidence,
    patternScore,
    reasons: reasons.slice(0, 4),
    actionIntent,
    riskPosture,
    executionPosture: PAPER_ONLY_MODE ? "Paper Guarded" : "Live Guarded",
    thesisSummary,
    entryLow: firstPrice([tradePlan.buyZone?.low]),
    entryHigh: firstPrice([tradePlan.buyZone?.high]),
    target: firstPrice([Array.isArray(tradePlan.resistance) ? tradePlan.resistance[0] : tradePlan.resistance]),
    stop: firstPrice([tradePlan.stopLoss]),
    holdHorizon: regime.timeframe ? `${String(regime.timeframe)} horizon` : "Adaptive hold horizon",
    price: Number(market.priceUsd || 0),
    token: source.token || getTokenMetaForMint(String(source.mint || "")),
    mint: String(source.mint || source.token?.mint || agentTargetMint || ""),
    regime: String(regime.regime || ""),
    regimeTimeframe: String(regime.timeframe || ""),
    note:
      signalStatus === "FAVORABLE"
        ? "Conditions are supportive enough for paper execution if budget and policy remain aligned."
        : signalStatus === "CAUTION"
          ? "AIG sees a setup forming, but the mission remains guarded."
          : "Risk pressure is elevated. AIG will prefer observation over entry."
  };
}

function recordAgentActivity(message, tone = "info", options = {}) {
  const event = {
    ts: String(options.ts || new Date().toISOString()),
    tone: String(tone || "info"),
    title: String(options.title || ""),
    message: String(message || "").trim(),
    meta: String(options.meta || "").trim(),
    eventType: String(options.eventType || "activity")
  };
  if (!event.message) return;
  agentTradeState.activity = [event, ...(agentTradeState.activity || [])].slice(0, 40);
  agentTradeState.missionModel = {
    ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
    activity: agentTradeState.activity.slice()
  };
  renderAgentActivityFeed();
}

function classifyMissionEventType(item = {}) {
  const explicit = String(item.eventType || "").trim();
  if (explicit) return explicit;
  const title = String(item.title || "").trim().toLowerCase();
  if (title.includes("mission initialized")) return "mission_initialized";
  if (title.includes("thesis")) return "thesis_updated";
  if (title.includes("confidence")) return "confidence_revised";
  if (title.includes("preview")) return "preview_requested";
  if (title.includes("execution requested")) return "execution_requested";
  if (title.includes("execution confirmed")) return "execution_confirmed";
  if (title.includes("execution deferred")) return "execution_deferred";
  if (title.includes("monitor")) return "monitoring_tick";
  if (title.includes("position closed")) return "position_closed";
  if (title.includes("halt")) return "halt_acknowledged";
  return "activity";
}

function missionEventLabel(eventType) {
  const labels = {
    mission_initialized: "Mission Initialized",
    thesis_updated: "Thesis Updated",
    confidence_revised: "Confidence Revised",
    preview_requested: "Preview Requested",
    execution_requested: "Execution Requested",
    execution_confirmed: "Execution Confirmed",
    execution_deferred: "Execution Deferred",
    monitoring_tick: "Monitoring Tick",
    position_closed: "Position Closed",
    halt_acknowledged: "Halt Acknowledged",
    worker_warning: "Worker Warning",
    worker_error: "Worker Error",
    activity: "Agent Update"
  };
  return labels[String(eventType || "").trim()] || "Agent Update";
}

function renderAgentActivityFeed() {
  if (!agentActivityFeed) return;
  const activity = Array.isArray(agentTradeState.activity) ? agentTradeState.activity : [];
  if (!activity.length) {
    agentActivityFeed.innerHTML = `<div class="agent-activity-empty">No live mission activity yet. Preview a plan or let AIG trade to begin the operator trace.</div>`;
    return;
  }

  agentActivityFeed.innerHTML = activity
    .map((item) => {
      const eventType = classifyMissionEventType(item);
      return `
      <article class="agent-activity-item ${escapeHtml(String(item.tone || "info"))} event-${escapeHtml(eventType)}">
        <div class="agent-activity-topline">
          <strong>${escapeHtml(missionEventLabel(eventType))}</strong>
          <span>${escapeHtml(new Date(item.ts).toLocaleTimeString())}</span>
        </div>
        <p>${escapeHtml(item.message)}</p>
        <div class="agent-activity-meta-row">
          <small class="agent-event-pill">${escapeHtml(eventType.replaceAll("_", " "))}</small>
          ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
        </div>
      </article>
    `;
    })
    .join("");
}

function renderMissionSessionHistory() {
  if (!agentSessionHistory) return;
  const sessions = Array.isArray(agentMissionSessions) ? agentMissionSessions : [];
  if (!sessions.length) {
    agentSessionHistory.innerHTML = `<div class="agent-activity-empty">No prior mission sessions stored for this workspace yet.</div>`;
    return;
  }
  agentSessionHistory.innerHTML = sessions
    .map((session) => {
      const isActive = String(session.sessionId || "") === String(agentTradeState.missionModel?.sessionId || "");
      return `
        <article class="agent-session-item ${isActive ? "active" : ""}">
          <div class="agent-session-topline">
            <strong>${escapeHtml(shortMint(String(session.sessionId || ""), 8, 8))}</strong>
            <span>${escapeHtml(String(session.missionStatus || "scanning").replaceAll("_", " "))}</span>
          </div>
          <div class="agent-session-grid">
            <span><label>Budget</label><strong>${formatUsd(Number(session.budgetUsd || 0))}</strong></span>
            <span><label>Started</label><strong>${escapeHtml(formatDateTime(session.startedAt || session.updatedAt || ""))}</strong></span>
            <span><label>Updated</label><strong>${escapeHtml(formatDateTime(session.updatedAt || ""))}</strong></span>
            <span><label>Outcome</label><strong>${escapeHtml(String(session.outcome || "active").replaceAll("_", " "))}</strong></span>
          </div>
          ${session.thesisSummary ? `<p class="small muted">${escapeHtml(session.thesisSummary)}</p>` : ""}
          <div class="agent-session-actions">
            <span class="small muted">${escapeHtml(String(session.provider || "openclaw"))}</span>
            <button type="button" class="secondary tiny-btn" data-resume-session="${escapeHtml(String(session.sessionId || ""))}" data-session-workspace="${escapeHtml(String(session.workspaceId || ""))}">Resume Session</button>
          </div>
        </article>
      `;
    })
    .join("");
  document.querySelectorAll("button[data-resume-session]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sessionId = String(button.getAttribute("data-resume-session") || "").trim();
      const workspaceId = String(button.getAttribute("data-session-workspace") || "").trim();
      if (!sessionId || !workspaceId) return;
      setButtonBusy(button, true, "Loading...");
      try {
        saveAgentMissionSessionId(sessionId);
        const snapshot = await api(`/api/mission/sessions/${encodeURIComponent(sessionId)}`, null, true, "GET");
        if (String(snapshot.workspaceId || "") !== workspaceId) {
          throw new Error("mission session does not match current workspace");
        }
        applyMissionStreamSnapshot(snapshot);
        startAgentMissionStream(workspaceId);
        pushMessage(`Resumed mission session ${shortMint(sessionId, 8, 8)}`, "ok");
      } catch (error) {
        notifyActionError(error, "resume mission session");
      } finally {
        setButtonBusy(button, false);
      }
    });
  });
}

function renderAgentDiagnostics() {
  if (agentWorkerDiagnostics) {
    const diagnostics = agentMissionDiagnostics || {};
    agentWorkerDiagnostics.innerHTML = `
      <div class="agent-diagnostics-status-grid">
        <span><label>Worker Status</label><strong>${escapeHtml(String(diagnostics.workerStatus || "idle").replaceAll("_", " "))}</strong></span>
        <span><label>Active Provider</label><strong>${escapeHtml(String(diagnostics.provider || agentTradeState.missionModel?.providerLabel || "openclaw"))}</strong></span>
        <span><label>Active Session</label><strong>${escapeHtml(shortMint(String(diagnostics.sessionId || agentTradeState.missionModel?.sessionId || "none"), 8, 8))}</strong></span>
        <span><label>Stream</label><strong>${escapeHtml(String(agentMissionStreamStatus || "idle"))}</strong></span>
        <span><label>Last Event</label><strong>${escapeHtml(agentMissionLastEventAt ? formatDateTime(agentMissionLastEventAt) : "n/a")}</strong></span>
        <span><label>Worker Heartbeat</label><strong>${escapeHtml(diagnostics.lastWorkerHeartbeat ? formatDateTime(diagnostics.lastWorkerHeartbeat) : agentMissionLastHeartbeatAt ? formatDateTime(agentMissionLastHeartbeatAt) : "n/a")}</strong></span>
        <span><label>Fallback</label><strong>${escapeHtml(String(diagnostics.fallbackState || "legacy_guarded_paper_execution").replaceAll("_", " "))}</strong></span>
        <span><label>Mission Status</label><strong>${escapeHtml(String(diagnostics.missionStatus || agentTradeState.missionStatus).replaceAll("_", " "))}</strong></span>
      </div>
    `;
  }
  renderMissionSessionHistory();
}

function renderAgentTokenIdentity() {
  const mint = String(agentTargetMint || "");
  const meta = getTokenMetaForMint(mint, null);
  const symbol = String(meta.symbol || "").trim() || (mint ? shortMint(mint, 4, 4) : "AIG");

  if (agentCurrentTokenAvatar) {
    agentCurrentTokenAvatar.className = "token-avatar fallback large";
    if (meta.imageUrl) {
      agentCurrentTokenAvatar.className = "token-avatar large";
      agentCurrentTokenAvatar.innerHTML = `<img src="${escapeHtml(meta.imageUrl)}" alt="${escapeHtml(symbol)}" loading="lazy" onerror="this.parentElement.className='token-avatar fallback large';this.parentElement.textContent='${escapeHtml(symbol.slice(0, 1) || "A")}';" /><span>${escapeHtml(symbol.slice(0, 1) || "A")}</span>`;
    } else {
      agentCurrentTokenAvatar.textContent = escapeHtml(symbol.slice(0, 1) || "A");
    }
  }
  if (agentCurrentTokenLabel) {
    agentCurrentTokenLabel.textContent = mint ? (meta.name || meta.symbol || shortMint(mint, 6, 6)) : "No token selected";
  }
  if (agentCurrentTokenMint) {
    agentCurrentTokenMint.textContent = mint
      ? `${meta.symbol || "TOKEN"} | ${shortMint(mint, 8, 8)}`
      : "Set a workspace token inside Developer / Engine Details.";
  }
}

function renderAgentMissionConsole() {
  renderAgentTokenIdentity();
  const statusMeta = getMissionStatusPresentation(agentTradeState.missionStatus);
  const missionModel = agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id);
  const view = missionModel.thesis || buildAgentThesisView(agentTradeState.decision || agentTradeState.preview);

  if (paperTestStatus) {
    paperTestStatus.textContent = statusMeta.label;
    paperTestStatus.classList.remove("ok", "busy", "error");
    if (statusMeta.badgeClass) paperTestStatus.classList.add(statusMeta.badgeClass);
  }

  if (agentMissionStatusLabel) agentMissionStatusLabel.textContent = statusMeta.label;
  if (agentMissionStatusNote) {
    agentMissionStatusNote.textContent = agentTradeState.error || statusMeta.note;
  }

  if (agentConfidenceMeter) {
    const confidencePct = Math.round(Number(view?.confidence || 0) * 100);
    agentConfidenceMeter.innerHTML = `<span>Confidence</span><strong>${confidencePct}%</strong>`;
    agentConfidenceMeter.style.setProperty("--confidence-pct", `${confidencePct}%`);
  }

  if (agentRiskPosture) agentRiskPosture.textContent = view?.riskPosture || "Standby";
  if (agentRiskPostureNote) agentRiskPostureNote.textContent = view?.note || "No plan generated yet.";
  if (agentActionIntent) agentActionIntent.textContent = view?.actionIntent || "No action";
  if (agentActionIntentNote) {
    agentActionIntentNote.textContent = view?.status
      ? `Signal status ${view.status.replaceAll("_", " ")}`
      : "Preview a plan to see intent.";
  }
  if (agentExecutionPosture) {
    agentExecutionPosture.textContent =
      agentTradeState.emergencyStopEnabled ? "Emergency Halt" : (view?.executionPosture || "Guarded mission runtime");
  }
  if (agentExecutionPostureNote) {
    agentExecutionPostureNote.textContent = agentTradeState.position
      ? `${missionModel.providerLabel} is managing the current paper position.`
      : `${missionModel.providerLabel} is the active mission source. Workspace artifacts stay aligned for OpenClaw runtime handoff.`;
  }
  if (agentThesisSummary) {
    agentThesisSummary.textContent = view?.thesisSummary || "AIG will synthesize thesis, risk posture, and execution intent here.";
  }
  if (agentThesisReasons) {
    const reasons = Array.isArray(view?.reasons) && view.reasons.length
      ? view.reasons
      : ["Save one token and preview the plan to generate reasoning."];
    agentThesisReasons.innerHTML = reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  }

  const trace = {
    ...(agentTradeState.executionTrace || DEFAULT_AGENT_MISSION_STATE.executionTrace),
    ...(missionModel.executionTrace || {})
  };
  if (agentExecutionMode) {
    agentExecutionMode.textContent = agentTradeState.emergencyStopEnabled ? "Halt Engaged" : "Guarded Runtime";
    agentExecutionMode.className = `pill ${agentTradeState.emergencyStopEnabled ? "high-risk" : "caution"}`;
  }
  if (agentExecutionTrace) {
    agentExecutionTrace.innerHTML = `
      <div><span>Preview State</span><strong>${escapeHtml(String(trace.previewState || "-"))}</strong></div>
      <div><span>Submitted</span><strong>${escapeHtml(String(trace.submitted || "-"))}</strong></div>
      <div><span>Tx Hash</span><strong>${escapeHtml(String(trace.txHash || "-"))}</strong></div>
      <div><span>Filled Amount</span><strong>${escapeHtml(String(trace.filledAmount || "-"))}</strong></div>
      <div><span>Average Entry</span><strong>${escapeHtml(String(trace.averageEntry || "-"))}</strong></div>
      <div><span>Stop Loss</span><strong>${escapeHtml(String(trace.stopLoss || "-"))}</strong></div>
      <div><span>Take Profit</span><strong>${escapeHtml(String(trace.takeProfit || "-"))}</strong></div>
      <div><span>Hold Horizon</span><strong>${escapeHtml(String(trace.holdHorizon || "-"))}</strong></div>
      <div><span>Current PnL</span><strong>${escapeHtml(String(trace.currentPnl || "-"))}</strong></div>
    `;
  }

  if (agentModeView) agentModeView.value = PAPER_ONLY_MODE ? "Paper runtime" : "Live guarded runtime";
  if (agentTrailingPreview) agentTrailingPreview.textContent = `${formatNumber(Number(engineTrailingInput?.value || CORE_ENGINE_PROFILE.trailingStopPct), 1)}%`;
  if (agentOpenSlotsPreview) agentOpenSlotsPreview.textContent = String(CORE_ENGINE_PROFILE.maxOpenPositions);
  if (agentHaltState) agentHaltState.textContent = agentTradeState.emergencyStopEnabled ? "Engaged" : "Armed";
  if (agentProviderTag) agentProviderTag.textContent = missionModel.providerLabel || "Mission runtime";
  if (agentProviderBadge) {
    agentProviderBadge.textContent = missionModel.providerLabel || "Mission runtime";
    agentProviderBadge.className = `agent-provider-badge ${missionModel.provider === "openclaw" ? "openclaw" : "legacy"}`;
  }
  if (agentAdvancedDrawer) agentAdvancedDrawer.open = Boolean(agentTradeState.advancedOpen);

  if (agentPriceStripPrice) {
    const openPrice = Number(agentTradeState.position?.lastPriceUsd || agentTradeState.position?.entryPriceUsd || view?.price || 0);
    agentPriceStripPrice.textContent = openPrice > 0 ? formatPrice(openPrice) : "$0.00";
  }
  if (agentPriceStripContext) {
    if (agentTradeState.position) {
      agentPriceStripContext.textContent = `Live pulse locked on active position. Time open ${formatDurationSince(agentTradeState.position.opened_at)}.`;
    } else if (view?.regime) {
      agentPriceStripContext.textContent = `${view.regime}${view.regimeTimeframe ? ` (${view.regimeTimeframe})` : ""} | ${view.note}`;
    } else {
      agentPriceStripContext.textContent = "No active market pulse yet.";
    }
  }

  renderAgentActivityFeed();
  renderAgentDiagnostics();
}

function updateAgentTradeState(patch = {}) {
  const nextMissionModel =
    patch.missionModel === undefined
      ? agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)
      : {
          ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
          ...(patch.missionModel || {})
        };
  const nextActivity =
    patch.activity !== undefined
      ? patch.activity
      : Array.isArray(patch.missionModel?.activity)
        ? patch.missionModel.activity
        : agentTradeState.activity;
  agentTradeState = {
    ...agentTradeState,
    ...patch,
    activity: nextActivity,
    missionModel: nextMissionModel,
    executionTrace: {
      ...(agentTradeState.executionTrace || DEFAULT_AGENT_MISSION_STATE.executionTrace),
      ...(patch.executionTrace || {})
    }
  };
  if (nextMissionModel?.sessionId !== undefined) {
    saveAgentMissionSessionId(nextMissionModel.sessionId);
  }
  renderAgentMissionConsole();
}

function formatDurationSince(value) {
  const ts = Date.parse(String(value || ""));
  if (!Number.isFinite(ts)) return "n/a";
  const elapsed = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

function renderPaperSessionTiming() {
  if (!paperSessionTiming) return;
  const startText = paperSessionStartedAt ? formatDateTime(paperSessionStartedAt) : "Not started";
  const stopText = paperSessionStoppedAt ? formatDateTime(paperSessionStoppedAt) : "Running / not stopped";
  paperSessionTiming.innerHTML = `
    <span><strong>Session Start:</strong> ${escapeHtml(startText)}</span>
    <span><strong>Session Stop:</strong> ${escapeHtml(stopText)}</span>
  `;
}

function setButtonBusy(button, busy, busyLabel = "Loading...") {
  if (!button) return;
  if (busy) {
    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent || "";
    }
    button.disabled = true;
    button.classList.add("loading");
    button.textContent = busyLabel;
    return;
  }

  button.disabled = false;
  button.classList.remove("loading");
  button.textContent = button.dataset.defaultLabel || button.textContent;
}

function blockFullscreenUi(message = "Processing request...") {
  fullscreenBlockDepth += 1;
  if (!fullscreenLoader) return;
  fullscreenLoader.hidden = false;
  fullscreenLoader.setAttribute("aria-hidden", "false");
  if (fullscreenLoaderText) {
    fullscreenLoaderText.textContent = message;
  }
  document.body.classList.add("ui-blocked");
}

function unblockFullscreenUi() {
  fullscreenBlockDepth = Math.max(0, fullscreenBlockDepth - 1);
  if (!fullscreenLoader || fullscreenBlockDepth > 0) return;
  fullscreenLoader.hidden = true;
  fullscreenLoader.setAttribute("aria-hidden", "true");
  document.body.classList.remove("ui-blocked");
  if (fullscreenLoaderText) {
    fullscreenLoaderText.textContent = "Crunching scanner data...";
  }
}

function setWorkspace(mode) {
  const target = mode === "agent" || mode === "profile" ? mode : "scanner";
  document.body.classList.remove("workspace-scanner", "workspace-agent", "workspace-profile");
  document.body.classList.add(`workspace-${target}`);
  localStorage.setItem("enigma_workspace_mode", target);

  showScannerWorkspaceButton?.classList.toggle("active", target === "scanner");
  showAgentWorkspaceButton?.classList.toggle("active", target === "agent");
  showProfileWorkspaceButton?.classList.toggle("active", target === "profile");

  if (workspaceSummary) {
    if (target === "scanner") {
      workspaceSummary.textContent = "Scanner workspace: run one-token random/manual scans and review risk cards.";
    } else if (target === "agent") {
      workspaceSummary.textContent = "Agent workspace: run paper simulation, then managed engine with strict risk rules.";
    } else {
      workspaceSummary.textContent = "Profile workspace: review connected wallet summary and full account history.";
    }
  }

  if (target === "profile") {
    void loadProfileWorkspaceData({ silent: true });
  }

  if (target === "agent") {
    startAgentPriceMonitor();
  } else {
    stopAgentPriceMonitor();
  }
}

function initWorkspace() {
  const stored = String(localStorage.getItem("enigma_workspace_mode") || "scanner");
  const mode = stored === "agent" || stored === "profile" ? stored : "scanner";
  setWorkspace(mode);
}

function startSpaceEntryAnimation() {
  if (!document.body) return;
  document.body.classList.add("space-entry");
  window.setTimeout(() => {
    document.body.classList.remove("space-entry");
  }, 1500);
}

function applyBeginnerSetup({ quiet = false } = {}) {
  if (riskPresetSelect) riskPresetSelect.value = "balanced";
  applyPreset("balanced");
  if (alertFavorableInput) alertFavorableInput.checked = true;
  if (alertHighRiskInput) alertHighRiskInput.checked = true;
  if (alertSoundInput) alertSoundInput.checked = true;
  alertPrefs.favorable = true;
  alertPrefs.highRisk = true;
  alertPrefs.sound = true;
  persistAlertPrefs();
  syncAlertUi();
  if (!quiet) {
    pushMessage("Default scanner setup applied: balanced risk preset with alert defaults.", "ok");
  }
}

function applyPaperBeginner25Preset({ quiet = false } = {}) {
  applyPaperTestModel(CORE_AGENT_MODEL_KEY, { quiet: true, persist: true });
  if (paperMaxPositionInput) paperMaxPositionInput.value = "5";
  if (paperIntervalInput) paperIntervalInput.value = "30";

  if (engineAmountInput) engineAmountInput.value = "5";
  if (engineMaxOpenInput) engineMaxOpenInput.value = String(CORE_ENGINE_PROFILE.maxOpenPositions);
  if (engineTpInput) engineTpInput.value = String(CORE_ENGINE_PROFILE.tpPct);
  if (engineSlInput) engineSlInput.value = String(CORE_ENGINE_PROFILE.slPct);
  if (engineTrailingInput) engineTrailingInput.value = String(CORE_ENGINE_PROFILE.trailingStopPct);
  if (engineHoldMinutesInput) engineHoldMinutesInput.value = String(CORE_ENGINE_PROFILE.maxHoldMinutes);
  if (engineCooldownInput) engineCooldownInput.value = String(CORE_ENGINE_PROFILE.cooldownSec);
  if (enginePollInput) enginePollInput.value = "30";

  applyBeginnerSetup({ quiet: true });
  syncQuickAmountButtonState();
  if (!quiet) {
    pushMessage("Applied $25 default setup for safe paper simulation.", "ok");
  }
}

function resolvePaperTestModel(name) {
  const key = String(name || "").trim().toLowerCase();
  if (paperTestModels[key]) return key;
  return CORE_AGENT_MODEL_KEY;
}

function inferPaperTestModel(config) {
  return CORE_AGENT_MODEL_KEY;
}

function applyPaperTestModel(name, { quiet = false, persist = true } = {}) {
  const key = resolvePaperTestModel(name);
  const model = paperTestModels[key];
  if (!model) return;

  if (paperTestModelSelect) {
    paperTestModelSelect.value = key;
  }
  if (paperTestModelNote) {
    paperTestModelNote.textContent = `${model.label}: ${model.description}`;
  }

  if (paperMinPatternInput) paperMinPatternInput.value = String(model.minPatternScore);
  if (paperMinConfidenceInput) paperMinConfidenceInput.value = String(model.minConfidence);
  if (paperMaxConnectedInput) paperMaxConnectedInput.value = String(model.maxConnectedHolderPct);
  if (paperAllowCautionInput) paperAllowCautionInput.checked = Boolean(model.allowCautionEntries);
  if (paperAllowHighRiskInput) paperAllowHighRiskInput.checked = Boolean(model.allowHighRiskEntries);

  if (persist) {
    localStorage.setItem("enigma_paper_test_model", key);
  }

  if (!quiet) {
    pushMessage(`Test model applied: ${model.label}.`, "ok");
  }
}

function applySavedPaperTestModel() {
  applyPaperTestModel(CORE_AGENT_MODEL_KEY, { quiet: true, persist: false });
}

function applyLivePreviewMode() {
  if (!LIVE_MODE_PREVIEW_DISABLED) return;
  if (agentRunLiveButton) {
    agentRunLiveButton.disabled = true;
    agentRunLiveButton.hidden = true;
    agentRunLiveButton.title = "Live mode is disabled in this paper-only build.";
    agentRunLiveButton.textContent = "Run Live (Disabled)";
  }
  if (engineStartLoopButton) {
    engineStartLoopButton.disabled = true;
    engineStartLoopButton.hidden = true;
  }
  if (engineStopLoopButton) {
    engineStopLoopButton.disabled = true;
    engineStopLoopButton.hidden = true;
  }
  const liveCard = engineStartLoopButton?.closest("article");
  if (liveCard) {
    liveCard.style.display = "none";
  }
  if (engineSummary) {
    engineSummary.textContent = "Paper-only mode active. Live agent is disabled.";
  }
}

async function api(url, body, requireAuth = false, method = body ? "POST" : "GET", options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (requireAuth && !authToken) {
    throw buildWalletRequiredError("continue");
  }

  const maxAttempts = Math.max(1, Number(options.maxAttempts || 3));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutMs = Math.max(5000, Number(options.timeoutMs || 18000));
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: "same-origin"
      });
      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          response.status === 401 || response.status === 403
            ? "Wallet session invalid"
            : response.status === 429
              ? "Rate limit reached"
              : isJson
                ? String(payload?.error || payload?.message || `Request failed (${response.status})`)
                : `Request failed (${response.status})`;
        const error = annotateApiError(new Error(message), {
          status: response.status,
          code: response.status === 401 || response.status === 403 ? "AUTH_REQUIRED" : `HTTP_${response.status}`,
          transient: [408, 425, 500, 502, 503, 504].includes(response.status)
        });
        if (isJson && payload && typeof payload === "object") {
          Object.entries(payload).forEach(([key, value]) => {
            if (!(key in error)) {
              error[key] = value;
            }
          });
          if (String(payload.code || "").trim()) {
            error.code = String(payload.code);
          }
        }
        if (isTransientApiFailure(error) && response.status !== 429 && attempt < maxAttempts) {
          await sleep(250 * attempt);
          continue;
        }
        throw error;
      }

      if (!isJson) {
        const error = annotateApiError(new Error("Temporary gateway response"), {
          code: "NON_JSON",
          transient: true
        });
        if (attempt < maxAttempts) {
          await sleep(250 * attempt);
          continue;
        }
        throw error;
      }

      reconnectBackoffMs = 5000;
      reconnectNoticeShown = false;
      setNetworkStatus("Connected", "ok");
      return payload;
    } catch (error) {
      clearTimeout(timeout);
      const annotated = annotateApiError(error, {
        transient: error?.name === "AbortError" || /failed to fetch/i.test(String(error?.message || "")),
        code: error?.name === "AbortError" ? "REQUEST_TIMEOUT" : error?.code
      });
      if (isTransientApiFailure(annotated) && Number(annotated?.status || 0) !== 429 && attempt < maxAttempts) {
        setNetworkStatus("Reconnecting...", "busy");
        await sleep(250 * attempt);
        continue;
      }
      if (isTransientApiFailure(annotated)) {
        setNetworkStatus("Connection issue", "error");
      }
      throw annotated;
    }
  }
  throw new Error("Request failed after retries");
}

function syncPaperConfigUi(config) {
  if (!config) return;
  applyPaperTestModel(CORE_AGENT_MODEL_KEY, { quiet: true, persist: false });
  if (paperMaxPositionInput) paperMaxPositionInput.value = String(config.maxPositionUsd ?? 25);
  if (paperIntervalInput) paperIntervalInput.value = String(config.scanIntervalSec ?? 10);
  if (paperBudgetInput && Number.isFinite(Number(config.paperBudgetUsd))) {
    paperBudgetInput.value = String(config.paperBudgetUsd);
  }
  updateAgentTradeState({
    budgetUsd: Number(paperBudgetInput?.value || config.paperBudgetUsd || agentTradeState.budgetUsd || 100)
  });
}

function readPaperConfigFromUi() {
  const selectedModel = paperTestModels[CORE_AGENT_MODEL_KEY];
  return {
    enabled: true,
    mode: "paper",
    allowCautionEntries: Boolean(selectedModel.allowCautionEntries),
    allowHighRiskEntries: Boolean(selectedModel.allowHighRiskEntries),
    minPatternScore: Math.max(
      0,
      Math.min(95, Number(selectedModel.minPatternScore))
    ),
    minConfidence: Math.max(
      0.1,
      Math.min(0.99, Number(selectedModel.minConfidence))
    ),
    maxConnectedHolderPct: Math.max(
      1,
      Math.min(80, Number(selectedModel.maxConnectedHolderPct))
    ),
    requireKillSwitchPass: true,
    maxPositionUsd: Math.max(1, Math.min(50000, Number(paperMaxPositionInput?.value || 25))),
    scanIntervalSec: Math.max(5, Math.min(3600, Number(paperIntervalInput?.value || 10)))
  };
}

function stopPaperLoop() {
  const wasRunning = Boolean(paperTradeTimer);
  if (paperTradeTimer) {
    clearInterval(paperTradeTimer);
    paperTradeTimer = null;
  }
  if (paperRunCapTimer) {
    clearTimeout(paperRunCapTimer);
    paperRunCapTimer = null;
  }
  stopRealtimeMonitor();
  if (paperSessionStartedAt && (wasRunning || !paperSessionStoppedAt)) {
    paperSessionStoppedAt = new Date().toISOString();
  }
  renderPaperSessionTiming();
  setPaperStatus("Idle");
  updateAgentTradeState({
    missionStatus: agentTradeState.emergencyStopEnabled ? "halted" : (wasRunning ? "exited" : agentTradeState.missionStatus),
    isExecuteLoading: false
  });
}

function buildProjectedPnl(decision) {
  const confidence = Number(decision.confidence || 0);
  const pattern = Number(decision.patternScore || 0);
  const edge = confidence * 0.7 + pattern / 100 * 0.3;
  const expectedPct = (edge - 0.55) * 18;
  return Number(expectedPct.toFixed(2));
}

function renderPaperResults(payload) {
  if (!paperResults || !paperSummary) return;
  const decisions = Array.isArray(payload?.decisions) ? payload.decisions : [];
  if (!decisions.length) {
    paperSummary.textContent = "No test results yet.";
    paperResults.innerHTML = "";
    return;
  }

  decisions.forEach((item) => {
    cacheTokenMeta(item.token, String(item.mint || ""));
  });

  const candidates = decisions.filter((item) => item.ok && item.decision === "BUY_CANDIDATE");
  const skipped = decisions.length - candidates.length;
  const successForecasts = candidates.filter((item) => buildProjectedPnl(item) > 0).length;
  const nonPositiveForecasts = Math.max(0, candidates.length - successForecasts);
  const simulatedExposure = Number(payload?.summary?.simulatedExposureUsd || 0);
  const budgetCap = Number(payload?.summary?.paperBudgetUsd || paperBudgetInput?.value || 100);
  const budgetAvailable = Number(payload?.summary?.paperAvailableUsd || 0);
  const openExposure = Number(payload?.summary?.openExposureUsd || 0);
  const tradeSnapshot = getPaperTradeSnapshot();
  paperSummary.innerHTML = `
    <strong>AIG Core paper scan</strong> at
    ${escapeHtml(new Date(payload.ts || Date.now()).toLocaleTimeString())}:
    ${candidates.length} candidate entries, ${skipped} blocked, positive forecast ${successForecasts}, weak forecast ${nonPositiveForecasts}, projected exposure ${formatUsd(simulatedExposure)}.
    <br /><span class="small muted">Executed buys ${formatNumber(tradeSnapshot.buyCount, 0)} | Executed sells ${formatNumber(tradeSnapshot.sellCount, 0)} | Wins ${formatNumber(tradeSnapshot.winSells, 0)} | Losses ${formatNumber(tradeSnapshot.lossSells, 0)}.</span>
    <br /><span class="small muted">Budget ${formatUsd(budgetCap)} | Open exposure ${formatUsd(openExposure)} | Available ${formatUsd(budgetAvailable)} | Net PnL ${formatSignedUsd(tradeSnapshot.netPnlUsd)}.</span>
    ${
      Array.isArray(payload?.warnings) && payload.warnings.length
        ? `<br /><span class="error-text">${escapeHtml(payload.warnings.join(" | "))}</span>`
        : ""
    }
  `;

  paperResults.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>Token</th>
          <th>Decision</th>
          <th>Entry Price</th>
          <th>Target Sell</th>
          <th>Stop Loss</th>
          <th>Confidence</th>
          <th>Expected PnL %</th>
          <th>Simple Reason</th>
        </tr>
      </thead>
      <tbody>
        ${decisions
          .map((item) => {
            const tokenMeta = getTokenMetaForMint(String(item.mint || ""), item.token || null);
            const tradePlan = item.tradePlan || {};
            const buyZone = tradePlan.buyZone || {};
            const resistance = Array.isArray(tradePlan.resistance) ? tradePlan.resistance : [];
            const support = Array.isArray(tradePlan.support) ? tradePlan.support : [];
            const marketPrice = firstPrice([item.entryPriceUsd, item.market?.priceUsd]);
            const entryLow = firstPrice([buyZone.low]);
            const entryHigh = firstPrice([buyZone.high]);
            const entryPriceText =
              entryLow && entryHigh
                ? `${formatPrice(entryLow)} - ${formatPrice(entryHigh)}`
                : marketPrice
                  ? formatPrice(marketPrice)
                  : "N/A";
            const targetSell = firstPrice([resistance[0], marketPrice ? marketPrice * 1.08 : null]);
            const stopLoss = firstPrice([tradePlan.stopLoss, support[1], support[0]]);
            const reason = Array.isArray(item.reasons) && item.reasons.length ? item.reasons[0] : "";
            const projectedPnl =
              item.ok && item.decision === "BUY_CANDIDATE" ? `${formatNumber(buildProjectedPnl(item), 2)}%` : "-";
            return `
              <tr>
                <td>
                  <div class="paper-token-cell">
                    ${avatarHtml(tokenMeta, "token-avatar small")}
                    <div>
                      <strong>${escapeHtml(tokenMeta.symbol || "N/A")}</strong>
                      <span>${escapeHtml(shortMint(item.mint, 6, 6))}</span>
                    </div>
                  </div>
                </td>
                <td><span class="paper-pill ${item.decision === "BUY_CANDIDATE" ? "buy" : "skip"}">${escapeHtml(item.decision || "SKIP")}</span></td>
                <td>${entryPriceText}</td>
                <td>${targetSell ? formatPrice(targetSell) : "N/A"}</td>
                <td>${stopLoss ? formatPrice(stopLoss) : "N/A"}</td>
                <td>${formatNumber(Number(item.confidence || 0) * 100, 1)}%</td>
                <td>${projectedPnl}</td>
                <td>${escapeHtml(explainDecisionReason(reason))}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function getPaperTradeSnapshot() {
  const events = tradeActivityEvents.filter(
    (event) =>
      String(event.mode || "paper") === "paper" &&
      (String(event.action || "").toUpperCase() === "BUY" || String(event.action || "").toUpperCase() === "SELL")
  );

  let realizedPnlUsd = 0;
  let cumulativeExposureUsd = 0;
  let buyCount = 0;
  let sellCount = 0;
  let winSells = 0;
  let lossSells = 0;

  for (const event of events) {
    const side = String(event.action || "").toUpperCase();
    const sizeUsd = Number(event.sizeUsd || 0);
    if (side === "BUY") {
      buyCount += 1;
      cumulativeExposureUsd += Math.max(0, sizeUsd);
      continue;
    }
    if (side !== "SELL") continue;
    sellCount += 1;
    const pnlPct = Number(event.pnlPct);
    if (!Number.isFinite(pnlPct)) continue;
    const pnlUsd = sizeUsd * (pnlPct / 100);
    realizedPnlUsd += pnlUsd;
    if (pnlUsd > 0) winSells += 1;
    else if (pnlUsd < 0) lossSells += 1;
  }

  const openPaperPositions = (latestEngineOpenPositions || []).filter(
    (position) => String(position?.mode || "paper") === "paper"
  );
  const openExposureUsd = openPaperPositions.reduce(
    (sum, position) => sum + Math.max(0, Number(position?.sizeUsd || 0)),
    0
  );
  const unrealizedPnlUsd = openPaperPositions.reduce((sum, position) => {
    const sizeUsd = Number(position?.sizeUsd || 0);
    const pnlPct = Number(position?.pnlPct);
    if (!Number.isFinite(sizeUsd) || !Number.isFinite(pnlPct)) return sum;
    return sum + sizeUsd * (pnlPct / 100);
  }, 0);

  const netPnlUsd = realizedPnlUsd + unrealizedPnlUsd;
  const closedWinRatePct = sellCount ? (winSells / sellCount) * 100 : 0;
  const budgetCapUsd = Number(
    Math.max(10, Math.min(1_000_000, Number(paperBudgetInput?.value || 100))).toFixed(2)
  );
  const budgetAvailableUsd = Number(Math.max(0, budgetCapUsd - openExposureUsd).toFixed(2));
  const budgetUsagePct = budgetCapUsd > 0 ? (openExposureUsd / budgetCapUsd) * 100 : 0;

  return {
    events,
    realizedPnlUsd: Number(realizedPnlUsd.toFixed(4)),
    unrealizedPnlUsd: Number(unrealizedPnlUsd.toFixed(4)),
    netPnlUsd: Number(netPnlUsd.toFixed(4)),
    cumulativeExposureUsd: Number(cumulativeExposureUsd.toFixed(4)),
    openExposureUsd: Number(openExposureUsd.toFixed(4)),
    budgetCapUsd,
    budgetAvailableUsd,
    budgetUsagePct: Number(budgetUsagePct.toFixed(2)),
    buyCount,
    sellCount,
    winSells,
    lossSells,
    closedWinRatePct: Number(closedWinRatePct.toFixed(2))
  };
}

function renderPaperPerformance(performance) {
  if (!paperPerformanceRuns) return;
  const totals = performance?.totals || {};
  const runs = Array.isArray(performance?.recentRuns) ? performance.recentRuns : [];
  const forecastSuccess = runs.filter((run) => Number(run.expectedPnlPct || 0) > 0).length;
  const forecastFail = Math.max(0, runs.length - forecastSuccess);
  const cumulativeTurnoverUsd = Number(totals.totalExposureUsd || 0);
  const forecastPnlUsd = cumulativeTurnoverUsd * (Number(totals.avgExpectedPnlPct || 0) / 100);
  const tradeSnapshot = getPaperTradeSnapshot();
  const realizedPnlUsd = tradeSnapshot.realizedPnlUsd;

  if (paperPerformanceSummary) {
    paperPerformanceSummary.innerHTML = `
      <div class="msg">
        Runs ${formatNumber(totals.runs || 0, 0)} | Buys ${formatNumber(totals.buyCandidates || 0, 0)} | Hit rate ${formatPct(
          totals.acceptanceRatePct || 0,
          2
        )} | Positive forecast ${formatNumber(forecastSuccess, 0)} | Non-positive ${formatNumber(
          forecastFail,
          0
        )} | Forecast PnL ${formatSignedUsd(forecastPnlUsd)} | Realized PnL ${formatSignedUsd(realizedPnlUsd)} | Net ${formatSignedUsd(
          tradeSnapshot.netPnlUsd
        )}
      </div>
    `;
  }

  if (!runs.length) {
    paperPerformanceRuns.innerHTML = `<div class="msg">No run history yet. Execute a paper test first.</div>`;
    renderPaperEquityChart([]);
    return;
  }

  paperPerformanceRuns.innerHTML = `
    <table class="paper-results-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Mode</th>
          <th>Scanned</th>
          <th>Candidates</th>
          <th>Skipped</th>
          <th>Projected Exposure</th>
          <th>Expected PnL %</th>
        </tr>
      </thead>
      <tbody>
        ${runs
          .map(
            (run) => `
          <tr>
            <td>${escapeHtml(new Date(run.created_at).toLocaleString())}</td>
            <td><span class="paper-pill ${run.mode === "paper" ? "buy" : "skip"}">${escapeHtml(run.mode)}</span></td>
            <td>${formatNumber(run.scannedCount || 0, 0)}</td>
            <td>${formatNumber(run.buyCandidates || 0, 0)}</td>
            <td>${formatNumber(run.skippedCount || 0, 0)}</td>
            <td>${formatUsd(run.simulatedExposureUsd || 0)}</td>
            <td>${formatPct(run.expectedPnlPct || 0, 2)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  renderPaperEquityChart(runs);
}

function renderPaperEquityChart(runs) {
  if (!paperEquityChart) return;
  if (!Array.isArray(runs) || runs.length < 2) {
    paperEquityChart.innerHTML = `<div class="muted">Paper equity curve appears after at least 2 runs.</div>`;
    return;
  }

  const chronological = runs.slice().reverse();
  const series = [];
  let equity = 100;
  let peak = 100;
  let maxDrawdown = 0;
  for (const run of chronological) {
    const exp = Number(run.expectedPnlPct || 0);
    equity = equity * (1 + exp / 100);
    peak = Math.max(peak, equity);
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, dd);
    series.push(equity);
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const width = 520;
  const height = 130;
  const padX = 10;
  const padY = 10;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const path = series
    .map((value, index) => {
      const x = padX + (index / Math.max(1, series.length - 1)) * usableW;
      const y = padY + (1 - (value - min) / span) * usableH;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  paperEquityChart.innerHTML = `
    <svg class="trend-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" ry="8"></rect>
      <path class="trend-line pattern" d="${path}" />
    </svg>
    <div class="paper-chart-meta">
      <span><strong>Start:</strong> 100.00</span>
      <span><strong>End:</strong> ${formatNumber(series[series.length - 1], 2)}</span>
      <span><strong>Max Drawdown:</strong> ${formatPct(maxDrawdown, 2)}</span>
      <span><strong>Runs:</strong> ${series.length}</span>
    </div>
  `;
}

function syncEngineConfigUi(config) {
  if (!config) return;
  if (paperBudgetInput) paperBudgetInput.value = String(config.paperBudgetUsd ?? 100);
  if (paperMaxPositionInput) paperMaxPositionInput.value = String(config.tradeAmountUsd ?? 25);
  if (paperIntervalInput) paperIntervalInput.value = String(config.pollIntervalSec ?? 30);
  if (engineAmountInput) engineAmountInput.value = String(config.tradeAmountUsd ?? paperMaxPositionInput?.value ?? 25);
  if (engineMaxOpenInput) engineMaxOpenInput.value = String(CORE_ENGINE_PROFILE.maxOpenPositions);
  if (engineTpInput) engineTpInput.value = String(CORE_ENGINE_PROFILE.tpPct);
  if (engineSlInput) engineSlInput.value = String(CORE_ENGINE_PROFILE.slPct);
  if (engineTrailingInput) engineTrailingInput.value = String(CORE_ENGINE_PROFILE.trailingStopPct);
  if (engineHoldMinutesInput) engineHoldMinutesInput.value = String(CORE_ENGINE_PROFILE.maxHoldMinutes);
  if (engineCooldownInput) engineCooldownInput.value = String(CORE_ENGINE_PROFILE.cooldownSec);
  if (enginePollInput) enginePollInput.value = String(config.pollIntervalSec ?? paperIntervalInput?.value ?? 30);
  updateAgentTradeState({
    budgetUsd: Number(config.paperBudgetUsd || paperBudgetInput?.value || 100)
  });
}

function readEngineConfigFromUi() {
  const pollIntervalSec = Math.max(5, Math.min(3600, Number(paperIntervalInput?.value || enginePollInput?.value || 30)));
  const tradeAmountUsd = Math.max(1, Math.min(50000, Number(paperMaxPositionInput?.value || engineAmountInput?.value || 25)));
  return {
    enabled: true,
    mode: PAPER_ONLY_MODE ? "paper" : "live",
    paperBudgetUsd: Math.max(10, Math.min(1_000_000, Number(paperBudgetInput?.value || 100))),
    tradeAmountUsd,
    maxOpenPositions: CORE_ENGINE_PROFILE.maxOpenPositions,
    tpPct: CORE_ENGINE_PROFILE.tpPct,
    slPct: CORE_ENGINE_PROFILE.slPct,
    trailingStopPct: CORE_ENGINE_PROFILE.trailingStopPct,
    maxHoldMinutes: CORE_ENGINE_PROFILE.maxHoldMinutes,
    cooldownSec: CORE_ENGINE_PROFILE.cooldownSec,
    pollIntervalSec
  };
}

function normalizeEngineConfig(config) {
  const next = { ...config };
  const warnings = [];

  if (next.slPct >= next.tpPct) {
    next.slPct = Math.max(0.2, Number((next.tpPct * 0.7).toFixed(2)));
    warnings.push(`Stop-loss was adjusted to ${next.slPct}% so it remains below take-profit.`);
  }
  if (next.trailingStopPct >= next.tpPct) {
    next.trailingStopPct = Math.max(0.1, Number((next.tpPct * 0.6).toFixed(2)));
    warnings.push(
      `Trailing stop was adjusted to ${next.trailingStopPct}% so it remains below take-profit.`
    );
  }

  return { config: next, warnings };
}

function applyEnginePreset(name, { quiet = false } = {}) {
  const preset = engineExitPresets[name] || engineExitPresets.balanced;
  if (engineTpInput) engineTpInput.value = String(preset.tpPct);
  if (engineSlInput) engineSlInput.value = String(preset.slPct);
  if (engineTrailingInput) engineTrailingInput.value = String(preset.trailingStopPct);
  if (engineHoldMinutesInput) engineHoldMinutesInput.value = String(preset.maxHoldMinutes);
  if (engineCooldownInput) engineCooldownInput.value = String(preset.cooldownSec);
  if (enginePollInput) enginePollInput.value = String(preset.pollIntervalSec);
  if (!quiet) {
    pushMessage(
      `Applied ${name} preset: TP ${preset.tpPct}% / SL ${preset.slPct}% / Trail ${preset.trailingStopPct}% / Hold ${preset.maxHoldMinutes}m`,
      "info"
    );
  }
}

function syncAgentTempoButtons() {
  return;
}

function applyAgentTempoPreset(name, { quiet = false } = {}) {
  if (paperIntervalInput) {
    const requested = String(name || "").trim();
    const preset = agentTempoPresets[requested];
    if (preset) {
      paperIntervalInput.value = String(preset.paperIntervalSec);
    }
  }
  if (!quiet) {
    pushMessage("Autopilot cadence updated.", "ok");
  }
}

function syncQuickAmountButtonState() {
  document
    .querySelectorAll(".quick-amount-buttons[data-target-input]")
    .forEach((group) => {
      const targetId = String(group.getAttribute("data-target-input") || "");
      if (!targetId) return;
      const input = document.getElementById(targetId);
      if (!input) return;
      const current = Number(input.value || 0);
      group.querySelectorAll("button[data-amount]").forEach((button) => {
        const amount = Number(button.getAttribute("data-amount") || 0);
        if (Math.abs(current - amount) < 0.0001) {
          button.classList.add("active");
        } else {
          button.classList.remove("active");
        }
      });
    });
}

function bindTradeConsoleControls() {
  document.querySelectorAll("button[data-agent-price-window]").forEach((button) => {
    button.addEventListener("click", () => {
      agentPriceWindowSec = normalizeAgentPriceWindowSec(button.getAttribute("data-agent-price-window"));
      localStorage.setItem("enigma_agent_price_window_sec", String(agentPriceWindowSec));
      renderAgentPriceGraph();
    });
  });
  syncAgentPriceWindowButtons();
}

function applySavedTempoPreset() {
  if (paperIntervalInput && !Number(paperIntervalInput.value || 0)) {
    paperIntervalInput.value = "30";
  }
}

function applyOperatingPreset(name, { quiet = false } = {}) {
  applyPaperTestModel(CORE_AGENT_MODEL_KEY, { quiet: true, persist: true });
  if (!paperBudgetInput?.value) paperBudgetInput.value = "100";
  if (!paperMaxPositionInput?.value) paperMaxPositionInput.value = "25";
  if (!paperIntervalInput?.value) paperIntervalInput.value = "30";
  if (!quiet) {
    pushMessage("AIG Core model active. Budget, trade amount, and check cadence updated.", "ok");
  }
}

function applySavedOperatingPreset() {
  applyOperatingPreset(CORE_AGENT_MODEL_KEY, { quiet: true });
}

function renderEnginePositions(positions = []) {
  if (!engineOpenPositions) return;
  const rows = Array.isArray(positions) ? positions : [];
  latestEngineOpenPositions = rows.slice();
  if (!rows.length) {
    engineOpenPositions.innerHTML = `<div class="agent-live-position-empty">No live paper position. AIG is waiting for a valid mission entry.</div>`;
    updateAgentTradeState({
      position: null,
      missionStatus: agentTradeState.emergencyStopEnabled ? "halted" : (paperTradeTimer ? "monitoring" : "exited"),
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        ...getActiveAgentProvider().normalizePositionsResponse(rows)
      },
      executionTrace: {
        currentPnl: "-",
        submitted: agentTradeState.executionTrace?.submitted || "No live fill"
      }
    });
    renderTradeActivityVisualization();
    return;
  }

  const row = rows[0];
  const tokenMeta = getTokenMetaForMint(String(row.mint || ""), row.token || null);
  const targetSell = firstPrice([row.targetSellPriceUsd, Number(row.entryPriceUsd || 0) * (1 + Number(row.tpPct || 0) / 100)]);
  const stopLoss = firstPrice([row.stopLossPriceUsd, Number(row.entryPriceUsd || 0) * (1 - Number(row.slPct || 0) / 100)]);
  engineOpenPositions.innerHTML = `
    <article class="agent-live-position-card is-active">
      <div class="agent-live-position-head">
        <div class="paper-token-cell">
          ${avatarHtml(tokenMeta, "token-avatar small")}
          <div>
            <strong>${escapeHtml(tokenMeta.symbol || "N/A")}</strong>
            <span>${escapeHtml(shortMint(row.mint || "", 6, 6))}</span>
          </div>
        </div>
        <span class="pill caution">${escapeHtml(String(row.mode || "paper").toUpperCase())}</span>
      </div>
      <div class="agent-live-position-grid">
        <div><span>Entry</span><strong>${formatPrice(row.entryPriceUsd || 0)}</strong></div>
        <div><span>Current Price</span><strong>${formatPrice(row.lastPriceUsd || 0)}</strong></div>
        <div><span>Position Size</span><strong>${formatUsd(row.sizeUsd || 0)}</strong></div>
        <div><span>Value</span><strong>${formatUsd((Number(row.lastPriceUsd || 0) / Math.max(Number(row.entryPriceUsd || 1), 0.000000001)) * Number(row.sizeUsd || 0))}</strong></div>
        <div><span>Unrealized PnL</span><strong class="${Number(row.pnlPct || 0) >= 0 ? "flow-positive" : "flow-negative"}">${row.pnlPct === null || row.pnlPct === undefined ? "-" : formatPct(row.pnlPct || 0, 2)}</strong></div>
        <div><span>Status</span><strong>${Number(row.pnlPct || 0) >= 0 ? "In profit" : "Under pressure"}</strong></div>
        <div><span>Take Profit</span><strong>${targetSell ? formatPrice(targetSell) : "N/A"}</strong></div>
        <div><span>Stop Loss</span><strong>${stopLoss ? formatPrice(stopLoss) : "N/A"}</strong></div>
        <div><span>Time Open</span><strong>${formatDurationSince(row.opened_at)}</strong></div>
      </div>
    </article>
  `;
  const missionModel = getActiveAgentProvider().normalizePositionsResponse(rows);
  updateAgentTradeState({
    position: row,
    missionStatus: "monitoring",
    missionModel,
    executionTrace: {
      submitted: "Confirmed",
      txHash: "paper-fill",
      filledAmount: formatUsd(row.sizeUsd || 0),
      averageEntry: formatPrice(row.entryPriceUsd || 0),
      stopLoss: stopLoss ? formatPrice(stopLoss) : "N/A",
      takeProfit: targetSell ? formatPrice(targetSell) : "N/A",
      holdHorizon: `${formatNumber(CORE_ENGINE_PROFILE.maxHoldMinutes, 0)}m max hold`,
      currentPnl: row.pnlPct === null || row.pnlPct === undefined ? "-" : formatPct(row.pnlPct || 0, 2)
    }
  });
  renderTradeActivityVisualization();
}

function resetTradeActivity() {
  tradeActivityEvents = [];
  tradeActivitySystemNotes = [];
  agentTradeState.activity = [];
  agentTradeState.missionModel = {
    ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
    activity: []
  };
  renderAgentActivityFeed();
  renderTradeActivityVisualization();
}

function compactTradeLogNote(text) {
  const raw = String(text || "").trim();
  if (!raw) return "-";
  const lower = raw.toLowerCase();
  if (lower.includes("timeout fallback entry")) return "Fallback entry opened after timeout.";
  if (lower.includes("adaptive fallback armed")) return "Fallback mode armed.";
  if (lower.includes("entry watch active")) return "Entry watch active.";
  if (lower.includes("sl_hit")) return "Stop loss triggered.";
  if (lower.includes("tp_hit")) return "Take profit hit.";
  if (lower.includes("trailing_stop")) return "Trailing stop hit.";
  if (lower.includes("max_hold_time")) return "Max hold time exit.";
  const firstSegment = raw.split("|")[0] || raw;
  return firstSegment.length > 88 ? `${firstSegment.slice(0, 88)}...` : firstSegment;
}

function pushTradeActionEvents(actions = [], context = {}) {
  const baseTs = String(context.ts || new Date().toISOString());
  const contextMode = String(context.mode || "paper");
  const list = Array.isArray(actions) ? actions : [];
  for (const action of list) {
    const type = String(action?.type || "").toUpperCase();
    const mint = String(action?.mint || "").trim();
    const mode = String(action?.mode || contextMode || "paper");
    let note = String(action?.note || action?.reason || action?.status || "").trim();
    if (type === "OPEN") {
      const trigger = String(action?.trigger || "").trim();
      const strategy = String(action?.strategy || "").trim();
      const expected = Number(action?.expectedPnlPct || 0);
      const fillRatio = Number(action?.fillRatio || 0);
      const costUsd = Number(action?.executionCostsUsd || 0);
      if (trigger || strategy || Number.isFinite(expected) || Number.isFinite(fillRatio)) {
        note =
          `${trigger ? `${trigger} ` : ""}${strategy ? `[${strategy}] ` : ""}` +
          `expected ${formatNumber(expected, 2)}%, fill ${formatNumber(fillRatio * 100, 1)}%, costs ${formatUsd(costUsd)}`.trim();
      }
      tradeActivityEvents.push({
        ts: baseTs,
        mode,
        action: "BUY",
        mint,
        priceUsd: Number(action?.entryPriceUsd || 0),
        sizeUsd: Number(action?.sizeUsd || 0),
        pnlPct: null,
        note
      });
      recordAgentActivity("Paper execution confirmed. AIG opened a managed position.", "ok", {
        title: "Position Opened",
        ts: baseTs,
        meta: mint ? `${shortMint(mint, 6, 6)} | ${formatUsd(Number(action?.sizeUsd || 0))}` : ""
      });
      continue;
    }
    if (type === "CLOSE") {
      const expected = Number(action?.expectedPnlPct || 0);
      const realized = Number(action?.realizedAfterCostsPct || action?.pnlPct || 0);
      const attribution = action?.attribution || {};
      const slipFeeLatency = Number(attribution?.slippageFeeLatencyUsd || 0);
      note =
        `${String(action?.reason || "close")} | expected ${formatNumber(expected, 2)}% vs realized ${formatNumber(
          realized,
          2
        )}% | execution drag ${formatUsd(slipFeeLatency)}`;
      tradeActivityEvents.push({
        ts: baseTs,
        mode,
        action: "SELL",
        mint,
        priceUsd: Number(action?.exitFillPriceUsd || action?.markPriceUsd || action?.lastPriceUsd || 0),
        sizeUsd: Number(action?.sizeUsd || 0),
        pnlPct:
          action?.realizedAfterCostsPct === null || action?.realizedAfterCostsPct === undefined
            ? action?.pnlPct === null || action?.pnlPct === undefined
              ? null
              : Number(action?.pnlPct || 0)
            : Number(action?.realizedAfterCostsPct || 0),
        note
      });
      recordAgentActivity("Position closed and archived in the execution trace.", Number(realized) >= 0 ? "ok" : "error", {
        title: "Position Closed",
        ts: baseTs,
        meta: mint ? `${shortMint(mint, 6, 6)} | ${formatPct(realized, 2)}` : ""
      });
      continue;
    }
    if (type === "INFO" || type === "ERROR") {
      tradeActivitySystemNotes.unshift({
        ts: baseTs,
        mode,
        level: type,
        mint,
        note: note || String(action?.note || action?.reason || "engine update")
      });
      recordAgentActivity(note || String(action?.note || action?.reason || "engine update"), type === "ERROR" ? "error" : "info", {
        title: type === "ERROR" ? "Engine Alert" : "Engine Update",
        ts: baseTs,
        meta: mint ? shortMint(mint, 6, 6) : ""
      });
      continue;
    }
    if (type === "LIVE_BUY" || type === "LIVE_SELL") continue;
  }

  tradeActivityEvents = tradeActivityEvents.slice(-240);
  tradeActivitySystemNotes = tradeActivitySystemNotes.slice(0, 60);
  renderTradeActivityVisualization();
}

function renderTradeActivityVisualization() {
  const snapshot = getPaperTradeSnapshot();
  const openCount = (latestEngineOpenPositions || []).filter(
    (position) => String(position?.mode || "paper") === "paper"
  ).length;

  if (tradeActivityChart) {
    if (!tradeActivityEvents.length) {
      const latestSystemNote = tradeActivitySystemNotes[0] || null;
      tradeActivityChart.innerHTML =
        `<div class="trade-empty-state">
          <strong>No paper trade executed yet.</strong>
          <span>AIG Core is scanning for a valid entry. This panel only updates after an actual BUY or SELL fill.</span>
          ${latestSystemNote ? `<span><strong>Current block reason:</strong> ${escapeHtml(compactTradeLogNote(String(latestSystemNote.note || "")))}</span>` : ""}
        </div>`;
    } else {
      const events = tradeActivityEvents.slice(-80);
      const points = [{ index: 0, equity: 100 }];
      const markers = [];
      let equity = 100;

      events.forEach((event, idx) => {
        if (event.action === "SELL" && Number.isFinite(Number(event.pnlPct))) {
          equity = Number((equity * (1 + Number(event.pnlPct || 0) / 100)).toFixed(6));
        }
        points.push({ index: idx + 1, equity });
        if (event.action === "BUY" || event.action === "SELL") {
          markers.push({ ...event, index: idx + 1, equity });
        }
      });

      const width = 560;
      const height = 150;
      const padX = 12;
      const padY = 12;
      const maxIndex = Math.max(1, points.length - 1);
      const values = points.map((point) => point.equity);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const spread = Math.max(0.2, maxValue - minValue);
      const yMin = minValue - spread * 0.1;
      const yMax = maxValue + spread * 0.1;
      const toX = (index) => padX + (index / maxIndex) * (width - padX * 2);
      const toY = (value) =>
        padY + (1 - (value - yMin) / Math.max(0.0001, yMax - yMin)) * (height - padY * 2);
      const path = points
        .map((point, idx) => `${idx === 0 ? "M" : "L"}${toX(point.index).toFixed(2)},${toY(point.equity).toFixed(2)}`)
        .join(" ");

      const buyCount = markers.filter((item) => item.action === "BUY").length;
      const sellCount = markers.filter((item) => item.action === "SELL").length;
      const endEquity = points[points.length - 1].equity;
      const returnPct = ((endEquity - 100) / 100) * 100;
      const realizedText = formatSignedUsd(snapshot.realizedPnlUsd);
      const unrealizedText = formatSignedUsd(snapshot.unrealizedPnlUsd);
      const netText = formatSignedUsd(snapshot.netPnlUsd);
      const winCount = formatNumber(snapshot.winSells, 0);
      const lossCount = formatNumber(snapshot.lossSells, 0);

      tradeActivityChart.innerHTML = `
        <svg class="trend-svg trade-activity-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <rect x="0" y="0" width="${width}" height="${height}" rx="8" ry="8"></rect>
          <path class="trend-line pattern" d="${path}" />
          ${markers
            .map((item) => {
              const x = toX(item.index).toFixed(2);
              const y = toY(item.equity).toFixed(2);
              const className = item.action === "BUY" ? "buy" : "sell";
              const label = item.action === "BUY" ? "B" : "S";
              return `<circle class="trade-marker ${className}" cx="${x}" cy="${y}" r="4"></circle><text class="trade-marker-label ${className}" x="${x}" y="${Number(y) - 8}">${label}</text>`;
            })
            .join("")}
        </svg>
        <div class="trade-activity-meta">
          <span><strong>Buys:</strong> ${buyCount}</span>
          <span><strong>Sells:</strong> ${sellCount}</span>
          <span><strong>Wins:</strong> ${winCount}</span>
          <span><strong>Losses:</strong> ${lossCount}</span>
          <span><strong>Closed Win Rate:</strong> ${formatPct(snapshot.closedWinRatePct, 2)}</span>
          <span><strong>Realized PnL:</strong> ${realizedText}</span>
          <span><strong>Unrealized PnL:</strong> ${unrealizedText}</span>
          <span><strong>Net PnL:</strong> ${netText}</span>
          <span><strong>Open Positions:</strong> ${formatNumber(openCount, 0)}</span>
          <span><strong>Open Exposure:</strong> ${formatUsd(snapshot.openExposureUsd)}</span>
          <span><strong>Cumulative Turnover:</strong> ${formatUsd(snapshot.cumulativeExposureUsd)}</span>
          <span><strong>Equity Index:</strong> ${formatNumber(endEquity, 2)} (${formatPct(returnPct, 2)})</span>
        </div>
      `;
    }
  }

  if (tradeActivityLog) {
    if (!tradeActivityEvents.length) {
      if (!tradeActivitySystemNotes.length) {
        tradeActivityLog.innerHTML = `<div class="msg">No executed BUY/SELL fills yet. Candidate forecasts do not appear here. This table starts once AIG Core opens a paper position.</div>`;
      } else {
        const rows = tradeActivitySystemNotes.slice(0, 8);
        tradeActivityLog.innerHTML = `
          <div class="msg trade-log-status">No executed fills yet. Latest engine updates are shown below until the first BUY opens.</div>
          <table class="paper-results-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Token</th>
                <th>Why No Trade Yet</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map((row) => {
                  const tokenMeta = getTokenMetaForMint(String(row.mint || ""), null);
                  const tokenCell = row.mint
                    ? `${escapeHtml(tokenMeta.symbol || "TOKEN")} <code>${escapeHtml(shortMint(String(row.mint || ""), 6, 6))}</code>`
                    : "-";
                  return `
                    <tr>
                      <td>${escapeHtml(formatDateTime(row.ts))}</td>
                      <td><span class="trade-action-pill ${String(row.level || "").toLowerCase() === "error" ? "error" : "info"}">${escapeHtml(String(row.level || "INFO"))}</span></td>
                      <td>${tokenCell}</td>
                      <td>${escapeHtml(String(row.note || "-"))}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        `;
      }
      return;
    }

    const chronologicalRows = tradeActivityEvents
      .filter((row) => String(row.action || "").toUpperCase() === "BUY" || String(row.action || "").toUpperCase() === "SELL")
      .slice(-80);

    if (!chronologicalRows.length) {
      tradeActivityLog.innerHTML = `<div class="msg">No completed trade actions yet.</div>`;
      return;
    }

    let cumulativeRealizedUsd = 0;
    const enrichedRows = chronologicalRows.map((row) => {
      const isSell = String(row.action || "").toUpperCase() === "SELL";
      const sizeUsd = Number(row.sizeUsd || 0);
      const pnlPct = Number(row.pnlPct);
      const pnlUsd =
        isSell && Number.isFinite(pnlPct) && Number.isFinite(sizeUsd)
          ? Number((sizeUsd * (pnlPct / 100)).toFixed(6))
          : null;
      if (pnlUsd !== null) {
        cumulativeRealizedUsd += pnlUsd;
      }
      return {
        ...row,
        pnlUsd,
        cumulativeRealizedUsd: Number(cumulativeRealizedUsd.toFixed(6))
      };
    });

    const rows = enrichedRows.slice(-15).reverse();

    tradeActivityLog.innerHTML = `
      <table class="paper-results-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Side</th>
            <th>Token</th>
            <th>Price</th>
            <th>Size</th>
            <th>PnL %</th>
            <th>PnL USD</th>
            <th>Cumulative PnL</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => {
                const tokenMeta = getTokenMetaForMint(String(row.mint || ""), null);
                const tokenCell = row.mint
                  ? `${escapeHtml(tokenMeta.symbol || "TOKEN")} <code>${escapeHtml(shortMint(String(row.mint || ""), 6, 6))}</code>`
                  : "-";
                return `
                <tr>
                  <td>${escapeHtml(formatDateTime(row.ts))}</td>
                  <td><span class="trade-action-pill ${escapeHtml(String(row.action || "").toLowerCase())}">${escapeHtml(String(row.action || "N/A"))}</span></td>
                  <td>${tokenCell}</td>
                  <td>${row.priceUsd ? formatPrice(row.priceUsd) : "-"}</td>
                  <td>${row.sizeUsd ? formatUsd(row.sizeUsd) : "-"}</td>
                  <td>${row.pnlPct === null || row.pnlPct === undefined ? "-" : formatPct(row.pnlPct, 2)}</td>
                  <td>${row.pnlUsd === null ? "-" : formatSignedUsd(row.pnlUsd)}</td>
                  <td>${formatSignedUsd(row.cumulativeRealizedUsd || 0)}</td>
                  <td>${escapeHtml(compactTradeLogNote(String(row.note || "-")))}</td>
                </tr>
              `;
              }
            )
            .join("")}
        </tbody>
      </table>
    `;
  }
}

function renderAgentScannerSummary(decisions = [], context = {}) {
  if (!agentScannerSummary) return;
  const list = Array.isArray(decisions) ? decisions : [];
  const preferredMint = String(agentTargetMints[0] || agentTargetMint || "");
  const primary =
    list.find((item) => String(item?.mint || "") === preferredMint) || list[0] || null;
  if (!primary) {
    agentScannerSummary.innerHTML =
      `<div class="msg">No scanner report yet. Run Test to generate the latest AIG Core paper-trading analysis for your saved token.</div>`;
    updateAgentTradeState({
      preview: null,
      decision: null,
      missionModel: createEmptyMissionModel(getActiveAgentProvider().id)
    });
    return;
  }

  const tradePlan = primary.tradePlan || {};
  const market = primary.market || {};
  const regime = primary.marketRegime || {};
  const reasons = Array.isArray(primary.reasons) ? primary.reasons : [];
  const status = String(primary.signalStatus || "N/A");
  const tone = status === "FAVORABLE" ? "good" : status === "CAUTION" ? "warn" : "bad";
  const ts = String(context.ts || new Date().toISOString());
  const marketPrice = Number(market.priceUsd || 0);
  if (Number.isFinite(marketPrice) && marketPrice > 0) {
    appendAgentPricePoint(marketPrice, Date.parse(ts) || Date.now());
    renderAgentPriceGraph();
  }

  const missionModel = getActiveAgentProvider().normalizePaperCycle({
    runResponse: { decisions: [primary], ts },
    engineResponse: { positions: { open: latestEngineOpenPositions }, actions: [], ts },
    mint: preferredMint || primary.mint
  });
  updateAgentTradeState({
    preview: primary,
    decision: primary,
    missionStatus: missionModel.missionStatus,
    missionModel,
    error: null,
    executionTrace: {
      previewState: missionModel.executionTrace.previewState || "Plan ready",
      submitted: missionModel.executionTrace.submitted || "Awaiting Let AI Trade",
      txHash: missionModel.executionTrace.txHash || "-",
      filledAmount:
        missionModel.executionTrace.filledAmount === null || missionModel.executionTrace.filledAmount === undefined
          ? formatUsd(primary?.maxPositionUsd || paperMaxPositionInput?.value || 0)
          : formatUsd(missionModel.executionTrace.filledAmount),
      averageEntry:
        missionModel.executionTrace.averageEntry
          ? formatPrice(missionModel.executionTrace.averageEntry)
          : `${formatPrice(tradePlan.buyZone?.low)} - ${formatPrice(tradePlan.buyZone?.high)}`,
      stopLoss: missionModel.executionTrace.stopLoss ? formatPrice(missionModel.executionTrace.stopLoss) : formatPrice(tradePlan.stopLoss),
      takeProfit: missionModel.executionTrace.takeProfit ? formatPrice(missionModel.executionTrace.takeProfit) : formatPrice((tradePlan.resistance || [])[0]),
      holdHorizon: missionModel.executionTrace.holdHorizon || missionModel.thesis?.holdHorizon || "Adaptive",
      currentPnl:
        missionModel.executionTrace.currentPnlPct === null || missionModel.executionTrace.currentPnlPct === undefined
          ? "-"
          : formatPct(missionModel.executionTrace.currentPnlPct, 2)
    }
  });

  agentScannerSummary.innerHTML = `
    <div class="agent-scan-summary">
      <div class="row between">
        <strong>${escapeHtml(shortMint(primary.mint || "", 8, 8))}</strong>
        <span class="pill ${escapeHtml(status.toLowerCase())}">${escapeHtml(status)}</span>
      </div>
      <div class="risk-strip ${escapeHtml(tone)}">
        Pattern ${formatNumber(primary.patternScore || 0, 2)}/100 | Confidence ${formatNumber(primary.confidence || 0, 2)}
      </div>
      <div class="mini-grid">
        <div><span>Price</span><strong>${formatPrice(market.priceUsd || 0)}</strong></div>
        <div><span>Entry Zone</span><strong>${formatPrice(tradePlan.buyZone?.low)} - ${formatPrice(tradePlan.buyZone?.high)}</strong></div>
        <div><span>Target Sell</span><strong>${formatPrice((tradePlan.resistance || [])[0])}</strong></div>
        <div><span>Stop Loss</span><strong>${formatPrice(tradePlan.stopLoss)}</strong></div>
      </div>
      <p class="small muted">
        Regime: ${escapeHtml(String(regime.regime || "N/A"))} (${escapeHtml(String(regime.timeframe || "1h"))}) | ADX ${escapeHtml(
          regime.adx === null || regime.adx === undefined ? "N/A" : formatNumber(regime.adx, 2)
        )} | Vol ${escapeHtml(
          regime.volatilityIndex === null || regime.volatilityIndex === undefined
            ? "N/A"
            : formatNumber(regime.volatilityIndex, 2)
        )}
      </p>
      <p class="small muted">Why this setup: ${escapeHtml(reasons[0] || "No reason provided")}</p>
      <p class="small muted">Updated: ${escapeHtml(formatDateTime(ts))}</p>
      <p class="small muted">Monitoring set: ${escapeHtml(agentTargetMints.map((mint) => shortMint(mint, 4, 4)).join(", ") || "N/A")}</p>
    </div>
  `;
}

async function loadPaperPerformance() {
  if (!authToken) return;
  const response = await api("/api/autotrade/performance?limit=30", null, true, "GET");
  renderPaperPerformance(response.performance || {});
}

async function resetPaperPerformance(options = {}) {
  if (!authToken) return null;
  const response = await api(
    "/api/autotrade/performance/reset",
    { scope: "paper" },
    true,
    "POST"
  );
  paperRunHistory = [];
  renderPaperResults(null);
  renderPaperPerformance(response.performance || {});
  if (!options.silent) {
    pushMessage("Paper history reset. New test session started.", "ok");
  }
  return response;
}

async function loadEngineConfig() {
  if (!authToken) return;
  const response = await api("/api/autotrade/execution-config", null, true, "GET");
  syncEngineConfigUi(response.config || {});
}

async function saveEngineConfig(options = {}) {
  if (!authToken) {
    const error = buildWalletRequiredError("save engine settings");
    notifyActionError(error, "save engine settings");
    throw error;
  }
  try {
    const normalized = normalizeEngineConfig(readEngineConfigFromUi());
    const payload = {
      ...normalized.config,
      mode: PAPER_ONLY_MODE ? "paper" : normalized.config.mode
    };
    const response = await api(
      "/api/autotrade/execution-config",
      payload,
      true,
      "PUT"
    );
    syncEngineConfigUi(response.config || {});
    normalized.warnings.forEach((warning) => pushMessage(warning, "info"));
    if (!options.silent) {
      pushMessage("Engine config saved", "ok");
    }
    return response.config || null;
  } catch (error) {
    notifyActionError(error, "save engine settings");
    throw error;
  }
}

async function loadEnginePositions() {
  if (!authToken) return;
  const response = await api("/api/autotrade/positions?status=OPEN", null, true, "GET");
  renderEnginePositions(response.positions || []);
  try {
    const missionState = await getActiveAgentProvider().getMissionState({
      workspaceId: resolveAgentTargetMint({ notify: false }) || ""
    });
    if (missionState?.mission) {
      updateAgentTradeState({
        missionModel: {
          ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
          ...missionState.mission
        }
      });
    }
  } catch {}
}

function setRealtimeMonitorStatus(text, tone = "") {
  if (!liveMonitorStatus) return;
  liveMonitorStatus.className = `msg ${tone}`.trim();
  liveMonitorStatus.textContent = text;
}

async function runRealtimeMonitorTick() {
  if (!authToken || realtimeMonitorInFlight) return;
  realtimeMonitorInFlight = true;
  try {
    updateAgentTradeState({ missionStatus: "monitoring" });
    const response = await api(
      "/api/autotrade/monitor",
      {
        eventDriven: true,
        sweeps: realtimeMonitorMode === "live" ? 3 : 2,
        intervalMs: realtimeMonitorMode === "live" ? 180 : 250
      },
      true,
      "POST"
    );
    renderEnginePositions(response.positions || []);
    pushTradeActionEvents(response.actions || [], {
      ts: response.ts || new Date().toISOString(),
      mode: response.mode || "paper"
    });
    let monitorMission = getActiveAgentProvider().normalizeMonitorResponse(response);
    try {
      const monitorState = await getActiveAgentProvider().getActivity({
        workspaceId: resolveAgentTargetMint({ notify: false }) || ""
      });
      monitorMission = monitorState?.mission || monitorMission;
    } catch {}
    updateAgentTradeState({
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        ...monitorMission
      }
    });
    const ts = new Date(response.ts || Date.now()).toLocaleTimeString();
    setRealtimeMonitorStatus(
      `Realtime monitor ${ts}: open ${formatNumber(response.openCount || 0, 0)}, sweeps ${formatNumber(
        response.sweeps || 1,
        0
      )}, updated ${formatNumber(
        response.updatedCount || 0,
        0
      )}, actions ${formatNumber((response.actions || []).length || 0, 0)}.`,
      "ok"
    );
  } catch (error) {
    updateAgentTradeState({
      missionStatus: "halted",
      error: friendlyErrorMessage(error, "refresh monitor")
    });
    setRealtimeMonitorStatus(friendlyErrorMessage(error, "refresh monitor"), "error");
  } finally {
    realtimeMonitorInFlight = false;
  }
}

function startRealtimeMonitor(mode = "paper") {
  if (realtimeMonitorTimer) {
    clearInterval(realtimeMonitorTimer);
    realtimeMonitorTimer = null;
  }
  realtimeMonitorMode = mode === "live" ? "live" : "paper";
  const cadenceSec = realtimeMonitorMode === "live" ? 1 : 2;
  setRealtimeMonitorStatus(`Realtime monitor active (${cadenceSec}s cadence).`, "ok");
  void runRealtimeMonitorTick();
  realtimeMonitorTimer = setInterval(() => {
    void runRealtimeMonitorTick();
  }, cadenceSec * 1000);
}

function stopRealtimeMonitor() {
  if (realtimeMonitorTimer) {
    clearInterval(realtimeMonitorTimer);
    realtimeMonitorTimer = null;
  }
  setRealtimeMonitorStatus("Realtime monitor idle.");
}

function stopEngineLoop() {
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
  stopRealtimeMonitor();
  if (engineSummary) engineSummary.textContent = "Engine idle.";
}

async function previewAgentMission() {
  if (!ensureWalletConnected("preview AIG mission")) return;
  const mint = resolveAgentTargetMint({ notify: true });
  if (!mint) return;
  setButtonBusy(agentPreviewPlanButton, true, "Previewing...");
  updateAgentTradeState({
    missionStatus: "planning",
    isPreviewLoading: true,
    error: null
  });
  blockFullscreenUi("Building AI mission preview...");
  try {
    const { raw, mission } = await getActiveAgentProvider().previewMission({
      workspaceId: mint,
      mint,
      budgetUsd: Number(paperBudgetInput?.value || agentTradeState.budgetUsd || 100)
    });
    cacheTokenMeta(raw?.signal?.token || null, mint);
    const previewDecision = raw?.signal
      ? {
          ...raw.signal,
          mint,
          signalStatus: String(raw.signal.status || "CAUTION"),
          decision: String(raw.signal.status || "").toUpperCase() === "FAVORABLE" ? "BUY_CANDIDATE" : "SKIP",
          confidence: Number(raw.signal.confidence ?? raw.signal.killSwitch?.confidence ?? 0),
          patternScore: Number(raw.signal.patternScore || 0),
          token: raw.signal.token || null
        }
      : null;
    if (previewDecision) {
      renderAgentScannerSummary([previewDecision], { ts: new Date().toISOString() });
    }
    updateAgentTradeState({
      preview: raw?.signal || null,
      decision: previewDecision,
      missionStatus: mission.missionStatus,
      missionModel: mission,
      isPreviewLoading: false,
      executionTrace: {
        previewState: mission.executionTrace.previewState || "Preview ready",
        submitted: "Awaiting Let AI Trade",
        txHash: "-",
        filledAmount: formatUsd(Number(paperMaxPositionInput?.value || 0)),
        averageEntry: mission.thesis.entryLow || mission.thesis.entryHigh ? `${formatPrice(mission.thesis.entryLow)} - ${formatPrice(mission.thesis.entryHigh)}` : "-",
        stopLoss: mission.thesis.stopLoss ? formatPrice(mission.thesis.stopLoss) : "-",
        takeProfit: mission.thesis.takeProfit ? formatPrice(mission.thesis.takeProfit) : "-",
        holdHorizon: mission.thesis.holdHorizon || "Adaptive",
        currentPnl: "-"
      }
    });
    await loadAgentMissionSessions(mint);
    await loadAgentMissionDiagnostics(mint);
  } catch (error) {
    updateAgentTradeState({
      missionStatus: "halted",
      isPreviewLoading: false,
      error: friendlyErrorMessage(error, "preview AIG mission")
    });
    notifyActionError(error, "preview AIG mission");
  } finally {
    unblockFullscreenUi();
    setButtonBusy(agentPreviewPlanButton, false);
  }
}

async function closeAgentPosition() {
  if (!ensureWalletConnected("close active position")) return;
  const currentPosition = latestEngineOpenPositions[0];
  if (!currentPosition) {
    pushMessage("No active paper position to close.", "info");
    return;
  }
  setButtonBusy(agentClosePositionButton, true, "Closing...");
  blockFullscreenUi("Closing active paper position...");
  try {
    const { mission } = await getActiveAgentProvider().closePosition({
      workspaceId: currentPosition.mint,
      positionId: currentPosition.id,
      mint: currentPosition.mint
    });
    stopRealtimeMonitor();
    await loadEnginePositions();
    await loadPaperPerformance();
    updateAgentTradeState({
      missionStatus: "exited",
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        ...mission
      },
      position: null,
      executionTrace: {
        submitted: "Closed by operator",
        txHash: "manual-close",
        currentPnl: "-"
      }
    });
    await loadAgentMissionSessions(currentPosition.mint);
    await loadAgentMissionDiagnostics(currentPosition.mint);
  } catch (error) {
    updateAgentTradeState({
      missionStatus: "halted",
      error: friendlyErrorMessage(error, "close active position")
    });
    notifyActionError(error, "close active position");
  } finally {
    unblockFullscreenUi();
    setButtonBusy(agentClosePositionButton, false);
  }
}

async function haltAgentMission() {
  if (!ensureWalletConnected("halt mission")) return;
  setButtonBusy(agentEmergencyHaltButton, true, "Halting...");
  blockFullscreenUi("Engaging emergency halt...");
  try {
    stopPaperLoop();
    stopEngineLoop();
    const workspaceId = resolveAgentTargetMint({ notify: false }) || "";
    const { mission } = await getActiveAgentProvider().haltMission({
      workspaceId
    });
    updateAgentTradeState({
      missionStatus: "halted",
      emergencyStopEnabled: true,
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        ...mission
      },
      executionTrace: {
        submitted: "Halt engaged"
      }
    });
    if (workspaceId) {
      await loadAgentMissionSessions(workspaceId);
      await loadAgentMissionDiagnostics(workspaceId);
    }
    pushMessage("Emergency halt engaged. Agent execution is disabled until re-armed.", "error");
  } catch (error) {
    updateAgentTradeState({
      missionStatus: "halted",
      emergencyStopEnabled: true,
      error: friendlyErrorMessage(error, "halt mission")
    });
    notifyActionError(error, "halt mission");
  } finally {
    unblockFullscreenUi();
    setButtonBusy(agentEmergencyHaltButton, false);
  }
}

async function runEngineTickOnce(options = {}) {
  if (!authToken) {
    const error = buildWalletRequiredError("run engine tick");
    notifyActionError(error, "run engine tick");
    throw error;
  }
  if (engineTickInFlight) return;
  const agentMints = Array.from(
    new Set(
      (Array.isArray(options.agentMints) ? options.agentMints : [])
        .map((mint) => String(mint || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 1);
  if (!agentMints.length) {
    throw new Error("missing agent token mint(s)");
  }
  engineTickInFlight = true;
  try {
    await saveEngineConfig({ silent: true });
    const aggregate = {
      ts: new Date().toISOString(),
      mode: "paper",
      warnings: [],
      decisions: [],
      actions: [],
      positions: { openCount: 0, open: [] },
      safety: {}
    };
    for (const mint of agentMints) {
      const response = await api("/api/autotrade/engine/tick", { mint }, true, "POST");
      aggregate.ts = String(response.ts || aggregate.ts);
      aggregate.mode = String(response.mode || aggregate.mode);
      aggregate.warnings.push(...(Array.isArray(response.warnings) ? response.warnings : []));
      aggregate.decisions.push(...(Array.isArray(response.decisions) ? response.decisions : []));
      aggregate.actions.push(...(Array.isArray(response.actions) ? response.actions : []));
      if (response.positions) {
        aggregate.positions = {
          openCount: Number(response.positions.openCount || 0),
          open: Array.isArray(response.positions.open) ? response.positions.open : []
        };
      }
      if (response.safety) {
        aggregate.safety = response.safety;
      }
    }
    const response = aggregate;
    const tickDecisions = Array.isArray(response.decisions) ? response.decisions : [];
    tickDecisions.forEach((item) => {
      cacheTokenMeta(item.token, String(item.mint || ""));
    });
    pushTradeActionEvents(response.actions || [], {
      ts: response.ts || new Date().toISOString(),
      mode: response.mode || "paper"
    });
    renderAgentScannerSummary(tickDecisions, { ts: response.ts });
    evaluateSignalAlerts(buildAlertItemsFromDecisions(tickDecisions));
    const opened = (response.actions || []).filter((action) => action.type === "OPEN").length;
    const closed = (response.actions || []).filter((action) => action.type === "CLOSE").length;
    const warnings = Array.isArray(response.warnings) ? response.warnings : [];
    const skipped = tickDecisions.filter((item) => String(item?.decision || "") === "SKIP");
    const primarySkipReason = skipped.length
      ? String((skipped[0]?.reasons || [])[0] || "no candidate passed current policy gates")
      : "";
    const safety = response.safety || {};
    const isPaperMode = String(response.mode || "paper") !== "live";
    const exposureCap = isPaperMode
      ? formatUsd(safety.paperBudgetUsd || 0)
      : formatUsd(safety.maxTotalExposureUsd || 0);
    const capLabel = isPaperMode ? "Paper budget" : "Exposure";
    const availableLabel = isPaperMode
      ? ` | Available ${formatUsd(safety.paperAvailableUsd || 0)}`
      : "";
    const safetyLine = `${capLabel} ${formatUsd(safety.openExposureUsd || 0)}/${exposureCap}${availableLabel} | Daily loss ${formatUsd(
      safety.dailyRealizedLossUsd || 0
    )}/${formatUsd(safety.maxDailyLossUsd || 0)}`;
    if (engineSummary) {
      engineSummary.innerHTML = `
        Engine update ${escapeHtml(new Date(response.ts || Date.now()).toLocaleTimeString())}:
        opened ${opened}, closed ${closed}, open now ${formatNumber(response.positions?.openCount || 0, 0)}, tokens ${formatNumber(agentMints.length, 0)}.
        <br />${escapeHtml(safetyLine)}
        ${opened === 0 && primarySkipReason ? `<br /><span class="error-text">Blocked: ${escapeHtml(primarySkipReason)}</span>` : ""}
        ${warnings.length ? `<br /><span class="error-text">${escapeHtml(warnings.join(" | "))}</span>` : ""}
      `;
    }
    renderEnginePositions(response.positions?.open || []);
    try {
      await loadPaperPerformance();
    } catch (error) {
      pushMessage(`History refresh skipped: ${error.message}`, "info");
    }
  } catch (error) {
    const message = String(error.message || "");
    if (message.includes("already in progress")) {
      if (engineSummary) engineSummary.textContent = "Engine tick in progress, waiting for next cycle...";
      return;
    }
    if (engineSummary) engineSummary.textContent = `Engine error: ${friendlyErrorMessage(error, "run engine tick")}`;
    notifyActionError(error, "run engine tick");
  } finally {
    engineTickInFlight = false;
  }
}

async function startEngineLoop() {
  if (!ensureWalletConnected("start live agent")) return;
  if (LIVE_MODE_PREVIEW_DISABLED) {
    pushMessage("Paper-only mode is enabled. Use Run Test for validation.", "info");
    return;
  }
  setButtonBusy(engineStartLoopButton, true, "Starting...");
  try {
    const agentMints = resolveAgentTargetMints({ notify: true });
    if (!agentMints.length) {
      throw new Error("At least one Agent Token is required");
    }
    stopEngineLoop();
    resetTradeActivity();
    const livePolicy = {
      ...readPaperConfigFromUi(),
      enabled: true,
      mode: "live"
    };
    await api("/api/autotrade/config", livePolicy, true, "PUT");
    await saveEngineConfig({ silent: true });
    const intervalSec = Math.max(2, Number(enginePollInput?.value || 15));
    await runEngineTickOnce({ agentMints });
    engineTimer = setInterval(async () => {
      await runEngineTickOnce({ agentMints });
    }, intervalSec * 1000);
    startRealtimeMonitor("live");
    startAgentPriceMonitor();
    pushMessage(`Live agent running every ${intervalSec}s on ${agentMints.length} token(s)`, "ok");
  } catch (error) {
    notifyActionError(error, "start live agent");
  } finally {
    setButtonBusy(engineStartLoopButton, false);
  }
}

async function loadPaperConfig() {
  if (!authToken) return;
  const response = await api("/api/autotrade/config", null, true, "GET");
  syncPaperConfigUi(response.config || {});
}

async function savePaperConfig(options = {}) {
  if (!authToken) {
    const error = buildWalletRequiredError("save paper test rules");
    notifyActionError(error, "save paper test rules");
    throw error;
  }
  try {
    const payload = readPaperConfigFromUi();
    if (options.forceEnabled) {
      payload.enabled = true;
    }
    const response = await api("/api/autotrade/config", payload, true, "PUT");
    const currentEngine = await api("/api/autotrade/execution-config", null, true, "GET");
    await api(
      "/api/autotrade/execution-config",
      {
        ...(currentEngine.config || {}),
        enabled: options.forceEnabled ? true : Boolean(currentEngine.config?.enabled),
        paperBudgetUsd: Math.max(
          10,
          Math.min(1_000_000, Number(paperBudgetInput?.value || currentEngine.config?.paperBudgetUsd || 100))
        ),
        tradeAmountUsd: Number(payload.maxPositionUsd || 0),
        mode: "paper",
        pollIntervalSec: Number(payload.scanIntervalSec || currentEngine.config?.pollIntervalSec || 15)
      },
      true,
      "PUT"
    );
    syncPaperConfigUi(response.config || {});
    await loadEngineConfig();
    if (!options.silent) {
      pushMessage("Paper test rules saved", "ok");
    }
    return response.config || null;
  } catch (error) {
    notifyActionError(error, "save paper test rules");
    throw error;
  }
}

async function runPaperTradeOnce(options = {}) {
  if (paperRunInFlight) {
    return true;
  }
  const agentMints = Array.from(
    new Set(
      (Array.isArray(options.agentMints) ? options.agentMints : [])
        .map((mint) => String(mint || "").trim())
        .filter(Boolean)
    )
  ).slice(0, 1);
  if (!agentMints.length) {
    throw new Error("missing agent token mint(s)");
  }
  const initial = Boolean(options.initial);
  paperRunInFlight = true;
  updateAgentTradeState({
    missionStatus: initial ? "evaluating" : "executing",
    isExecuteLoading: true,
    error: null
  });
  setPaperStatus("Running", "busy");
  try {
    if (getActiveAgentProvider().id === "openclaw") {
      const mint = agentMints[0];
      const budgetUsd = Number(paperBudgetInput?.value || agentTradeState.budgetUsd || 100);
      const execution = await getActiveAgentProvider().executeMission({
        workspaceId: mint,
        mint,
        budgetUsd
      });
      const signal = execution?.raw?.signal || null;
      if (signal?.token) {
        cacheTokenMeta(signal.token, mint);
      }
      const executionRaw = execution?.raw?.execution || {};
      const engineResponse = executionRaw?.raw?.engineResponse || executionRaw?.engineResponse || null;
      if (signal) {
        const decisionLike = {
          ...signal,
          mint,
          signalStatus: String(signal.status || "CAUTION"),
          decision: String(signal.status || "").toUpperCase() === "FAVORABLE" ? "BUY_CANDIDATE" : "SKIP",
          confidence: Number(signal.confidence ?? signal.killSwitch?.confidence ?? 0),
          patternScore: Number(signal.patternScore || 0),
          token: signal.token || null
        };
        renderAgentScannerSummary([decisionLike], { ts: new Date().toISOString() });
      }
      if (engineResponse?.actions) {
        pushTradeActionEvents(engineResponse.actions || [], {
          ts: engineResponse.ts || new Date().toISOString(),
          mode: engineResponse.mode || "paper"
        });
      }
      if (engineResponse?.positions?.open) {
        renderEnginePositions(engineResponse.positions.open || []);
      } else if (execution?.mission?.livePosition) {
        renderEnginePositions([execution.mission.livePosition]);
      } else {
        renderEnginePositions([]);
      }
      updateAgentTradeState({
        missionModel: {
          ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
          ...(execution?.mission || {})
        },
        missionStatus: execution?.mission?.missionStatus || "executing",
        isExecuteLoading: false
      });
      await loadAgentMissionSessions(mint);
      await loadAgentMissionDiagnostics(mint);
      try {
        await loadPaperPerformance();
      } catch (error) {
        pushMessage(`History refresh skipped: ${error.message}`, "info");
      }
      pushMessage(
        execution?.mission?.livePosition
          ? `OpenClaw mission executed on ${shortMint(mint, 4, 4)} and is now monitoring the guarded position.`
          : `OpenClaw mission evaluated ${shortMint(mint, 4, 4)} and kept execution guarded.`,
        execution?.mission?.livePosition ? "ok" : "info"
      );
      setPaperStatus("Running", "ok");
      return true;
    }

    const selectedModel = CORE_AGENT_MODEL_KEY;
    const runResponses = [];
    const runErrors = [];

    for (const mint of agentMints) {
      try {
        applyPaperTestModel(selectedModel, { quiet: true, persist: false });
        await savePaperConfig({ forceEnabled: true, silent: true });
        const runResponse = await api(
          "/api/autotrade/run",
          {
            mint,
            testModel: selectedModel
          },
          true,
          "POST"
        );
        runResponses.push({ ...runResponse, _mint: mint });
      } catch (error) {
        runErrors.push(
          `${shortMint(mint, 6, 6)} ${getPaperTestModelLabel(selectedModel)}: ${String(error?.message || "failed")}`
        );
      }
    }

    applyPaperTestModel(selectedModel, { quiet: true, persist: true });
    const savedConfig = await savePaperConfig({ forceEnabled: true, silent: true });
    if (!runResponses.length) {
      throw new Error(runErrors[0] || "all paper model runs failed");
    }

    const mergedResponse = {
      ts: new Date().toISOString(),
      mode: "paper",
      decisions: [],
      warnings: [],
      summary: {
        testModel: selectedModel,
        buyCandidates: 0,
        skipped: 0,
        maxPositionUsd: Number(paperMaxPositionInput?.value || 0),
        effectiveTradeAmountUsd: 0,
        simulatedExposureUsd: 0,
        avgExpectedPnlPct: 0
      }
    };
    for (const run of runResponses) {
      mergedResponse.ts = String(run.ts || mergedResponse.ts);
      mergedResponse.mode = String(run.mode || mergedResponse.mode);
      mergedResponse.decisions.push(...(Array.isArray(run.decisions) ? run.decisions : []));
      mergedResponse.warnings.push(...(Array.isArray(run.warnings) ? run.warnings : []));
      mergedResponse.summary.buyCandidates += Number(run.summary?.buyCandidates || 0);
      mergedResponse.summary.skipped += Number(run.summary?.skipped || 0);
      mergedResponse.summary.simulatedExposureUsd += Number(run.summary?.simulatedExposureUsd || 0);
      mergedResponse.summary.effectiveTradeAmountUsd = Number(run.summary?.effectiveTradeAmountUsd || 0);
      mergedResponse.summary.maxPositionUsd = Number(run.summary?.maxPositionUsd || mergedResponse.summary.maxPositionUsd || 0);
      mergedResponse.summary.avgExpectedPnlPct += Number(run.summary?.avgExpectedPnlPct || 0);
    }
    const selectedCount = Math.max(1, runResponses.length);
    mergedResponse.summary.avgExpectedPnlPct = Number(
      (mergedResponse.summary.avgExpectedPnlPct / selectedCount).toFixed(2)
    );
    mergedResponse.summary.simulatedExposureUsd = Number(
      mergedResponse.summary.simulatedExposureUsd.toFixed(2)
    );

    const engineAggregate = {
      ts: new Date().toISOString(),
      mode: "paper",
      actions: [],
      positions: { open: [], openCount: 0 }
    };
    for (const mint of agentMints) {
      try {
        const engineResponse = await api("/api/autotrade/engine/tick", { mint }, true, "POST");
        engineAggregate.ts = String(engineResponse.ts || engineAggregate.ts);
        engineAggregate.mode = String(engineResponse.mode || engineAggregate.mode);
        engineAggregate.actions.push(...(Array.isArray(engineResponse.actions) ? engineResponse.actions : []));
        if (engineResponse.positions) {
          engineAggregate.positions = {
            open: Array.isArray(engineResponse.positions.open) ? engineResponse.positions.open : [],
            openCount: Number(engineResponse.positions.openCount || 0)
          };
        }
      } catch (error) {
        runErrors.push(`${shortMint(mint, 6, 6)} engine tick: ${String(error?.message || "failed")}`);
      }
    }
    if (savedConfig) syncPaperConfigUi(savedConfig);
    const missionModel = getActiveAgentProvider().normalizePaperCycle({
      runResponse: mergedResponse,
      engineResponse: engineAggregate,
      mint: agentMints[0]
    });
    paperRunHistory.unshift(mergedResponse);
    paperRunHistory = paperRunHistory.slice(0, 20);
    renderPaperResults(mergedResponse);
    pushTradeActionEvents(engineAggregate.actions || [], {
      ts: engineAggregate.ts || new Date().toISOString(),
      mode: "paper"
    });
    renderAgentScannerSummary(mergedResponse.decisions || [], { ts: mergedResponse.ts });
    updateAgentTradeState({
      missionModel: {
        ...(agentTradeState.missionModel || createEmptyMissionModel(getActiveAgentProvider().id)),
        ...missionModel
      },
      missionStatus: missionModel.livePosition ? "monitoring" : missionModel.missionStatus,
      isExecuteLoading: false
    });
    evaluateSignalAlerts(buildAlertItemsFromDecisions(mergedResponse.decisions || []));
    renderEnginePositions(engineAggregate.positions?.open || []);
    try {
      await loadPaperPerformance();
    } catch (error) {
      pushMessage(`History refresh skipped: ${error.message}`, "info");
    }
    if (runResponses.length > 0) {
      const runSummary = runResponses.slice(-12)
        .map((run) => {
          const candidates = Number(run?.summary?.buyCandidates || 0);
          const expected = Number(run?.summary?.avgExpectedPnlPct || 0);
          return `${shortMint(String(run?._mint || ""), 4, 4)} AIG Core: ${candidates} candidates, ${formatNumber(expected, 2)}% expected`;
        })
        .join(" | ");
      pushMessage(`Autopilot cycle completed for ${agentMints.length} token(s) -> ${runSummary}`, "ok");
    }
    if (runErrors.length) {
      pushMessage(`Some model runs failed: ${runErrors.join(" | ")}`, "error");
    }
    setPaperStatus("Running", "ok");
    return true;
  } catch (error) {
    const message = String(error.message || "");
    if (initial) {
      setPaperStatus("Idle");
    } else if (paperTradeTimer) {
      setPaperStatus("Running", "busy");
    } else {
      setPaperStatus("Idle");
    }
    if (message.includes("already in progress")) {
      return true;
    }
    if (message.includes("quota exceeded")) {
      pushMessage("Daily scan limit reached for your plan. Upgrade to PRO or wait for quota reset.", "error");
    } else if (message.includes("autotrade is disabled")) {
      pushMessage("Paper test blocked: paper mode was disabled. It is now auto-enabled, retrying is safe.", "error");
    } else {
      notifyActionError(error, "run paper test");
    }
    updateAgentTradeState({
      missionStatus: "halted",
      isExecuteLoading: false,
      error: friendlyErrorMessage(error, "run paper test")
    });
    return false;
  } finally {
    paperRunInFlight = false;
  }
}

async function startPaperLoop() {
  if (!ensureWalletConnected("run paper test")) return;
  setButtonBusy(paperStartLoopButton, true, "Starting...");
  try {
    const agentMints = resolveAgentTargetMints({ notify: true });
    if (!agentMints.length) {
      throw new Error("At least one Agent Token is required");
    }
    stopPaperLoop();
    resetTradeActivity();
    paperSessionStartedAt = new Date().toISOString();
    paperSessionStoppedAt = null;
    renderPaperSessionTiming();
    await resetPaperPerformance({ silent: true });
    await savePaperConfig({ forceEnabled: true, silent: true });
    updateAgentTradeState({
      missionStatus: "planning",
      isExecuteLoading: true,
      emergencyStopEnabled: false,
      error: null
    });
    recordAgentActivity("Budget locked. AIG is evaluating the mission and preparing the first cycle.", "info", {
      title: "Mission Started",
      meta: `${formatUsd(Number(paperBudgetInput?.value || 0))} budget`
    });
    const intervalSec = Math.max(10, Number(paperIntervalInput?.value || 30));
    const ok = await runPaperTradeOnce({ initial: true, agentMints });
    if (!ok) {
      throw new Error("initial paper run failed; loop was not started");
    }
    paperTradeTimer = setInterval(async () => {
      await runPaperTradeOnce({ agentMints });
    }, intervalSec * 1000);
    if (paperRunCapTimer) {
      clearTimeout(paperRunCapTimer);
    }
    paperRunCapTimer = setTimeout(() => {
      stopPaperLoop();
      pushMessage(`Paper run auto-stopped after ${PAPER_RUN_MAX_MINUTES} minutes (daily cap per run).`, "info");
    }, PAPER_RUN_MAX_MINUTES * 60 * 1000);
    startRealtimeMonitor("paper");
    startAgentPriceMonitor();
    setPaperStatus("Running", "ok");
    updateAgentTradeState({
      missionStatus: "monitoring",
      isExecuteLoading: false
    });
    pushMessage(`Test mode running every ${intervalSec}s on ${agentMints.length} token(s)`, "ok");
  } catch (error) {
    if (paperSessionStartedAt && !paperSessionStoppedAt) {
      paperSessionStoppedAt = new Date().toISOString();
      renderPaperSessionTiming();
    }
    setPaperStatus("Idle");
    updateAgentTradeState({
      missionStatus: "halted",
      isExecuteLoading: false,
      error: friendlyErrorMessage(error, "start paper test loop")
    });
    notifyActionError(error, "start paper test loop");
  } finally {
    setButtonBusy(paperStartLoopButton, false);
  }
}

async function loadTokenHolders(mint, options = {}) {
  const modeRaw = String(options.mode || "sample").toLowerCase();
  const mode = modeRaw === "full" ? "full" : modeRaw === "deep" ? "deep" : "sample";
  const defaultLimit =
    mode === "full" ? 40 : mode === "deep" ? HOLDER_DEEP_LIMIT : HOLDER_SAMPLE_LIMIT;
  const limit = Math.max(8, Math.min(50, Number(options.limit || defaultLimit)));
  const response = await api(
    `/api/token/holders?mint=${encodeURIComponent(mint)}&limit=${limit}&mode=${mode}`,
    null,
    true,
    "GET"
  );
  return response;
}

function updateStats(stats) {
  historicalStats = stats || null;
  renderAnalytics();
}

function renderAnalytics() {
  if (!statsGrid) return;
  const totals = historicalStats?.totals || {};
  const sessionSamples = Math.max(1, sessionAnalytics.tokensSeen);
  const avgPattern = sessionAnalytics.tokensSeen
    ? sessionAnalytics.patternTotal / sessionSamples
    : 0;
  const avgConfidence = sessionAnalytics.tokensSeen
    ? (sessionAnalytics.confidenceTotal / sessionSamples) * 100
    : Number(historicalStats?.quality?.avgSignalConfidence || 0);
  const avgConnected = sessionAnalytics.tokensSeen
    ? sessionAnalytics.connectedTotal / sessionSamples
    : 0;

  statsGrid.innerHTML = `
    <div class="stat"><span>Session Batches</span><strong>${sessionAnalytics.batches}</strong></div>
    <div class="stat"><span>Tokens Scanned (Session)</span><strong>${sessionAnalytics.tokensSeen}</strong></div>
    <div class="stat"><span>Favorable Hits</span><strong>${sessionAnalytics.favorable}</strong></div>
    <div class="stat"><span>Caution Hits</span><strong>${sessionAnalytics.caution}</strong></div>
    <div class="stat"><span>High-Risk Hits</span><strong>${sessionAnalytics.highRisk}</strong></div>
    <div class="stat"><span>Avg Pattern (Session)</span><strong>${formatNumber(avgPattern, 2)}</strong></div>
    <div class="stat"><span>Avg Confidence</span><strong>${formatNumber(avgConfidence, 2)}%</strong></div>
    <div class="stat"><span>Avg Connected</span><strong>${formatPct(avgConnected, 2)}</strong></div>
    <div class="stat"><span>Scans Stored</span><strong>${escapeHtml(totals.signals ?? 0)}</strong></div>
    <div class="stat"><span>Forecasts Stored</span><strong>${escapeHtml(totals.forecasts ?? 0)}</strong></div>
  `;

  if (statsMeta) {
    const stamp = sessionAnalytics.lastBatchAt
      ? new Date(sessionAnalytics.lastBatchAt).toLocaleTimeString()
      : "No live batch yet";
    statsMeta.textContent = `Live session metrics last updated: ${stamp}. Historical totals remain separate.`;
  }
}

async function refreshStats() {
  if (!authToken) return;
  const response = await api("/api/dashboard/stats", null, true);
  updateStats(response.stats);
  if (response.access) {
    scannerAccessStatus = response.access;
    renderScannerAccessSummary(scannerAccessStatus);
  }
}

async function refreshUserProfile() {
  const response = await api("/api/auth/me", null, false, "GET");
  const user = response.user || {};
  authToken = "cookie-session";
  userWallet = String(user.wallet || userWallet || "");
  userPlan = String(user.plan || userPlan || "free").toLowerCase();
  localStorage.setItem("enigma_wallet", userWallet);
  localStorage.setItem("enigma_plan", userPlan);
  setAuthState();
  if (response.access) {
    scannerAccessStatus = response.access;
    renderScannerAccessSummary(scannerAccessStatus);
  }
}

function signalCard(item) {
  if (!item.ok) {
    return `
      <article class="card bad">
        <div class="token-head">
          <div class="token-avatar fallback">!</div>
          <div class="token-meta">
            <h3>${escapeHtml(shortMint(item.mint))}</h3>
            <p class="mint">${escapeHtml(item.mint)}</p>
          </div>
        </div>
        <p class="error-text">${escapeHtml(item.error || "scan failed")}</p>
      </article>
    `;
  }

  const signal = item.signal || {};
  const kill = signal.killSwitch || {};
  const risk = kill.risk || {};
  const holderBehavior = risk.holderBehavior || {};
  const holderProfiles = Array.isArray(risk.holderProfiles) ? risk.holderProfiles : [];
  const connectedGroups = Array.isArray(holderBehavior.connectedGroups)
    ? holderBehavior.connectedGroups
    : [];
  const links = signal.links || {};
  const token = signal.token || {};
  const market = signal.market || {};
  const sentiment = signal.sentiment || {};
  const tradePlan = signal.tradePlan || {};
  const riskFlags = Array.isArray(risk.suspiciousPatterns) ? risk.suspiciousPatterns : [];
  const beginnerLines = buildBeginnerSentimentLines(signal);
  const regimeVm = buildMarketRegimeViewModel(signal.marketRegime || {});
  const guardianVm = buildGuardianViewModel(signal, regimeVm);
  const concentrationMode = String(risk.concentrationMode || "");
  const topConcentrationPct = Number(
    risk.top10HolderSharePct === undefined ? risk.top3HolderSharePct || 0 : risk.top10HolderSharePct
  );
  const topConcentrationLabel = concentrationMode.includes("lp_candidate_unconfirmed")
    ? "Top-10 Share (LP maybe included)"
    : "Top-10 Share (ex-LP)";
  const analysisCoverage = holderBehavior.analysisCoverage || {};
  const coverageMode = String(analysisCoverage.mode || "").toLowerCase();
  const sampledAccountsRaw = Number(analysisCoverage.accountsWithBuySellSampling || 0);
  const hasSamplingMeta = Number.isFinite(sampledAccountsRaw) && sampledAccountsRaw > 0;
  const sampledAccounts = hasSamplingMeta ? Math.max(0, Math.floor(sampledAccountsRaw)) : holderProfiles.length;
  const buySellHeader =
    coverageMode === "sample"
      ? "Buys/Sells (recent sample)"
      : "Buys/Sells (recent window)";

  const status = String(signal.status || "HIGH_RISK");
  const confidence = Number(signal.confidence || 0);
  const mint = String(item.mint || token.mint || "");
  const macroToken = isMacroTrackedToken(mint);
  const chainRaw = String(market.chain || (macroToken ? "cex" : "solana")).toLowerCase();
  const chainLabel =
    chainRaw === "solana"
      ? "Solana"
      : chainRaw === "cex"
        ? "BTC/ETH Paper"
        : chainRaw.toUpperCase();
  const primaryLinkLabel = macroToken ? "TradingView" : "DexScreener";
  const secondaryLinkLabel = macroToken ? "CoinGecko" : "Birdeye";
  const tertiaryLinkLabel = macroToken ? "Binance" : "Solscan";
  const participation = Number(market.volume24hUsd || 0) / Math.max(Number(market.liquidityUsd || 0), 1);
  const isExpanded = expandedHolders.has(mint);
  const isLoadingHolders = loadingHolders.has(mint);

  const riskTone =
    status === "FAVORABLE" ? "good" : status === "CAUTION" ? "warn" : "bad";
  const rugFromServer = Number(signal?.rugPullRisk?.scorePct);
  const rugTop10Share = Number(
    risk.top10HolderSharePct === undefined ? risk.top3HolderSharePct || 0 : risk.top10HolderSharePct
  );
  const rugScore = Number.isFinite(rugFromServer)
    ? rugFromServer
    : Math.max(
        0,
        Math.min(
          99,
          Math.round(
            100 -
              Number(kill.score || 0) +
              rugTop10Share * 0.22 +
              Number(holderBehavior.connectedHolderPct || 0) * 0.35 +
              Number(holderBehavior.newWalletHolderPct || 0) * 0.25 +
              (risk.hasMintAuthority ? 10 : 0) +
              (risk.hasFreezeAuthority ? 8 : 0)
          )
        )
      );
  const rugBand = rugScore >= 70 ? "High" : rugScore >= 45 ? "Medium" : "Low";
  const forensics = buildScannerForensics(signal);
  const bundleTone = scannerBundleTone(forensics.bundleRiskScore);

  const topHolders = isExpanded ? holderProfiles : holderProfiles.slice(0, 6);
  return `
    <article class="card ${status.toLowerCase()}">
      <div class="token-main-head">
        <div class="token-head">
          ${avatarHtml(token)}
          <div class="token-meta">
            <h3>${escapeHtml(token.name || "Unknown Token")}</h3>
            <p>${escapeHtml(token.symbol || "N/A")} | ${escapeHtml(shortMint(mint, 8, 8))}</p>
            <p class="small muted">Network: <strong>${escapeHtml(chainLabel)}</strong></p>
          </div>
        </div>
        <div class="mini-chart-wrap">
          ${sparklineSvg(signal.miniChart?.points || [])}
        </div>
        <div class="token-price-box">
          <strong>${formatUsdPrice(market.priceUsd || 0)}</strong>
          <span class="pill ${status.toLowerCase()}">${escapeHtml(status.replace("_", " "))}</span>
        </div>
      </div>

      <div class="card-sections">
        <section class="intel-box">
          <h4>Risk Analysis</h4>
          <div class="risk-strip ${riskTone}">
            ${escapeHtml(kill.verdict || "N/A")} ${escapeHtml(formatNumber(kill.score || 0, 0))}/100 | Pattern ${escapeHtml(formatNumber(signal.patternScore || 0, 2))}/100 | Confidence ${escapeHtml(confidence.toFixed(2))}
          </div>
          <div class="sentiment-box">
            <span>Sentiment</span>
            <strong>${escapeHtml(sentiment.label || "Neutral")} (${formatNumber(sentiment.score || 50, 0)}/100)</strong>
            <p>${escapeHtml(sentiment.summary || "Sentiment data unavailable.")}</p>
            <ul class="sentiment-notes">
              ${beginnerLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
            </ul>
          </div>
          <div class="mini-grid">
            <div><span>Concentration</span><strong>${escapeHtml(risk.concentrationRisk || "unknown")}</strong></div>
            <div><span>${escapeHtml(topConcentrationLabel)}</span><strong>${formatPct(topConcentrationPct)}</strong></div>
            <div><span>Mint Auth</span><strong>${risk.hasMintAuthority ? "Active" : "Revoked"}</strong></div>
            <div><span>Freeze Auth</span><strong>${risk.hasFreezeAuthority ? "Active" : "Revoked"}</strong></div>
            <div class="rug-score-cell"><span>Rug Risk</span><strong class="rug-score ${rugBand.toLowerCase()}">${formatNumber(rugScore, 0)}% (${rugBand})</strong></div>
          </div>
          ${
            riskFlags.length
              ? `<div class="risk-flags">${riskFlags
                  .slice(0, 4)
                  .map((flag) => `<span class="risk-flag">${escapeHtml(flag)}</span>`)
                  .join("")}</div>`
              : `<div class="risk-flags"><span class="risk-flag neutral">No elevated risk flags in this pass.</span></div>`
          }
        </section>

        <section class="intel-box regime-box">
          <h4>Market Regime</h4>
          <div class="risk-strip ${escapeHtml(regimeVm.tone)}">
            ${escapeHtml(regimeVm.regime)} (${escapeHtml(regimeVm.timeframe)})
          </div>
          <div class="mini-grid regime-grid">
            <div>
              <span>Volatility Index (0-100)</span>
              <strong>${escapeHtml(regimeVm.volatilityText)}</strong>
              <small>${escapeHtml(regimeVm.volatilityLabel)} (${escapeHtml(regimeVm.volatilityBand)})</small>
            </div>
            <div>
              <span>ADX(14)</span>
              <strong>${escapeHtml(regimeVm.adxText)}</strong>
              <small>${escapeHtml(regimeVm.adxLabel)}</small>
            </div>
            <div>
              <span>Suggested Strategy</span>
              <strong>${escapeHtml(regimeVm.strategyHint)}</strong>
              <small>Preferred timeframe ${escapeHtml(regimeVm.timeframe)}</small>
            </div>
          </div>
          ${
            regimeVm.note
              ? `<p class="small muted regime-note">${escapeHtml(regimeVm.note)}</p>`
              : `<p class="small muted regime-note">Regime thresholds: ADX trend strength + ATR percentile volatility.</p>`
          }
        </section>

        <section class="intel-box guardian-box">
          <h4>AI Guardian</h4>
          <div class="risk-strip ${escapeHtml(guardianVm.tone)}">
            ${escapeHtml(guardianVm.status)} (${formatNumber(guardianVm.score, 0)}/100)
          </div>
          <div class="mini-grid">
            <div><span>Status</span><strong>${escapeHtml(guardianVm.status)}</strong></div>
            <div><span>Strategy</span><strong>${escapeHtml(guardianVm.strategy)}</strong></div>
          </div>
          <p class="small muted">${escapeHtml(guardianVm.action)}</p>
          <p class="small muted">${escapeHtml(guardianVm.stopGuidance)}</p>
        </section>

        <section class="intel-box">
          <h4>Trader Plan</h4>
          <div class="mini-grid">
            <div><span>Entry Range</span><strong>${formatPrice(tradePlan.buyZone?.low)} - ${formatPrice(tradePlan.buyZone?.high)}</strong></div>
            <div><span>Support</span><strong class="price-support">${formatPrice((tradePlan.support || [])[0])} | ${formatPrice((tradePlan.support || [])[1])}</strong></div>
            <div><span>Target Sell</span><strong class="price-resistance">${formatPrice((tradePlan.resistance || [])[0])} | ${formatPrice((tradePlan.resistance || [])[1])}</strong></div>
            <div><span>Stop Loss</span><strong class="price-stop">${formatPrice(tradePlan.stopLoss)}</strong></div>
            <div><span>24h Flow</span><strong class="${flowClass(sentiment.orderFlow?.buys24h, sentiment.orderFlow?.sells24h)}">B ${formatNumber(sentiment.orderFlow?.buys24h || 0, 0)} / S ${formatNumber(sentiment.orderFlow?.sells24h || 0, 0)}</strong></div>
            <div><span>24h Change</span><strong>${formatPct(market.priceChange24hPct)}</strong></div>
            <div><span>Liquidity</span><strong>${formatUsd(market.liquidityUsd)}</strong></div>
            <div><span>24h Volume</span><strong>${formatUsd(market.volume24hUsd)}</strong></div>
            <div><span>Participation</span><strong>${formatNumber(participation, 2)}</strong></div>
            <div><span>FDV</span><strong>${formatUsd(market.fdvUsd)}</strong></div>
          </div>
          <p class="plan-note">${escapeHtml(tradePlan.recommendation || "")}</p>
        </section>
      </div>

      <section class="intel-box scanner-forensics-box">
        <div class="row between scanner-forensics-head">
          <h4>AIG Forensics</h4>
          <div class="scanner-share-actions">
            <button class="secondary tiny-btn" data-download-card="${escapeHtml(mint)}">Download PNG</button>
            <button class="secondary tiny-btn" data-share-x="${escapeHtml(mint)}">Share on X</button>
          </div>
        </div>
        <div class="risk-strip ${bundleTone}">
          Bundle Risk ${formatNumber(forensics.bundleRiskScore, 0)}/100 (${escapeHtml(forensics.bundleRiskVerdict)})
        </div>
        <div class="mini-grid">
          <div><span>Top 10 Share</span><strong>${formatPctCompact(forensics.top10ExLp, 1)}</strong></div>
          <div><span>Top 20 Share</span><strong>${formatPctCompact(forensics.top20ExLp, 1)}</strong></div>
          <div><span>Top Cluster ${forensics.clusterLpIncluded ? "(LP maybe included)" : "(ex-LP)"}</span><strong>${formatPctCompact(forensics.topClusterPct, 1)}</strong></div>
          <div><span>Analyzed Holders</span><strong>${formatNumber(forensics.analyzedHolderCount, 0)}</strong></div>
          <div><span>New Wallets</span><strong>${formatPctCompact(forensics.newWalletPct, 1)}</strong></div>
          <div><span>Avg Bag</span><strong>${forensics.avgBagUsd > 0 ? formatUsd(forensics.avgBagUsd) : "n/a"}</strong></div>
        </div>
        <div class="sentiment-box scanner-brief-box">
          <span>AIG Brief</span>
          <strong>${escapeHtml(forensics.bundleRiskVerdict === "HIGH" ? "Bundled Risk Elevated" : forensics.bundleRiskVerdict === "CAUTION" ? "Coordination Risk Present" : "No Major Bundle Signal")}</strong>
          <p>${escapeHtml(forensics.verdictLine)}</p>
          <p>${escapeHtml(forensics.taLine)}</p>
          <p>${escapeHtml(forensics.liquidityLine)}</p>
          <p>${escapeHtml(forensics.verificationNote)}</p>
        </div>
        ${
          forensics.fundingBreakdown.length
            ? `<div class="cluster-wrap">${forensics.fundingBreakdown
                .slice(0, 5)
                .map(
                  (entry) =>
                    `<span class="cluster-chip">${escapeHtml(humanizeFundingSource(entry.source))}: ${formatPctCompact(entry.holdPct, 1)} | ${formatNumber(entry.holderCount, 0)} holders</span>`
                )
                .join("")}</div>`
            : ""
        }
      </section>

      <section class="intel-box holder-box">
        <h4>Holder Pattern Behavior</h4>
        <div class="behavior-summary">
          <span>Connected: <strong>${formatPct(holderBehavior.connectedHolderPct || 0)}</strong></span>
          <span>New Wallets: <strong>${formatPct(holderBehavior.newWalletHolderPct || 0)}</strong></span>
          <span>Groups: <strong>${formatNumber(holderBehavior.connectedGroupCount || 0, 0)}</strong></span>
          <span>Avg Wallet Age: <strong>${formatNumber(holderBehavior.avgWalletAgeDays || 0, 1)}d</strong></span>
        </div>
        <p class="small muted">${escapeHtml(holderCoverageNote(holderBehavior))}</p>
        ${sourceLegendHtml()}

        <div class="table-wrap">
          <table class="holder-table">
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Share</th>
                <th>Age</th>
                <th>Source</th>
                <th>Group</th>
                <th>${escapeHtml(buySellHeader)}</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              ${
                topHolders.length
                  ? topHolders
                      .map(
                        (holder, index) => {
                          const tier = holderTier(holder.amountPct);
                          const hasActivitySample = index < sampledAccounts;
                          const buyCount = Number(holder.buyTxCount || 0);
                          const sellCount = Number(holder.sellTxCount || 0);
                          const activityClass = hasActivitySample
                            ? flowClass(buyCount, sellCount)
                            : "flow-neutral";
                          const activityText = hasActivitySample
                            ? `${formatNumber(buyCount, 0)} / ${formatNumber(sellCount, 0)}`
                            : "n/a";
                          const activityTitle = hasActivitySample
                            ? "Recent sampled buy/sell count."
                            : "Not sampled in this pass. Re-scan to refresh the recent activity window.";
                          return `
                        <tr>
                          <td>
                            <span class="holder-tier ${tier.className}" title="${tier.label}">
                              <span class="tier-icon">${tier.icon}</span>
                              <code>${escapeHtml(shortMint(holder.owner, 5, 5))}</code>
                            </span>
                          </td>
                          <td><strong>${formatPct(holder.amountPct || 0)}</strong></td>
                          <td>${holder.walletAgeDays === null ? "N/A" : `${formatNumber(holder.walletAgeDays, 1)}d`}</td>
                          <td><span class="source-pill" title="${escapeHtml(describeWalletSource(holder.walletSource))}">${escapeHtml(holder.walletSource || "unattributed-wallet")}</span></td>
                          <td>${holder.connectedGroupId ? `#${holder.connectedGroupId}` : "-"}</td>
                          <td class="${escapeHtml(activityClass)}" title="${escapeHtml(activityTitle)}">${escapeHtml(activityText)}</td>
                          <td>${escapeHtml((holder.tags || []).join(", ") || "-")}</td>
                        </tr>
                      `;
                        }
                      )
                      .join("")
                  : `<tr><td colspan="7">No holder rows returned yet for this pass. Data is sampled from recent transactions by default.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        ${
          connectedGroups.length
            ? `<div class="cluster-wrap">${connectedGroups
                .slice(0, 3)
                .map(
                  (group) => `<span class="cluster-chip">Cluster #${group.id}: ${group.holderCount} holders | ${formatPct(group.holdPct || 0)} | ${escapeHtml(group.reason || "shared activity")}</span>`
                )
                .join("")}</div>`
            : ""
        }

        <div class="holder-actions-row">
          <button class="secondary tiny-btn" data-expand-holders="${escapeHtml(mint)}">
            ${isExpanded ? "Collapse Holder List" : "Expand Holder List"}
          </button>
          ${
            isLoadingHolders
              ? `<span class="holders-loading">Loading top-10 holder behavior (recent mode)...</span>`
              : ""
          }
          ${
            isExpanded
              ? `<span class="holders-loading">Showing recent transaction sample (rolling recent activity, not full lifetime history).</span>`
              : ""
          }
        </div>
      </section>

      <div class="mint-row">
        <code>${escapeHtml(mint)}</code>
        <button class="tiny-btn" data-copy-mint="${escapeHtml(mint)}">Copy</button>
      </div>

      <div class="row links">
        <a href="${escapeHtml(links.dexscreener || "#")}" target="_blank" rel="noreferrer">${primaryLinkLabel}</a>
        <a href="${escapeHtml(links.birdeye || "#")}" target="_blank" rel="noreferrer">${secondaryLinkLabel}</a>
        <a href="${escapeHtml(links.solscan || "#")}" target="_blank" rel="noreferrer">${tertiaryLinkLabel}</a>
      </div>
    </article>
  `;
}

function attachCardHandlers() {
  const applyHolderDetails = (match, details) => {
    if (!match?.signal?.killSwitch?.risk) return false;
    const risk = match.signal.killSwitch.risk;
    const currentProfiles = Array.isArray(risk.holderProfiles) ? risk.holderProfiles : [];
    const nextProfiles = Array.isArray(details?.holderProfiles) ? details.holderProfiles : [];
    const nextBehavior =
      details?.holderBehavior && typeof details.holderBehavior === "object"
        ? details.holderBehavior
        : null;
    const coverage =
      nextBehavior && typeof nextBehavior.analysisCoverage === "object"
        ? nextBehavior.analysisCoverage
        : {};
    const nextTopAccounts = Number(coverage.topAccountsAnalyzed || nextBehavior?.analyzedTopAccounts || 0);
    const nextNote = String(coverage.note || "").trim();
    const hasCoverageMeta = Boolean(nextBehavior) && (nextTopAccounts > 0 || nextNote.length > 0);

    if (nextProfiles.length > 0) {
      risk.holderProfiles = nextProfiles;
    }
    if (hasCoverageMeta || (Boolean(nextBehavior) && !currentProfiles.length)) {
      risk.holderBehavior = nextBehavior || risk.holderBehavior || {};
    }
    return nextProfiles.length > 0 || hasCoverageMeta;
  };

  document.querySelectorAll("button[data-copy-mint]").forEach((button) => {
    button.addEventListener("click", async () => {
      const mint = String(button.getAttribute("data-copy-mint") || "");
      if (!mint) return;
      await navigator.clipboard.writeText(mint);
      pushMessage(`Copied token ${shortMint(mint)}`, "info");
    });
  });

  document.querySelectorAll("button[data-download-card]").forEach((button) => {
    button.addEventListener("click", async () => {
      const mint = String(button.getAttribute("data-download-card") || "");
      const match = lastSignalItems.find((item) => String(item?.mint || "") === mint && item?.ok && item?.signal);
      if (!match?.signal) return;
      try {
        await downloadScannerCardPng(match.signal);
        pushMessage(`Downloaded forensics PNG for ${shortMint(mint)}`, "ok");
      } catch (error) {
        notifyActionError(error, "download scanner report");
      }
    });
  });

  document.querySelectorAll("button[data-share-x]").forEach((button) => {
    button.addEventListener("click", () => {
      const mint = String(button.getAttribute("data-share-x") || "");
      const match = lastSignalItems.find((item) => String(item?.mint || "") === mint && item?.ok && item?.signal);
      if (!match?.signal) return;
      try {
        shareScannerCardToX(match.signal);
        pushMessage(`Opened X share for ${shortMint(mint)}`, "ok");
      } catch (error) {
        notifyActionError(error, "share scanner report");
      }
    });
  });

  document.querySelectorAll("button[data-expand-holders]").forEach((button) => {
    button.addEventListener("click", async () => {
      const mint = String(button.getAttribute("data-expand-holders") || "");
      if (!mint) return;

      if (expandedHolders.has(mint)) {
        expandedHolders.delete(mint);
        renderSignals(lastSignalItems);
        return;
      }

      expandedHolders.add(mint);
      loadingHolders.add(mint);
      renderSignals(lastSignalItems);

      try {
        blockFullscreenUi("Loading recent holder behavior...");
        const details = await loadTokenHolders(mint, { mode: "sample", limit: HOLDER_SAMPLE_LIMIT });
        const match = lastSignalItems.find((item) => item.ok && (item.mint === mint || item.signal?.mint === mint));
        if (match) {
          const updated = applyHolderDetails(match, details);
          if (!updated) {
            pushMessage(
              `No additional holder rows returned for ${shortMint(mint)}. Keeping latest recent snapshot.`,
              "info"
            );
          }
        }
      } catch (error) {
        notifyActionError(error, `load holder details for ${shortMint(mint)}`);
      } finally {
        unblockFullscreenUi();
        loadingHolders.delete(mint);
        renderSignals(lastSignalItems);
      }
    });
  });
}

function renderSignals(items) {
  if (!signalFeed) return;
  lastSignalItems = items || [];
  lastSignalItems.forEach((item) => {
    if (!item?.ok) return;
    cacheTokenMeta(item.signal?.token || null, String(item.mint || item.signal?.mint || ""));
  });
  renderHeatmap(lastSignalItems);
  let viewItems = filteredAndSortedItems(lastSignalItems);
  if (!viewItems.length && lastSignalItems.length && String(resultFilterSelect?.value || "all") !== "all") {
    if (resultFilterSelect) resultFilterSelect.value = "all";
    viewItems = filteredAndSortedItems(lastSignalItems);
    pushMessage("Scanner filter reset to All so token reports stay visible.", "info");
  }
  if (!viewItems.length) {
    signalFeed.innerHTML = `<article class="card empty-state"><p>No results match current filters yet.</p></article>`;
    return;
  }
  signalFeed.innerHTML = viewItems.map((item) => signalCard(item)).join("");
  attachCardHandlers();
}

function syncThresholdUi() {
  if (thresholdFavorablePatternInput) {
    thresholdFavorablePatternInput.value = String(alertThresholds.favorablePatternMin);
  }
  if (thresholdRiskKillInput) {
    thresholdRiskKillInput.value = String(alertThresholds.riskKillMax);
  }
  if (thresholdConnectedMaxInput) {
    thresholdConnectedMaxInput.value = String(alertThresholds.connectedMax);
  }
}

function persistThresholds() {
  localStorage.setItem("enigma_threshold_fav_pattern", String(alertThresholds.favorablePatternMin));
  localStorage.setItem("enigma_threshold_risk_kill", String(alertThresholds.riskKillMax));
  localStorage.setItem("enigma_threshold_connected_max", String(alertThresholds.connectedMax));
}

function applyPreset(name) {
  const preset = riskPresets[name] || riskPresets.balanced;
  alertThresholds.favorablePatternMin = preset.favorablePatternMin;
  alertThresholds.riskKillMax = preset.riskKillMax;
  alertThresholds.connectedMax = preset.connectedMax;
  syncThresholdUi();
  persistThresholds();
  pushMessage(
    `Applied ${name} preset: favorable >= ${preset.favorablePatternMin}, risk kill <= ${preset.riskKillMax}, connected <= ${preset.connectedMax}%`,
    "info"
  );
}

function renderDiscovery(items) {
  if (!discoveryList) return;
  discoveryList.innerHTML = items
    .map((item) => {
      const signal = item.signal || {};
      const links = signal.links || {};
      const token = signal.token || {};
      const mint = String(item.mint || token.mint || "");

      return `
        <article class="discover-item">
          <div class="row between">
            <div class="token-head compact">
              ${avatarHtml(token, "token-avatar small")}
              <div class="token-meta">
                <h3>${escapeHtml(token.symbol || shortMint(mint))}</h3>
                <p>${escapeHtml(shortMint(mint))}</p>
              </div>
            </div>
            <span class="pill ${String(signal.status || "CAUTION").toLowerCase()}">${escapeHtml(signal.status || "N/A")}</span>
          </div>
          <div class="discover-actions">
            <a href="${escapeHtml(links.dexscreener || "#")}" target="_blank" rel="noreferrer">DexScreener</a>
            <a href="${escapeHtml(links.birdeye || "#")}" target="_blank" rel="noreferrer">Birdeye</a>
            <button data-scan-mint="${escapeHtml(mint)}">Scan This Token</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("button[data-scan-mint]").forEach((button) => {
    button.addEventListener("click", async () => {
      setButtonBusy(button, true, "Scanning...");
      try {
        if (!ensureWalletConnected("scan discovered token")) return;
        const mint = String(button.getAttribute("data-scan-mint") || "");
        if (!mint) return;
        await runSingleMintScan(mint, {
          loadingMessage: "Scanning selected random token...",
          successPrefix: "Random selection scan completed for"
        });
      } catch (error) {
        notifyActionError(error, "scan discovered token");
      } finally {
        setButtonBusy(button, false);
      }
    });
  });
}

function normalizeSignalItems(items) {
  return (items || [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const mint = String(item.mint || item.signal?.token?.mint || item.signal?.mint || "").trim();
      if (!mint) return null;
      if (item.ok === false) {
        return { mint, ok: false, error: String(item.error || "scan failed") };
      }
      return {
        mint,
        ok: true,
        signalId: Number(item.signalId || 0) || undefined,
        signal: item.signal || {}
      };
    })
    .filter(Boolean);
}

function processScanItems(items, successMessage) {
  const normalized = normalizeSignalItems(items);
  if (!normalized.length) {
    throw new Error("Scanner returned no token data in this pass.");
  }
  renderSignals(normalized);
  updateSessionAnalyticsFromItems(normalized);
  evaluateSignalAlerts(normalized);
  renderAnalytics();
  if (successMessage) {
    pushMessage(successMessage, "ok");
  }
  if (scannerAccessStatus) {
    scannerAccessStatus.scannerDailyUsed = Number(scannerAccessStatus.scannerDailyUsed || 0) + 1;
    const limit = Number(scannerAccessStatus.scannerDailyLimit || 0);
    scannerAccessStatus.scannerDailyRemaining = Math.max(0, limit - scannerAccessStatus.scannerDailyUsed);
    renderScannerAccessSummary(scannerAccessStatus);
  }
  return normalized;
}

async function runSingleMintScan(mint, options = {}) {
  const loadingMessage = String(options.loadingMessage || "Running scan and building report...");
  const successPrefix = String(options.successPrefix || "Manual scan completed for");
  blockFullscreenUi(loadingMessage);
  try {
    const response = await api("/api/signal", { mint }, true, "POST", {
      timeoutMs: MANUAL_SCAN_TIMEOUT_MS,
      maxAttempts: 1
    });
    processScanItems(
      [{ mint, ok: true, signalId: response.signalId, signal: response.signal }],
      `${successPrefix} ${shortMint(mint)}`
    );
  } finally {
    unblockFullscreenUi();
  }
}

async function scanRandomToken(options = {}) {
  if (!ensureWalletConnected("run scanner scan")) {
    throw buildWalletRequiredError("run scanner scan");
  }
  const shouldBlockUi = Boolean(options.blockUi);
  const blockMessage = String(options.blockMessage || "Scanning one random token. Please wait...");
  const showDiscoveryCard = options.showDiscoveryCard !== false;
  if (shouldBlockUi) {
    blockFullscreenUi(blockMessage);
  }
  try {
    const response = await api("/api/discovery/suggest", { limit: 1 }, true, "POST", {
      timeoutMs: MANUAL_SCAN_TIMEOUT_MS,
      maxAttempts: 1
    });
    const rawItems = Array.isArray(response.items) ? response.items : [];
    const normalized = normalizeSignalItems(rawItems);
    const first = normalized[0];
    if (!first) {
      throw new Error("No random token available right now. Try again.");
    }
    if (showDiscoveryCard) {
      renderDiscovery(rawItems.slice(0, 1));
    }
    processScanItems([first], `Random scan completed for ${shortMint(first.mint)}`);
    return first;
  } finally {
    if (shouldBlockUi) {
      unblockFullscreenUi();
    }
  }
}

async function connectWallet() {
  setButtonBusy(connectWalletButton, true, "Connecting...");
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      throw new Error("Phantom wallet not found");
    }

    const connected = await provider.connect();
    const wallet = connected.publicKey.toString();

    const access = await api(`/api/access/kobx?wallet=${encodeURIComponent(wallet)}`, null, false, "GET", {
      timeoutMs: 20000,
      maxAttempts: 1
    });
    if (!access?.eligible) {
      await disconnectPhantom(provider);
      clearLocalSessionState();
      setNetworkStatus("KOBX required", "error");
      showKobxAccessBlocked(access);
      return;
    }
    scannerAccessStatus = access;
    renderScannerAccessSummary(scannerAccessStatus);

    const nonce = await api("/api/auth/nonce", { wallet });
    const encoded = new TextEncoder().encode(nonce.message);
    const signed = await provider.signMessage(encoded, "utf8");
    const signatureBase64 = btoa(String.fromCharCode(...signed.signature));

    const verify = await api("/api/auth/verify", {
      wallet,
      nonce: nonce.nonce,
      signature: signatureBase64
    });

    authToken = "cookie-session";
    userWallet = wallet;
    userPlan = String(verify.user?.plan || "free").toLowerCase();
    localStorage.setItem("enigma_wallet", userWallet);
    localStorage.setItem("enigma_plan", userPlan);
    setAuthState();
    pushMessage("Wallet connected", "ok");

    await refreshStats();
    await refreshUserProfile();
    await loadPaperConfig();
    await loadPaperPerformance();
    await loadEngineConfig();
    applySavedOperatingPreset();
    await loadEnginePositions();
    {
      const workspaceId = resolveAgentTargetMint({ notify: false });
      startAgentMissionStream(workspaceId);
      await restoreAgentMissionSession(workspaceId);
      await loadAgentMissionSessions(workspaceId);
      await loadAgentMissionDiagnostics(workspaceId);
    }
    profileWorkspaceLoadedAt = 0;
    if (document.body.classList.contains("workspace-profile")) {
      await loadProfileWorkspaceData({ force: true, silent: true });
    }
  } catch (error) {
    if (String(error?.code || "").toUpperCase() === "KOBX_REQUIRED") {
      await disconnectPhantom(window.solana);
      clearLocalSessionState();
      setNetworkStatus("KOBX required", "error");
      showKobxAccessBlocked(error);
    } else {
      notifyActionError(error, "connect wallet");
    }
  } finally {
    setButtonBusy(connectWalletButton, false);
  }
}

async function discoverSuggestions() {
  if (!ensureWalletConnected("run random scan")) return;
  setButtonBusy(discoverTokensButton, true, "Scanning...");
  try {
    await scanRandomToken({
      blockUi: true,
      blockMessage: "Running random scan and building report...",
      showDiscoveryCard: true
    });
  } catch (error) {
    notifyActionError(error, "run random scan");
  } finally {
    setButtonBusy(discoverTokensButton, false);
  }
}

async function scanManualMint() {
  if (!ensureWalletConnected("run manual scan")) return;
  const raw = String(manualMintInput?.value || "").trim();
  if (!raw) {
    pushMessage("Enter a token first", "error");
    return;
  }
  const mint = normalizeTrackedTokenId(raw);
  if (!mint) {
    pushMessage("Token format looks invalid. Use Solana mint, BTC, or ETH.", "error");
    return;
  }

  setButtonBusy(scanManualButton, true, "Scanning...");
  try {
    await runSingleMintScan(mint, {
      loadingMessage: "Running manual scan and building report...",
      successPrefix: "Manual scan completed for"
    });
  } catch (error) {
    notifyActionError(error, "run manual scan");
  } finally {
    setButtonBusy(scanManualButton, false);
  }
}

async function hydrateSession() {
  const hadClientSessionHint = Boolean(authToken || userWallet);
  setNetworkStatus("Syncing...", "busy");

  try {
    await refreshUserProfile();
    await refreshStats();
    await loadPaperConfig();
    await loadPaperPerformance();
    await loadEngineConfig();
    applySavedOperatingPreset();
    await loadEnginePositions();
    startAgentPriceMonitor();
    {
      const workspaceId = resolveAgentTargetMint({ notify: false });
      startAgentMissionStream(workspaceId);
      await restoreAgentMissionSession(workspaceId);
      await loadAgentMissionSessions(workspaceId);
      await loadAgentMissionDiagnostics(workspaceId);
    }
    reconnectBackoffMs = 5000;
    reconnectNoticeShown = false;
    setNetworkStatus("Connected", "ok");
    if (document.body.classList.contains("workspace-profile")) {
      await loadProfileWorkspaceData({ force: true, silent: true });
    }
  } catch (error) {
    if (!isAuthFailure(error)) {
      if (Number(error?.status || 0) === 429 || String(error?.code || "").toUpperCase() === "HTTP_429") {
        setNetworkStatus("Rate limited", "busy");
        return;
      }
      scheduleSessionReconnect(error?.message || "network");
      return;
    }
    if (!hadClientSessionHint) {
      authToken = "";
      userWallet = "";
      userPlan = "free";
      setAuthState();
      setNetworkStatus(navigator.onLine ? "Connected" : "Offline", navigator.onLine ? "ok" : "error");
      return;
    }
    stopRealtimeMonitor();
    stopAgentPriceMonitor();
    stopAgentMissionStream();
    authToken = "";
    userWallet = "";
    userPlan = "free";
    localStorage.removeItem("enigma_wallet");
    localStorage.removeItem("enigma_plan");
    setAuthState();
    setNetworkStatus("Auth expired", "error");
    renderProfileWorkspacePlaceholder("Connect wallet to load profile and history.");
  }
}

function syncAlertUi() {
  if (alertFavorableInput) alertFavorableInput.checked = alertPrefs.favorable;
  if (alertHighRiskInput) alertHighRiskInput.checked = alertPrefs.highRisk;
  if (alertSoundInput) alertSoundInput.checked = alertPrefs.sound;
}

function persistAlertPrefs() {
  localStorage.setItem("enigma_alert_favorable", alertPrefs.favorable ? "1" : "0");
  localStorage.setItem("enigma_alert_highrisk", alertPrefs.highRisk ? "1" : "0");
  localStorage.setItem("enigma_alert_sound", alertPrefs.sound ? "1" : "0");
}

async function enableBrowserAlerts() {
  if (!window.Notification) {
    pushMessage("Browser notifications are not supported here", "error");
    return;
  }
  const permission = await window.Notification.requestPermission();
  if (permission === "granted") {
    pushMessage("Browser popup alerts enabled", "ok");
  } else {
    pushMessage("Browser popup alerts were blocked", "error");
  }
}

connectWalletButton?.addEventListener("click", connectWallet);
showScannerWorkspaceButton?.addEventListener("click", () => {
  setWorkspace("scanner");
});
showAgentWorkspaceButton?.addEventListener("click", () => {
  setWorkspace("agent");
});
showProfileWorkspaceButton?.addEventListener("click", () => {
  setWorkspace("profile");
});
refreshProfileWorkspaceButton?.addEventListener("click", async () => {
  if (!ensureWalletConnected("refresh profile workspace")) return;
  await loadProfileWorkspaceData({ force: true });
});
agentRunTestButton?.addEventListener("click", async () => {
  setButtonBusy(agentRunTestButton, true, "Running...");
  try {
    await startPaperLoop();
  } finally {
    setButtonBusy(agentRunTestButton, false);
  }
});
agentPreviewPlanButton?.addEventListener("click", async () => {
  await previewAgentMission();
});
agentClosePositionButton?.addEventListener("click", async () => {
  await closeAgentPosition();
});
agentEmergencyHaltButton?.addEventListener("click", async () => {
  await haltAgentMission();
});
agentRunLiveButton?.addEventListener("click", async () => {
  setButtonBusy(agentRunLiveButton, true, "Running...");
  try {
    await startEngineLoop();
  } finally {
    setButtonBusy(agentRunLiveButton, false);
  }
});
agentStopAllButton?.addEventListener("click", () => {
  setButtonBusy(agentStopAllButton, true, "Stopping...");
  stopPaperLoop();
  stopEngineLoop();
  pushMessage("All agent loops stopped.", "info");
  setTimeout(() => setButtonBusy(agentStopAllButton, false), 150);
});
tradeActivityClearButton?.addEventListener("click", () => {
  resetTradeActivity();
  pushMessage("Trade activity cleared.", "info");
});
agentSaveTargetButton?.addEventListener("click", () => {
  saveAgentTargetMint({ notify: true });
});
paperBudgetInput?.addEventListener("input", () => {
  updateAgentTradeState({
    budgetUsd: Number(paperBudgetInput.value || agentTradeState.budgetUsd || 100)
  });
});
agentAdvancedDrawer?.addEventListener("toggle", () => {
  updateAgentTradeState({
    advancedOpen: Boolean(agentAdvancedDrawer.open)
  });
});
agentTargetMintInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveAgentTargetMint({ notify: true });
  }
});
discoverTokensButton?.addEventListener("click", discoverSuggestions);
scanManualButton?.addEventListener("click", scanManualMint);
resultFilterSelect?.addEventListener("change", () => {
  renderSignals(lastSignalItems);
});
resultSortSelect?.addEventListener("change", () => {
  renderSignals(lastSignalItems);
});
applyProPresetButton?.addEventListener("click", () => {
  applyPreset(String(riskPresetSelect?.value || "balanced"));
});
thresholdFavorablePatternInput?.addEventListener("change", () => {
  alertThresholds.favorablePatternMin = Math.max(
    40,
    Math.min(95, Number(thresholdFavorablePatternInput.value || 72))
  );
  persistThresholds();
  syncThresholdUi();
});
thresholdRiskKillInput?.addEventListener("change", () => {
  alertThresholds.riskKillMax = Math.max(10, Math.min(90, Number(thresholdRiskKillInput.value || 50)));
  persistThresholds();
  syncThresholdUi();
});
thresholdConnectedMaxInput?.addEventListener("change", () => {
  alertThresholds.connectedMax = Math.max(
    5,
    Math.min(60, Number(thresholdConnectedMaxInput.value || 25))
  );
  persistThresholds();
  syncThresholdUi();
});
alertFavorableInput?.addEventListener("change", () => {
  alertPrefs.favorable = Boolean(alertFavorableInput.checked);
  persistAlertPrefs();
});
alertHighRiskInput?.addEventListener("change", () => {
  alertPrefs.highRisk = Boolean(alertHighRiskInput.checked);
  persistAlertPrefs();
});
alertSoundInput?.addEventListener("change", () => {
  alertPrefs.sound = Boolean(alertSoundInput.checked);
  persistAlertPrefs();
});
enableBrowserAlertsButton?.addEventListener("click", enableBrowserAlerts);
paperStartLoopButton?.addEventListener("click", async () => {
  await startPaperLoop();
});
paperStopLoopButton?.addEventListener("click", () => {
  stopPaperLoop();
  pushMessage("Test mode stopped", "info");
});
engineStartLoopButton?.addEventListener("click", async () => {
  await startEngineLoop();
});
engineStopLoopButton?.addEventListener("click", () => {
  stopEngineLoop();
  pushMessage("Live agent stopped", "info");
});
bindTradeConsoleControls();
applyTheme();
initBrandLogoAsset();
initSidebarVisualAssets();
initWorkspace();
setAuthState();
window.addEventListener("offline", () => {
  setNetworkStatus("Offline", "error");
  pushMessage("Browser is offline. Waiting for network to return.", "error");
});
window.addEventListener("online", () => {
  setNetworkStatus("Reconnecting...", "busy");
  if (authToken) {
    scheduleSessionReconnect("network restored");
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    startAgentPriceMonitor();
  } else {
    stopAgentPriceMonitor();
  }
});
syncAlertUi();
syncThresholdUi();
renderHeatmap([]);
renderAnalytics();
renderAlertFeed();
renderSessionTrend();
renderTradeActivityVisualization();
hydrateAgentTargetMintsFromStorage();
renderAgentPriceGraph();
renderAgentScannerSummary([]);
renderProfileWorkspacePlaceholder("Connect wallet to load profile and history.");
setPaperStatus("Idle");
if (engineSummary) engineSummary.textContent = "Engine idle.";
syncAgentTargetMintUi();
renderPaperSessionTiming();
renderAgentMissionConsole();
setAgentPriceStatus(agentTargetMint ? "Idle" : "Idle");
applySavedOperatingPreset();
applySavedPaperTestModel();
applyLivePreviewMode();
setNetworkStatus(navigator.onLine ? "Connected" : "Offline", navigator.onLine ? "ok" : "error");
startSpaceEntryAnimation();
hydrateSession();
pushMessage("Quick path: Connect Wallet -> Scan Random Token or run a Manual token scan.", "info");
pushMessage("Scanner Workspace is optimized for one-token analysis per action in this release.", "info");
pushMessage(
  "Set 1 Agent Token, define budget, trade amount, and check cadence, then click Run Test. AIG Core handles the internal paper-trading rules automatically.",
  "info"
);
if (PAPER_ONLY_MODE) {
  pushMessage("Paper-only mode enabled. Live execution is intentionally disabled.", "info");
}
pushMessage("Read Risk Analysis first. Trade Plan is guidance, not financial advice.", "info");
