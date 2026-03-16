import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createEnigmaContext } from "./agent/enigma.js";
import {
  AUTH_COOKIE_NAME,
  authRequired,
  enforceQuota,
  generateNonce,
  hydrateUser,
  issueToken,
  type AuthedRequest,
  verifyWalletSignature
} from "./server/auth.js";
import {
  adjustUserManagedBalance,
  closeAutoTradePosition,
  createAutoTradePosition,
  createWithdrawalRequest,
  consumeNonce,
  getPremiumPaymentBySignature,
  getUserManagedBalance,
  getUserByWallet,
  getAutoTradeConfig,
  getAutoTradeExecutionConfig,
  getAutoTradePerformance,
  getUsage,
  getDashboardStats,
  getWithdrawalRequestById,
  incrementUsage,
  listPremiumPaymentsByUser,
  listAutoTradeEvents,
  listAutoTradePositions,
  listWithdrawalRequests,
  putAutoTradeConfig,
  putAutoTradeExecutionConfig,
  putNonce,
  resolveForecast,
  resetAutoTradeRuns,
  savePremiumPayment,
  setUserManagedBalance,
  setUserPlanByWallet,
  saveAutoTradeRun,
  saveAutoTradeEvent,
  saveSignal,
  updateWithdrawalRequestStatus,
  updateAutoTradePositionMark,
} from "./server/db.js";
import {
  discoverNewSolanaMints,
  fetchRealtimeMarketSnapshot,
  generateSignal,
  isSolanaTrackedAsset,
  isSupportedTrackedAsset,
  normalizeTrackedAssetId
} from "./server/signalEngine.js";
import { executeSolTransfer, executeUltraBuy, executeUltraSell } from "./server/jupiterExecutor.js";
import { fetchCandlesFromBinanceSymbol, fetchCandlesFromGeckoTerminal } from "./server/candles.js";
import {
  chooseAdaptiveEntryTrigger,
  computeDynamicPositionSize,
  computePnlAttribution,
  deriveRegimePolicy,
  estimateSpreadBps,
  simulateExecutionFill
} from "./server/agentPolicy.js";
import {
  loadMissionWorkspaceSnapshot,
  loadMissionSessionSnapshot,
  listMissionWorkspaceSessions,
  subscribeMissionWorkspaceStream,
  syncMissionWorkspace
} from "./server/missionWorkspace.js";

function validateRuntimeConfig(): { mode: string; hasRpc: boolean } {
  const mode = String(process.env.NODE_ENV || "development");
  const hasRpc = Boolean(String(process.env.HELIUS_API_KEYS || "").trim()) ||
    Boolean(String(process.env.HELIUS_API_KEY || "").trim()) ||
    Boolean(String(process.env.SOLANA_RPC_URL || "").trim());

  if (!hasRpc && mode === "production") {
    throw new Error("Production requires HELIUS_API_KEY/HELIUS_API_KEYS or SOLANA_RPC_URL.");
  }

  if (!hasRpc) {
    console.warn("[config] HELIUS_API_KEY/HELIUS_API_KEYS/SOLANA_RPC_URL missing. RPC checks may fail.");
  }

  return { mode, hasRpc };
}

function getHeliusApiKeys(): string[] {
  return Array.from(
    new Set(
      [
        ...String(process.env.HELIUS_API_KEYS || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        String(process.env.HELIUS_API_KEY || "").trim()
      ].filter(Boolean)
    )
  );
}

function getHeliusRpcUrls(): string[] {
  return getHeliusApiKeys().map(
    (apiKey) => `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(apiKey)}`
  );
}

const runtimeConfig = validateRuntimeConfig();
const AUTH_COOKIE_SECURE = String(process.env.NODE_ENV || "development") === "production";
const PREMIUM_TELEGRAM = String(process.env.ENIGMA_PREMIUM_TELEGRAM || "@KOBECOIN_SUPPORT").trim();
const ADMIN_TOKEN = String(process.env.ENIGMA_ADMIN_TOKEN || "").trim();
const KOBX_MINT = "48iJcUv9jsiZ7cCisyVFLPFLMoNBKg3L43bRvktXpump";
const KOBX_REQUIRED_BALANCE = Math.max(
  0,
  Number(process.env.ENIGMA_KOBX_REQUIRED_BALANCE || 500_000)
);
const KOBX_HIGH_TIER_BALANCE = Math.max(
  KOBX_REQUIRED_BALANCE,
  Number(process.env.ENIGMA_KOBX_HIGH_TIER_BALANCE || 3_000_000)
);
const KOBX_BUY_URL = `https://pump.fun/coin/${KOBX_MINT}`;
const PREMIUM_SOL_ADDRESS = String(
  process.env.ENIGMA_PREMIUM_SOL_ADDRESS || "ZEe2kStwjE8SNs61Vcrdmn63JHxrKAEswNg5Nex3sVe"
).trim();
const PREMIUM_TIER_LAMPORTS: Record<string, number> = {
  pro1: Number(process.env.ENIGMA_PRO1_LAMPORTS || 500000000),
  pro2: Number(process.env.ENIGMA_PRO2_LAMPORTS || 2500000000),
  pro3: Number(process.env.ENIGMA_PRO3_LAMPORTS || 5000000000),
  pro4: Number(process.env.ENIGMA_PRO4_LAMPORTS || 25000000000)
};
const PAPER_ONLY_MODE = String(process.env.ENIGMA_PAPER_ONLY_MODE || "1").trim() !== "0";
const LIVE_EXECUTION_ENABLED = String(process.env.ENIGMA_EXECUTION_ENABLED || "").trim() === "1";
const INTERNAL_LIVE_WALLETS = new Set(
  String(process.env.ENIGMA_INTERNAL_LIVE_WALLETS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);
const REQUIRE_INTERNAL_LIVE_WALLET =
  String(process.env.ENIGMA_REQUIRE_INTERNAL_LIVE_WALLET || "1").trim() !== "0";
const REQUIRE_PER_WALLET_SIGNER =
  String(process.env.ENIGMA_REQUIRE_PER_WALLET_SIGNER || "1").trim() !== "0";

function parseTraderWalletRegistry(): Record<string, string> {
  const raw = String(process.env.ENIGMA_TRADER_WALLET_KEYS_JSON || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, string> = {};
    Object.entries(parsed || {}).forEach(([wallet, key]) => {
      const w = String(wallet || "").trim();
      const v = String(key || "").trim();
      if (!w || !v) return;
      out[w] = v;
    });
    return out;
  } catch {
    throw new Error("ENIGMA_TRADER_WALLET_KEYS_JSON must be valid JSON object {wallet: base58Secret}");
  }
}

const TRADER_WALLET_KEYS_REGISTRY = parseTraderWalletRegistry();

function hasAnyFallbackSigner(): boolean {
  return Boolean(String(process.env.ENIGMA_TRADER_PRIVATE_KEY || "").trim()) ||
    Boolean(String(process.env.ENIGMA_TRADER_PRIVATE_KEY_JSON || "").trim());
}

function hasSignerForWallet(wallet: string): boolean {
  const clean = String(wallet || "").trim();
  if (!clean) return false;
  if (String(TRADER_WALLET_KEYS_REGISTRY[clean] || "").trim()) return true;
  if (!REQUIRE_PER_WALLET_SIGNER && hasAnyFallbackSigner()) return true;
  return false;
}

const liveRuntimeErrors: string[] = [];
if (LIVE_EXECUTION_ENABLED && !PAPER_ONLY_MODE) {
  if (REQUIRE_INTERNAL_LIVE_WALLET && INTERNAL_LIVE_WALLETS.size === 0) {
    liveRuntimeErrors.push("ENIGMA_INTERNAL_LIVE_WALLETS is empty while internal-live gate is enabled.");
  }
  if (REQUIRE_PER_WALLET_SIGNER) {
    const missingSignerWallets = Array.from(INTERNAL_LIVE_WALLETS).filter((wallet) => !hasSignerForWallet(wallet));
    if (missingSignerWallets.length > 0) {
      liveRuntimeErrors.push(
        `Missing signer key mapping for internal wallets: ${missingSignerWallets.join(", ")}`
      );
    }
  } else if (!hasAnyFallbackSigner()) {
    liveRuntimeErrors.push("No trader signer configured. Set ENIGMA_TRADER_PRIVATE_KEY or *_JSON.");
  }
}

if (liveRuntimeErrors.length > 0) {
  throw new Error(`Live runtime config invalid: ${liveRuntimeErrors.join(" | ")}`);
}
const app = express();
app.set("trust proxy", 1);
const startPort = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const sourceDir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(sourceDir, "public");
const API_RATE_LIMIT_MAX = Math.max(120, Number(process.env.ENIGMA_API_RATE_LIMIT_MAX || 300));
const AUTOTRADE_RATE_LIMIT_MAX = Math.max(240, Number(process.env.ENIGMA_AUTOTRADE_RATE_LIMIT_MAX || 600));
const SCANNER_RATE_LIMIT_MAX = Math.max(300, Number(process.env.ENIGMA_SCANNER_RATE_LIMIT_MAX || 1500));
const MARKET_LIVE_RATE_LIMIT_MAX = Math.max(
  120,
  Number(process.env.ENIGMA_MARKET_LIVE_RATE_LIMIT_MAX || 600)
);
const MINT_PARSE_MAX_TOKENS = Math.max(3, Number(process.env.ENIGMA_MINT_PARSE_MAX_TOKENS || 16));

app.use(express.json());
app.use(express.static(publicDir));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // Keep scanner/general quota independent from high-frequency monitoring endpoints.
  skip: (req) =>
    req.path.startsWith("/autotrade") ||
    req.path.startsWith("/token/market/live") ||
    req.path === "/signal" ||
    req.path.startsWith("/discovery/suggest"),
  message: { error: "too many requests; slow down" }
});

app.use("/api", apiLimiter);

const autotradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: AUTOTRADE_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "autotrade rate limit exceeded; slow down loops" }
});

app.use("/api/autotrade", autotradeLimiter);

const scannerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: SCANNER_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "scanner rate limit exceeded; wait a few seconds and retry" }
});

app.use("/api/signal", scannerLimiter);
app.use("/api/discovery/suggest", scannerLimiter);

const marketLiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: MARKET_LIVE_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "market live rate limit exceeded; slow down polling" }
});

app.use("/api/token/market/live", marketLiveLimiter);

const USER_EXECUTION_LOCK_TTL_MS = Math.max(
  5000,
  Number(process.env.ENIGMA_USER_EXECUTION_LOCK_TTL_MS || 45000)
);
const SAFETY_MAX_TOTAL_EXPOSURE_USD = Math.max(
  10,
  Number(process.env.ENIGMA_SAFETY_MAX_TOTAL_EXPOSURE_USD || 500)
);
const SAFETY_MAX_DAILY_LOSS_USD = Math.max(
  1,
  Number(process.env.ENIGMA_SAFETY_MAX_DAILY_LOSS_USD || 100)
);
const SAFETY_MAX_HOURLY_LOSS_USD = Math.max(
  1,
  Number(process.env.ENIGMA_SAFETY_MAX_HOURLY_LOSS_USD || 35)
);
const SAFETY_MAX_TOKEN_DAILY_LOSS_USD = Math.max(
  1,
  Number(process.env.ENIGMA_SAFETY_MAX_TOKEN_DAILY_LOSS_USD || 20)
);
const SAFETY_MAX_TOKEN_HOURLY_LOSS_USD = Math.max(
  0.5,
  Number(process.env.ENIGMA_SAFETY_MAX_TOKEN_HOURLY_LOSS_USD || 8)
);
const SAFETY_MAX_LOSS_PER_TRADE_USD = Math.max(
  0.25,
  Number(process.env.ENIGMA_SAFETY_MAX_LOSS_PER_TRADE_USD || 2.5)
);
const SAFETY_LOSS_STREAK_THRESHOLD = Math.max(
  2,
  Number(process.env.ENIGMA_SAFETY_LOSS_STREAK_THRESHOLD || 3)
);
const SAFETY_LOSS_STREAK_PAUSE_SEC = Math.max(
  30,
  Number(process.env.ENIGMA_SAFETY_LOSS_STREAK_PAUSE_SEC || 600)
);
const SAFETY_EXIT_ON_HOSTILE_REGIME = String(
  process.env.ENIGMA_SAFETY_EXIT_ON_HOSTILE_REGIME || "1"
).trim() !== "0";
const SAFETY_ERROR_THRESHOLD = Math.max(
  1,
  Number(process.env.ENIGMA_SAFETY_ERROR_THRESHOLD || 3)
);
const SAFETY_ERROR_WINDOW_SEC = Math.max(
  30,
  Number(process.env.ENIGMA_SAFETY_ERROR_WINDOW_SEC || 600)
);
const SAFETY_PAUSE_SEC = Math.max(
  10,
  Number(process.env.ENIGMA_SAFETY_PAUSE_SEC || 300)
);
const SAFETY_MAX_DRAWDOWN_PCT = Math.max(
  1,
  Math.min(95, Number(process.env.ENIGMA_SAFETY_MAX_DRAWDOWN_PCT || 20))
);
const SAFETY_DRAWDOWN_PAUSE_SEC = Math.max(
  60,
  Number(process.env.ENIGMA_SAFETY_DRAWDOWN_PAUSE_SEC || 3600)
);
const GLOBAL_EMERGENCY_HALT = String(
  process.env.ENIGMA_GLOBAL_EMERGENCY_HALT || "0"
).trim() === "1";
const SELECTABLE_BUDGET_TIERS_USD = [50, 100, 200, 500, 1000] as const;
const ENTRY_TIMEOUT_SEC = Math.max(
  10,
  Number(process.env.ENIGMA_ENTRY_TIMEOUT_SEC || 90)
);
const ENTRY_TIMEOUT_MIN_SEC = Math.max(
  5,
  Number(process.env.ENIGMA_ENTRY_TIMEOUT_MIN_SEC || 15)
);
const ENTRY_TIMEOUT_MAX_SEC = Math.max(
  ENTRY_TIMEOUT_MIN_SEC,
  Number(process.env.ENIGMA_ENTRY_TIMEOUT_MAX_SEC || ENTRY_TIMEOUT_SEC)
);
const ENTRY_FALLBACK_MIN_CONFIDENCE = Math.max(
  0.1,
  Math.min(0.99, Number(process.env.ENIGMA_ENTRY_FALLBACK_MIN_CONFIDENCE || 0.35))
);
const ENTRY_FALLBACK_SIZE_MULTIPLIER = Math.max(
  0.1,
  Math.min(1, Number(process.env.ENIGMA_ENTRY_FALLBACK_SIZE_MULTIPLIER || 0.5))
);
const ENTRY_FALLBACK_CONFIDENCE_DECAY = Math.max(
  0,
  Math.min(0.2, Number(process.env.ENIGMA_ENTRY_FALLBACK_CONFIDENCE_DECAY || 0.05))
);
const ENTRY_FALLBACK_CONFIDENCE_FLOOR = Math.max(
  0.1,
  Math.min(0.95, Number(process.env.ENIGMA_ENTRY_FALLBACK_CONFIDENCE_FLOOR || 0.25))
);
const ENTRY_FALLBACK_SIZE_STEP = Math.max(
  0,
  Math.min(0.5, Number(process.env.ENIGMA_ENTRY_FALLBACK_SIZE_STEP || 0.1))
);
const ENTRY_FALLBACK_SIZE_MAX = Math.max(
  ENTRY_FALLBACK_SIZE_MULTIPLIER,
  Math.min(1, Number(process.env.ENIGMA_ENTRY_FALLBACK_SIZE_MAX || 0.9))
);
const ENTRY_BREAKOUT_5M_PCT = Math.max(
  0,
  Number(process.env.ENIGMA_ENTRY_BREAKOUT_5M_PCT || 0.9)
);
const BREAKEVEN_TRIGGER_PCT = Math.max(
  0.1,
  Number(process.env.ENIGMA_BREAKEVEN_TRIGGER_PCT || 1.2)
);
const BREAKEVEN_LOCK_PCT = Math.max(
  0,
  Number(process.env.ENIGMA_BREAKEVEN_LOCK_PCT || 0.15)
);
const autotradeRunLocks = new Map<number, number>();
const autotradeTickLocks = new Map<number, number>();
const autotradeMonitorLocks = new Map<number, number>();
type ExecutionSafetyState = {
  errorTimestamps: number[];
  pausedUntil: number;
  peakEquityUsd: number;
};

const userExecutionSafetyState = new Map<number, ExecutionSafetyState>();
const entryFallbackState = new Map<string, { startedAt: number; lastSeenAt: number; cycles: number }>();
const positionExecutionMeta = new Map<
  number,
  { entryReferencePriceUsd: number; entryFillCostUsd: number; expectedPnlPct: number }
>();
const livePriceCache = new Map<
  string,
  { priceUsd: number; updatedAt: number; market: Record<string, unknown> }
>();

function acquireUserExecutionLock(lockMap: Map<number, number>, userId: number): boolean {
  const now = Date.now();
  const startedAt = Number(lockMap.get(userId) || 0);
  if (startedAt > 0 && now - startedAt < USER_EXECUTION_LOCK_TTL_MS) {
    return false;
  }
  lockMap.set(userId, now);
  return true;
}

function releaseUserExecutionLock(lockMap: Map<number, number>, userId: number): void {
  lockMap.delete(userId);
}

function utcDayStartMs(nowMs = Date.now()): number {
  const d = new Date(nowMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function getOpenExposureUsd(userId: number): number {
  const openPositions = listAutoTradePositions(userId, "OPEN");
  return Number(
    openPositions.reduce((sum, position) => sum + Number(position.sizeUsd || 0), 0).toFixed(2)
  );
}

function getDailyRealizedLossUsd(userId: number, nowMs = Date.now()): number {
  const dayStart = utcDayStartMs(nowMs);
  const closedPositions = listAutoTradePositions(userId, "CLOSED");
  let lossUsd = 0;
  for (const position of closedPositions) {
    const closedAtMs = Date.parse(String(position.closed_at || ""));
    if (!Number.isFinite(closedAtMs) || closedAtMs < dayStart) continue;
    const pnlPct = Number(position.pnlPct || 0);
    if (pnlPct >= 0) continue;
    const sizeUsd = Number(position.sizeUsd || 0);
    lossUsd += sizeUsd * (Math.abs(pnlPct) / 100);
  }
  return Number(lossUsd.toFixed(2));
}

function getWindowRealizedLossUsd(userId: number, windowMs: number, nowMs = Date.now()): number {
  const cutoff = nowMs - windowMs;
  const closedPositions = listAutoTradePositions(userId, "CLOSED");
  let lossUsd = 0;
  for (const position of closedPositions) {
    const closedAtMs = Date.parse(String(position.closed_at || ""));
    if (!Number.isFinite(closedAtMs) || closedAtMs < cutoff) continue;
    const pnlPct = Number(position.pnlPct || 0);
    if (pnlPct >= 0) continue;
    const sizeUsd = Number(position.sizeUsd || 0);
    lossUsd += sizeUsd * (Math.abs(pnlPct) / 100);
  }
  return Number(lossUsd.toFixed(2));
}

function getTokenWindowRealizedLossUsd(
  userId: number,
  mint: string,
  windowMs: number,
  nowMs = Date.now()
): number {
  const key = String(mint || "").trim();
  if (!key) return 0;
  const cutoff = nowMs - windowMs;
  const closedPositions = listAutoTradePositions(userId, "CLOSED");
  let lossUsd = 0;
  for (const position of closedPositions) {
    if (String(position.mint || "") !== key) continue;
    const closedAtMs = Date.parse(String(position.closed_at || ""));
    if (!Number.isFinite(closedAtMs) || closedAtMs < cutoff) continue;
    const pnlPct = Number(position.pnlPct || 0);
    if (pnlPct >= 0) continue;
    const sizeUsd = Number(position.sizeUsd || 0);
    lossUsd += sizeUsd * (Math.abs(pnlPct) / 100);
  }
  return Number(lossUsd.toFixed(2));
}

function getConsecutiveLossStreak(userId: number, limit = 25): number {
  const closed = listAutoTradePositions(userId, "CLOSED").slice(0, limit);
  let streak = 0;
  for (const position of closed) {
    const pnlPct = Number(position.pnlPct || 0);
    if (pnlPct < 0) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function getExecutionSafetyState(userId: number): ExecutionSafetyState {
  const current = userExecutionSafetyState.get(userId);
  if (current) return current;
  const initial: ExecutionSafetyState = { errorTimestamps: [], pausedUntil: 0, peakEquityUsd: 0 };
  userExecutionSafetyState.set(userId, initial);
  return initial;
}

function pruneSafetyErrors(state: ExecutionSafetyState, nowMs = Date.now()): void {
  const cutoff = nowMs - SAFETY_ERROR_WINDOW_SEC * 1000;
  state.errorTimestamps = state.errorTimestamps.filter((ts) => ts >= cutoff);
}

function getRealizedPnlUsd(userId: number): number {
  const closedPositions = listAutoTradePositions(userId, "CLOSED");
  let realized = 0;
  for (const position of closedPositions) {
    const pnlPct = Number(position.pnlPct || 0);
    const sizeUsd = Number(position.sizeUsd || 0);
    if (!Number.isFinite(pnlPct) || !Number.isFinite(sizeUsd) || sizeUsd <= 0) continue;
    realized += sizeUsd * (pnlPct / 100);
  }
  return Number(realized.toFixed(2));
}

function getUnrealizedPnlUsd(userId: number): number {
  const openPositions = listAutoTradePositions(userId, "OPEN");
  let unrealized = 0;
  for (const position of openPositions) {
    const pnlPct = Number(position.pnlPct || 0);
    const sizeUsd = Number(position.sizeUsd || 0);
    if (!Number.isFinite(pnlPct) || !Number.isFinite(sizeUsd) || sizeUsd <= 0) continue;
    unrealized += sizeUsd * (pnlPct / 100);
  }
  return Number(unrealized.toFixed(2));
}

function getStrategyEquitySnapshot(
  userId: number,
  baselineUsd: number,
  safetyState: ExecutionSafetyState
): {
  baselineUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  currentEquityUsd: number;
  peakEquityUsd: number;
  drawdownPct: number;
} {
  const baseline = Number(Math.max(1, baselineUsd).toFixed(2));
  const realizedPnlUsd = getRealizedPnlUsd(userId);
  const unrealizedPnlUsd = getUnrealizedPnlUsd(userId);
  const currentEquityUsd = Number((baseline + realizedPnlUsd + unrealizedPnlUsd).toFixed(2));
  const previousPeak = Number(safetyState.peakEquityUsd || 0);
  const peakEquityUsd = Number(Math.max(baseline, previousPeak, currentEquityUsd).toFixed(2));
  safetyState.peakEquityUsd = peakEquityUsd;
  const drawdownPct = peakEquityUsd > 0
    ? Number((Math.max(0, (peakEquityUsd - currentEquityUsd) / peakEquityUsd) * 100).toFixed(2))
    : 0;

  return {
    baselineUsd: baseline,
    realizedPnlUsd,
    unrealizedPnlUsd,
    currentEquityUsd,
    peakEquityUsd,
    drawdownPct
  };
}

function recordExecutionError(userId: number): void {
  const nowMs = Date.now();
  const state = getExecutionSafetyState(userId);
  pruneSafetyErrors(state, nowMs);
  state.errorTimestamps.push(nowMs);
  if (state.errorTimestamps.length >= SAFETY_ERROR_THRESHOLD) {
    state.pausedUntil = nowMs + SAFETY_PAUSE_SEC * 1000;
  }
}

function recordExecutionSuccess(userId: number): void {
  const nowMs = Date.now();
  const state = getExecutionSafetyState(userId);
  pruneSafetyErrors(state, nowMs);
  if (state.pausedUntil && state.pausedUntil <= nowMs) {
    state.pausedUntil = 0;
  }
  state.errorTimestamps = [];
}

function persistAutoTradeActions(
  userId: number,
  mode: "paper" | "live",
  actions: Array<Record<string, unknown>>,
  baseMeta: Record<string, unknown> = {}
): void {
  if (!Array.isArray(actions) || !actions.length) return;
  actions.forEach((action) => {
    const eventType = String(action.type || "INFO").trim() || "INFO";
    const mintRaw = String(action.mint || "").trim();
    const txSignatureRaw = String(action.signature || action.txHash || "").trim();
    const closeReasonRaw = String(action.reason || "").trim();
    const positionIdRaw = Number(action.positionId || 0);
    const expectedPnlPct = Number(action.expectedPnlPct);
    const realizedAfterCostsPct = Number(action.realizedAfterCostsPct);
    const decisionId = `${eventType}:${mintRaw || "na"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    saveAutoTradeEvent({
      userId,
      mode,
      eventType,
      mint: mintRaw || null,
      positionId: Number.isFinite(positionIdRaw) && positionIdRaw > 0 ? positionIdRaw : null,
      decisionId,
      orderRequestId: null,
      txSignature: txSignatureRaw || null,
      closeReason: closeReasonRaw || null,
      realizedPnlPct: Number.isFinite(realizedAfterCostsPct)
        ? realizedAfterCostsPct
        : Number.isFinite(expectedPnlPct)
          ? expectedPnlPct
          : null,
      payload: {
        ...baseMeta,
        action
      }
    });
  });
}

function normalizeTsMs(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return Date.now();
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function entryFallbackKey(userId: number, mint: string): string {
  return `${userId}:${mint}`;
}

interface AutoTradeDecision {
  mint: string;
  decision: "BUY_CANDIDATE" | "SKIP";
  reasons: string[];
  signalId?: number;
  signalStatus?: string;
  patternScore?: number;
  confidence?: number;
  killSwitchScore?: number;
  connectedHolderPct?: number;
  tradePlan?: Record<string, unknown>;
  entryPriceUsd?: number;
  token?: {
    mint: string;
    symbol: string;
    name: string;
    imageUrl: string;
  };
  market?: {
    priceUsd: number;
    liquidityUsd?: number;
    volume24hUsd?: number;
    participation?: number;
    spreadBps?: number;
    priceChange5mPct?: number;
    priceChange1hPct?: number;
  };
  marketRegime?: {
    timeframe: string;
    regime: string;
    volatilityIndex: number | null;
    adx: number | null;
  };
  regimePolicy?: {
    style: "BREAKOUT" | "TREND" | "MEAN_REVERT" | "NO_TRADE";
    allowEntry: boolean;
    hostile: boolean;
    riskMultiplier: number;
    strategyHint: string;
    reason: string;
  };
}

function premiumRequiredResponse() {
  return {
    error: "live execution is premium-only",
    premiumRequired: true,
    telegram: PREMIUM_TELEGRAM,
    note: "Contact Telegram to upgrade your account to PRO for real transactions."
  };
}

function internalWalletRequiredResponse() {
  return {
    error: "live execution is currently enabled for internal wallets only",
    internalWalletRequired: true,
    note: "This rollout stage is restricted to approved internal wallets."
  };
}

function hasLiveExecutionAccess(userPlan: string): boolean {
  if (String(process.env.ENIGMA_ALLOW_FREE_LIVE || "").trim() === "1") {
    return true;
  }
  return userPlan === "pro";
}

function hasInternalLiveWalletAccess(wallet: string): boolean {
  if (!REQUIRE_INTERNAL_LIVE_WALLET) return true;
  if (INTERNAL_LIVE_WALLETS.size === 0) return false;
  return INTERNAL_LIVE_WALLETS.has(String(wallet || "").trim());
}

function getLiveEligibility(userPlan: string, wallet: string): { allowed: boolean; reason?: string } {
  if (!hasLiveExecutionAccess(userPlan)) {
    return { allowed: false, reason: "premium_required" };
  }
  if (!hasInternalLiveWalletAccess(wallet)) {
    return { allowed: false, reason: "internal_wallet_required" };
  }
  return { allowed: true };
}

function requireAdminToken(req: express.Request, res: express.Response): boolean {
  if (!ADMIN_TOKEN) {
    res.status(503).json({ error: "admin token is not configured" });
    return false;
  }

  const token = String(req.headers["x-admin-token"] || "").trim();
  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "invalid admin token" });
    return false;
  }

  return true;
}

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "KOBECOIN AI Guardian API",
    version: "1.0.0",
    description: "Trader risk-intelligence API for one-token scan, discovery, holder behavior, and paper-agent controls."
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Service health" } }
      }
    },
    "/api/auth/nonce": {
      post: {
        summary: "Create login nonce",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["wallet"], properties: { wallet: { type: "string" } } }
            }
          }
        },
        responses: { "200": { description: "Nonce created" } }
      }
    },
    "/api/auth/verify": {
      post: {
        summary: "Verify wallet signature and issue JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["wallet", "nonce", "signature"],
                properties: { wallet: { type: "string" }, nonce: { type: "string" }, signature: { type: "string" } }
              }
            }
          }
        },
        responses: { "200": { description: "JWT and user profile" } }
      }
    },
    "/api/auth/logout": {
      post: {
        summary: "Clear browser auth session cookie",
        responses: { "200": { description: "Logout successful" } }
      }
    },
    "/api/admin/users/plan": {
      post: {
        summary: "Admin plan update (free/pro) by wallet",
        parameters: [{ in: "header", name: "x-admin-token", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["wallet", "plan"],
                properties: {
                  wallet: { type: "string" },
                  plan: { type: "string", enum: ["free", "pro"] }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Updated user plan" } }
      }
    },
    "/api/admin/users/balance": {
      post: {
        summary: "Admin set user managed balance",
        parameters: [{ in: "header", name: "x-admin-token", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["wallet", "lamports"],
                properties: {
                  wallet: { type: "string" },
                  lamports: { type: "number" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Updated managed balance" } }
      }
    },
    "/api/admin/withdrawals": {
      get: {
        summary: "Admin list withdrawal requests",
        parameters: [
          { in: "header", name: "x-admin-token", required: true, schema: { type: "string" } },
          {
            in: "query",
            name: "status",
            required: false,
            schema: { type: "string", enum: ["pending", "approved", "rejected"] }
          },
          { in: "query", name: "limit", required: false, schema: { type: "number" } }
        ],
        responses: { "200": { description: "Withdrawal request list" } }
      }
    },
    "/api/admin/withdrawals/{id}/approve": {
      post: {
        summary: "Admin approve withdrawal request",
        parameters: [
          { in: "header", name: "x-admin-token", required: true, schema: { type: "string" } },
          { in: "path", name: "id", required: true, schema: { type: "number" } }
        ],
        responses: { "200": { description: "Approved withdrawal request" } }
      }
    },
    "/api/admin/withdrawals/{id}/reject": {
      post: {
        summary: "Admin reject withdrawal request",
        parameters: [
          { in: "header", name: "x-admin-token", required: true, schema: { type: "string" } },
          { in: "path", name: "id", required: true, schema: { type: "number" } }
        ],
        responses: { "200": { description: "Rejected withdrawal request" } }
      }
    },
    "/api/premium/info": {
      get: {
        summary: "Get premium payment address and tiers",
        responses: { "200": { description: "Premium payment instructions" } }
      }
    },
    "/api/premium/verify-payment": {
      post: {
        summary: "Verify on-chain premium payment and auto-upgrade to pro",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tier", "txSignature"],
                properties: {
                  tier: { type: "string", enum: ["pro1", "pro2", "pro3", "pro4"] },
                  txSignature: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Verification result and plan update" } }
      }
    },
    "/api/profile/overview": {
      get: {
        summary: "Get profile overview (plan, stats, managed balance)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile overview" } }
      }
    },
    "/api/profile/history": {
      get: {
        summary: "Get profile history (payments, positions, withdrawals)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile history" } }
      }
    },
    "/api/withdrawals/me": {
      get: {
        summary: "Get current user withdrawals and managed balance",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "User withdrawals and balance" } }
      }
    },
    "/api/withdrawals/request": {
      post: {
        summary: "Submit withdrawal request",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["lamports"],
                properties: {
                  destinationWallet: { type: "string" },
                  lamports: { type: "number" },
                  note: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Withdrawal request created" } }
      }
    },
    "/api/signal": {
      post: {
        summary: "Scan single mint",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["mint"], properties: { mint: { type: "string" } } }
            }
          }
        },
        responses: { "200": { description: "Signal payload" } }
      }
    },
    "/api/discovery/suggest": {
      post: {
        summary: "Discovery candidates",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { type: "object", properties: { limit: { type: "number" } } }
            }
          }
        },
        responses: { "200": { description: "Discovery signals" } }
      }
    },
    "/api/token/holders": {
      get: {
        summary: "Holder behavior table",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "mint", required: true, schema: { type: "string" } },
          { in: "query", name: "limit", required: false, schema: { type: "number" } }
        ],
        responses: { "200": { description: "Holder profiles and behavior" } }
      }
    },
    "/api/token/market/live": {
      get: {
        summary: "Get lightweight live market snapshot + chart points for a mint",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "mint", required: true, schema: { type: "string" } },
          { in: "query", name: "windowSec", required: false, schema: { type: "number" } }
        ],
        responses: { "200": { description: "Live market snapshot and trend points" } }
      }
    },
    "/api/dashboard/stats": {
      get: {
        summary: "Dashboard stats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Usage and performance stats" } }
      }
    },
    "/api/auth/me": {
      get: {
        summary: "Get authenticated user profile and stats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Authenticated user profile" } }
      }
    },
    "/api/forecast/resolve": {
      post: {
        summary: "Resolve signal outcome for feedback learning",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["signalId", "won", "pnlPct"],
                properties: {
                  signalId: { type: "number" },
                  won: { type: "boolean" },
                  pnlPct: { type: "number" },
                  note: { type: "string" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Forecast resolved" } }
      }
    },
    "/api/autotrade/config": {
      get: {
        summary: "Get autotrade policy config",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Autotrade config" } }
      },
      put: {
        summary: "Set autotrade policy config",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  mode: { type: "string", enum: ["paper", "live"] },
                  allowCautionEntries: { type: "boolean" },
                  allowHighRiskEntries: { type: "boolean" },
                  minPatternScore: { type: "number" },
                  minConfidence: { type: "number" },
                  maxConnectedHolderPct: { type: "number" },
                  requireKillSwitchPass: { type: "boolean" },
                  maxPositionUsd: { type: "number" },
                  scanIntervalSec: { type: "number" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Updated config" } }
      }
    },
    "/api/autotrade/run": {
      post: {
        summary: "Run autotrade policy against one agent token mint",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mint"],
                properties: {
                  mint: { type: "string" },
                  mints: { type: "string", description: "Deprecated alias for mint" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Autotrade run decisions" } }
      }
    },
    "/api/autotrade/performance": {
      get: {
        summary: "Get persistent paper/live autotrade run analytics",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "limit", required: false, schema: { type: "number" } }],
        responses: { "200": { description: "Autotrade performance summary and run history" } }
      }
    },
    "/api/autotrade/performance/reset": {
      post: {
        summary: "Reset persistent autotrade run analytics for a fresh test session",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  scope: { type: "string", enum: ["paper", "live", "all"] }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Autotrade run analytics reset complete" } }
      }
    },
    "/api/autotrade/execution-config": {
      get: {
        summary: "Get autotrade execution engine config",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Execution config" } }
      },
      put: {
        summary: "Set autotrade execution engine config",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  enabled: { type: "boolean" },
                  mode: { type: "string", enum: ["paper", "live"] },
                  paperBudgetUsd: { type: "number" },
                  tradeAmountUsd: { type: "number" },
                  maxOpenPositions: { type: "number" },
                  tpPct: { type: "number" },
                  slPct: { type: "number" },
                  trailingStopPct: { type: "number" },
                  maxHoldMinutes: { type: "number" },
                  cooldownSec: { type: "number" },
                  pollIntervalSec: { type: "number" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Updated execution config" } }
      }
    },
    "/api/autotrade/positions": {
      get: {
        summary: "List autotrade positions",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "status", required: false, schema: { type: "string" } }],
        responses: { "200": { description: "Current and historical positions" } }
      }
    },
    "/api/autotrade/monitor": {
      post: {
        summary: "Refresh open position prices for near real-time monitoring",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Updated open position marks and monitor ticks" } }
      }
    },
    "/api/autotrade/engine/tick": {
      post: {
        summary: "Run one auto-execution tick for one agent mint (supports layered entries up to maxOpenPositions)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mint"],
                properties: {
                  mint: { type: "string" },
                  mints: { type: "string", description: "Deprecated alias for mint" }
                }
              }
            }
          }
        },
        responses: { "200": { description: "Engine actions and position updates" } }
      }
    }
  }
};

app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

function parseMintsCsv(input: string, max = MINT_PARSE_MAX_TOKENS): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).slice(0, max);
}

function isValidSolanaMint(mint: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint.trim());
}

function normalizeTrackedAssets(values: string[], max = MINT_PARSE_MAX_TOKENS): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeTrackedAssetId(value))
        .filter(Boolean)
    )
  ).slice(0, max);
}

function validateMints(mints: string[]): string[] {
  return normalizeTrackedAssets(mints, MINT_PARSE_MAX_TOKENS);
}

function resolveSingleAgentMint(rawMint: string, rawMints: string): string {
  const mint = normalizeTrackedAssetId(rawMint.trim());
  if (mint) {
    return isSupportedTrackedAsset(mint) ? mint : "";
  }

  const candidates = parseMintsCsv(rawMints, 3);
  if (candidates.length !== 1) {
    return "";
  }

  const valid = validateMints(candidates);
  return valid.length === 1 ? valid[0] : "";
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeSelectableBudgetUsd(value: number, fallback = 100): number {
  const numeric = Number(value || 0);
  const fallbackNumeric = Number(fallback || 0);
  const fallbackTier = SELECTABLE_BUDGET_TIERS_USD.includes(
    fallbackNumeric as (typeof SELECTABLE_BUDGET_TIERS_USD)[number]
  )
    ? fallbackNumeric
    : 100;
  if (
    SELECTABLE_BUDGET_TIERS_USD.includes(
      numeric as (typeof SELECTABLE_BUDGET_TIERS_USD)[number]
    )
  ) {
    return numeric;
  }
  return fallbackTier;
}

function firstPositiveNumber(values: unknown[]): number {
  for (const value of values) {
    const n = Number(value || 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function getEffectiveTradeAmountUsd(
  policy: ReturnType<typeof getAutoTradeConfig>,
  execCfg: ReturnType<typeof getAutoTradeExecutionConfig>
): number {
  const policyCap = Number(policy.maxPositionUsd || 0);
  const execAmount = Number(execCfg.tradeAmountUsd || 0);
  if (policyCap > 0 && execAmount > 0) {
    return Number(Math.min(policyCap, execAmount).toFixed(2));
  }
  if (policyCap > 0) return Number(policyCap.toFixed(2));
  return Number(Math.max(1, execAmount).toFixed(2));
}

function getEffectiveMode(
  policy: ReturnType<typeof getAutoTradeConfig>,
  execCfg: ReturnType<typeof getAutoTradeExecutionConfig>,
  userPlan: string,
  wallet: string
): { mode: "paper" | "live"; warnings: string[] } {
  const warnings: string[] = [];
  if (policy.mode !== execCfg.mode) {
    warnings.push(`mode mismatch: policy=${policy.mode}, execution=${execCfg.mode}; using execution mode`);
  }

  const liveEligibility = getLiveEligibility(userPlan, wallet);
  if (execCfg.mode === "live" && !liveEligibility.allowed) {
    warnings.push(
      liveEligibility.reason === "internal_wallet_required"
        ? "live mode is currently restricted to approved internal wallets"
        : "live mode requires premium plan"
    );
  }

  if (execCfg.mode === "live" && liveEligibility.allowed) {
    return { mode: "live", warnings };
  }

  return { mode: "paper", warnings };
}

function buildAutoTradeDecision(input: {
  mint: string;
  signalId: number;
  signal: Record<string, unknown>;
  config: ReturnType<typeof getAutoTradeConfig>;
}): AutoTradeDecision {
  const status = String(input.signal.status || "CAUTION");
  const patternScore = Number(input.signal.patternScore || 0);
  const confidence = Number(input.signal.confidence || 0);
  const killSwitch = (input.signal.killSwitch as Record<string, unknown>) || {};
  const killVerdict = String(killSwitch.verdict || "BLOCK");
  const killRisk = (killSwitch.risk as Record<string, unknown>) || {};
  const holderBehavior =
    (killRisk.holderBehavior as Record<string, unknown>) ||
    (input.signal.holderBehavior as Record<string, unknown>) ||
    {};
  const connectedPct = Number(holderBehavior.connectedHolderPct || 0);
  const token = (input.signal.token as Record<string, unknown>) || {};
  const market = (input.signal.market as Record<string, unknown>) || {};
  const marketRegime = (input.signal.marketRegime as Record<string, unknown>) || {};
  const marketRegimeCurrent = (marketRegime.current as Record<string, unknown>) || {};
  const tradePlan = (input.signal.tradePlan as Record<string, unknown>) || {};
  const liquidityUsd = Number(market.liquidityUsd || 0);
  const volume24hUsd = Number(market.volume24hUsd || 0);
  const participation = volume24hUsd / Math.max(1, liquidityUsd);
  const spreadBps =
    Number(market.estimatedSpreadBps || 0) > 0
      ? Number(market.estimatedSpreadBps)
      : estimateSpreadBps(liquidityUsd, volume24hUsd);
  const adx = Number.isFinite(Number(marketRegimeCurrent.adx))
    ? Number(marketRegimeCurrent.adx)
    : null;
  const volatilityIndex = Number.isFinite(Number(marketRegimeCurrent.volatilityIndex))
    ? Number(marketRegimeCurrent.volatilityIndex)
    : null;
  const regimePolicy = deriveRegimePolicy({
    adx,
    volatilityIndex,
    liquidityUsd,
    participation,
    connectedHolderPct: connectedPct,
    spreadBps
  });
  const reasons: string[] = [];

  if (status === "HIGH_RISK" && !input.config.allowHighRiskEntries) {
    reasons.push(`status=${status} (blocked)`);
  } else if (status === "CAUTION" && !input.config.allowCautionEntries) {
    reasons.push("status=CAUTION (requires FAVORABLE unless caution entries are enabled)");
  } else if (status !== "FAVORABLE" && status !== "CAUTION" && status !== "HIGH_RISK") {
    reasons.push(`status=${status} (unsupported for entries)`);
  }
  if (patternScore < input.config.minPatternScore) {
    reasons.push(`patternScore ${patternScore.toFixed(2)} < ${input.config.minPatternScore}`);
  }
  if (confidence < input.config.minConfidence) {
    reasons.push(`confidence ${confidence.toFixed(2)} < ${input.config.minConfidence}`);
  }
  if (connectedPct > input.config.maxConnectedHolderPct) {
    reasons.push(
      `connectedHolderPct ${connectedPct.toFixed(2)} > ${input.config.maxConnectedHolderPct}`
    );
  }
  if (input.config.requireKillSwitchPass && killVerdict !== "PASS") {
    reasons.push(`killSwitch verdict=${killVerdict} (requires PASS)`);
  }
  if (!regimePolicy.allowEntry) {
    reasons.push(`regimePolicy=${regimePolicy.style} (${regimePolicy.reason})`);
  }

  const decision: AutoTradeDecision = {
    mint: input.mint,
    decision: reasons.length === 0 ? "BUY_CANDIDATE" : "SKIP",
    reasons,
    signalId: input.signalId,
    signalStatus: status,
    patternScore: Number(patternScore.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    killSwitchScore: Number.isFinite(Number(killSwitch.score)) ? Number(killSwitch.score) : 0,
    connectedHolderPct: Number(connectedPct.toFixed(2)),
    tradePlan,
    token: {
      mint: String(token.mint || input.mint),
      symbol: String(token.symbol || ""),
      name: String(token.name || "Unknown Token"),
      imageUrl: String(token.imageUrl || "")
    },
    market: {
      priceUsd: Number(market.priceUsd || 0),
      liquidityUsd,
      volume24hUsd,
      participation: Number(participation.toFixed(4)),
      spreadBps: Number(spreadBps.toFixed(2)),
      priceChange5mPct: Number(market.priceChange5mPct || 0),
      priceChange1hPct: Number(market.priceChange1hPct || 0)
    },
    marketRegime: {
      timeframe: String(marketRegimeCurrent.timeframe || marketRegime.preferredTimeframe || "1h"),
      regime: String(marketRegimeCurrent.regime || "Unavailable"),
      volatilityIndex,
      adx
    },
    regimePolicy
  };

  if (decision.decision === "BUY_CANDIDATE") {
    decision.reasons.push("all policy gates passed");
  }

  return decision;
}

function resolveAdaptiveEntryTimeoutSec(
  execCfg: ReturnType<typeof getAutoTradeExecutionConfig>,
  decision?: AutoTradeDecision
): number {
  // Fast modes (short checks / scalp settings) should not wait long for pullbacks.
  const checkInterval = Math.max(1, Number(execCfg.pollIntervalSec || 15));
  let timeout = clampNumber(checkInterval * 3, ENTRY_TIMEOUT_MIN_SEC, ENTRY_TIMEOUT_MAX_SEC);

  const vol = Number(decision?.marketRegime?.volatilityIndex ?? NaN);
  const adx = Number(decision?.marketRegime?.adx ?? NaN);
  if (Number.isFinite(vol) && vol >= 70) timeout *= 0.65;
  if (Number.isFinite(vol) && vol > 0 && vol <= 35) timeout *= 1.2;
  if (Number.isFinite(adx) && adx >= 35) timeout *= 0.8;

  if (Number(execCfg.cooldownSec || 0) <= 12 || Number(execCfg.tpPct || 0) <= 5) {
    timeout *= 0.75;
  }

  return Math.round(clampNumber(timeout, ENTRY_TIMEOUT_MIN_SEC, ENTRY_TIMEOUT_MAX_SEC));
}

function resolveAdaptiveExitPercents(
  execCfg: ReturnType<typeof getAutoTradeExecutionConfig>,
  decision?: AutoTradeDecision
): { tpPct: number; slPct: number; trailingStopPct: number } {
  let tpPct = Math.max(0.2, Number(execCfg.tpPct || 8));
  let slPct = Math.max(0.2, Number(execCfg.slPct || 4));
  let trailingStopPct = Math.max(0.2, Number(execCfg.trailingStopPct || 3));
  const vol = Number(decision?.marketRegime?.volatilityIndex ?? NaN);
  const adx = Number(decision?.marketRegime?.adx ?? NaN);

  // Keep exits adaptive to current regime: tighter in quiet ranges, wider in trend expansions.
  if (Number.isFinite(adx) && adx >= 25 && Number.isFinite(vol) && vol >= 60) {
    tpPct *= 1.2;
    slPct *= 1.1;
    trailingStopPct *= 1.15;
  } else if (Number.isFinite(adx) && adx < 20 && Number.isFinite(vol) && vol < 40) {
    tpPct *= 0.85;
    slPct *= 0.85;
    trailingStopPct *= 0.8;
  }

  tpPct = Number(clampNumber(tpPct, 0.2, 60).toFixed(2));
  slPct = Number(clampNumber(slPct, 0.2, 40).toFixed(2));
  trailingStopPct = Number(clampNumber(trailingStopPct, 0.2, 30).toFixed(2));
  return { tpPct, slPct, trailingStopPct };
}

function projectDecisionPnlPct(patternScore: number, confidence: number): number {
  const edge = confidence * 0.7 + (patternScore / 100) * 0.3;
  return Number(((edge - 0.55) * 18).toFixed(2));
}

async function rpcCall(method: string, params: unknown[]): Promise<Record<string, unknown>> {
  const rpcUrls = Array.from(
    new Set(
      [
        String(process.env.SOLANA_RPC_URL || "").trim(),
        ...getHeliusRpcUrls()
      ].filter(Boolean)
    )
  );
  if (!rpcUrls.length) {
    throw new Error("SOLANA_RPC_URL or HELIUS_API_KEY/HELIUS_API_KEYS is required for premium payment verification");
  }

  let lastError: Error | null = null;
  for (const rpcUrl of rpcUrls) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok || payload.error) {
        throw new Error(`RPC ${method} failed`);
      }
      return payload;
    } catch (error) {
      lastError = error as Error;
    }
  }
  throw lastError || new Error(`RPC ${method} failed`);
}

async function getWalletTokenBalance(wallet: string, mint: string): Promise<number> {
  const payload = await rpcCall("getTokenAccountsByOwner", [
    wallet,
    { mint },
    { encoding: "jsonParsed", commitment: "confirmed" }
  ]);
  const result = (payload.result as Record<string, unknown>) || {};
  const value = Array.isArray(result.value) ? result.value : [];
  const total = value.reduce((sum, entry) => {
    const account = (entry as Record<string, unknown>).account as Record<string, unknown>;
    const data = (account?.data as Record<string, unknown>) || {};
    const parsed = (data.parsed as Record<string, unknown>) || {};
    const info = (parsed.info as Record<string, unknown>) || {};
    const tokenAmount = (info.tokenAmount as Record<string, unknown>) || {};
    const uiAmountString = String(tokenAmount.uiAmountString || "").trim();
    const uiAmount = Number(uiAmountString || tokenAmount.uiAmount || 0);
    return sum + (Number.isFinite(uiAmount) ? uiAmount : 0);
  }, 0);
  return Number(total.toFixed(6));
}

async function getKobxAccessStatus(wallet: string): Promise<{
  mint: string;
  requiredBalance: number;
  actualBalance: number;
  eligible: boolean;
  buyUrl: string;
  scannerDailyLimit: number;
  scannerDailyUsed: number;
  scannerDailyRemaining: number;
  scannerTier: "none" | "base" | "high";
}> {
  if (KOBX_REQUIRED_BALANCE <= 0) {
    const syntheticLimit = 999_999;
    return {
      mint: KOBX_MINT,
      requiredBalance: 0,
      actualBalance: 0,
      eligible: true,
      buyUrl: KOBX_BUY_URL,
      scannerDailyLimit: syntheticLimit,
      scannerDailyUsed: 0,
      scannerDailyRemaining: syntheticLimit,
      scannerTier: "high"
    };
  }

  const actualBalance = await getWalletTokenBalance(wallet, KOBX_MINT);
  const tier = actualBalance >= KOBX_HIGH_TIER_BALANCE ? "high" : actualBalance >= KOBX_REQUIRED_BALANCE ? "base" : "none";
  return {
    mint: KOBX_MINT,
    requiredBalance: KOBX_REQUIRED_BALANCE,
    actualBalance,
    eligible: actualBalance >= KOBX_REQUIRED_BALANCE,
    buyUrl: KOBX_BUY_URL
    ,
    scannerDailyLimit: tier === "high" ? 5 : tier === "base" ? 2 : 0,
    scannerDailyUsed: 0,
    scannerDailyRemaining: tier === "high" ? 5 : tier === "base" ? 2 : 0,
    scannerTier: tier
  };
}

function enrichScannerQuota(access: Awaited<ReturnType<typeof getKobxAccessStatus>>, usage: { scanner_calls?: number }) {
  const used = Number(usage?.scanner_calls || 0);
  const limit = Number(access.scannerDailyLimit || 0);
  return {
    ...access,
    scannerDailyUsed: used,
    scannerDailyRemaining: Math.max(0, limit - used)
  };
}

async function buildScannerAccessStatus(userId: number, wallet: string) {
  try {
    const access = await getKobxAccessStatus(wallet);
    return enrichScannerQuota(access, getUsage(userId));
  } catch {
    return enrichScannerQuota(
      {
        mint: KOBX_MINT,
        requiredBalance: KOBX_REQUIRED_BALANCE,
        actualBalance: 0,
        eligible: false,
        buyUrl: KOBX_BUY_URL,
        scannerDailyLimit: 0,
        scannerDailyUsed: 0,
        scannerDailyRemaining: 0,
        scannerTier: "none"
      },
      getUsage(userId)
    );
  }
}

async function enforceScannerDailyLimit(req: AuthedRequest, res: express.Response): Promise<{
  ok: boolean;
  access?: Awaited<ReturnType<typeof buildScannerAccessStatus>>;
}> {
  if (!req.user) {
    res.status(401).json({ error: "unauthorized" });
    return { ok: false };
  }
  const access = await buildScannerAccessStatus(req.user.id, req.user.wallet);
  if (!access.eligible) {
    res.status(403).json({
      error: "KOBX balance requirement not met",
      code: "KOBX_REQUIRED",
      ...access
    });
    return { ok: false };
  }
  if (access.scannerDailyRemaining <= 0) {
    res.status(429).json({
      error: "daily scanner limit reached for current KOBX balance tier",
      code: "SCANNER_LIMIT_REACHED",
      ...access,
      hint: access.scannerTier === "base"
        ? "Hold 3,000,000+ KOBX to unlock 5 scans/day, or wait for daily reset."
        : "Wait for daily reset to scan again."
    });
    return { ok: false };
  }
  return { ok: true, access };
}

function extractTransferRecordsToAddress(
  tx: Record<string, unknown>,
  targetAddress: string
): Array<{ source: string; lamports: number }> {
  const txResult = (tx.result as Record<string, unknown>) || {};
  const transaction = (txResult.transaction as Record<string, unknown>) || {};
  const message = (transaction.message as Record<string, unknown>) || {};
  const instructions = Array.isArray(message.instructions) ? message.instructions : [];

  const transfers: Array<{ source: string; lamports: number }> = [];
  for (const raw of instructions) {
    const ix = (raw as Record<string, unknown>) || {};
    const parsed = (ix.parsed as Record<string, unknown>) || {};
    const ixType = String(parsed.type || "");
    if (ixType !== "transfer") continue;
    const info = (parsed.info as Record<string, unknown>) || {};
    const destination = String(info.destination || "");
    if (destination !== targetAddress) continue;
    transfers.push({
      source: String(info.source || ""),
      lamports: Number(info.lamports || 0)
    });
  }

  return transfers;
}

function minutesSince(ts: string): number {
  const opened = Date.parse(ts);
  if (!Number.isFinite(opened)) return 0;
  return (Date.now() - opened) / 60000;
}

async function evaluateAutoTradeDecisions(
  userId: number,
  mints: string[],
  config: ReturnType<typeof getAutoTradeConfig>
): Promise<Array<{ ok: boolean } & AutoTradeDecision>> {
  const generated = await Promise.allSettled(
    mints.map(async (mint) => {
      const built = await buildStoredSignal(userId, mint);
      const market = (built.signal.market as Record<string, unknown>) || {};
      return {
        ...buildAutoTradeDecision({ mint, signalId: built.signalId, signal: built.signal, config }),
        entryPriceUsd: Number(market.priceUsd || 0)
      };
    })
  );

  return generated.map((entry, idx) => {
    if (entry.status === "fulfilled") {
      return { ok: true, ...entry.value };
    }

    return {
      ok: false,
      mint: mints[idx],
      decision: "SKIP",
      reasons: [
        entry.reason instanceof Error ? entry.reason.message : "signal generation failed during autotrade run"
      ]
    };
  });
}

async function buildStoredSignal(userId: number, mint: string): Promise<{ signalId: number; signal: Record<string, unknown> }> {
  const context = await createEnigmaContext();
  const signal = await generateSignal(context, mint);

  const signalRecord = signal as Record<string, unknown>;
  const kill = signal.killSwitch as Record<string, unknown>;

  const signalId = saveSignal({
    userId,
    mint,
    action: String(signalRecord.status || "SCAN"),
    confidence: Number(signalRecord.confidence || 0),
    verdict: String(kill.verdict || ""),
    score: Number(kill.score || 0),
    reasoning: ((signalRecord.reasons as string[]) || []).join(" | "),
    snapshotJson: JSON.stringify(signal),
    source: String((signalRecord.market as Record<string, unknown>)?.source || "unknown")
  });

  return { signalId, signal };
}

const missionWorkerLoops = new Map<string, NodeJS.Timeout>();
const missionWorkerHeartbeats = new Map<string, string>();

function missionWorkerKey(userId: number, workspaceId: string, sessionId: string) {
  return `${userId}:${workspaceId}:${sessionId}`;
}

function formatMissionUsd(value: number) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function createServerMissionActivity(
  title: string,
  message: string,
  tone: "info" | "ok" | "error" = "info",
  meta = "",
  ts = new Date().toISOString(),
  eventType = "activity",
  details: Record<string, unknown> = {}
) {
  return { ts, title, message, tone, meta, eventType, ...details };
}

function normalizeMissionStatus(value: string) {
  const raw = String(value || "").trim().toUpperCase();
  return raw || "SCANNING";
}

function firstPositiveRuntimeValue(...values: unknown[]) {
  for (const value of values) {
    const num = Number(value || 0);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
}

function buildMissionQuote(decision: AutoTradeDecision | null, budgetUsd: number) {
  const tradePlan = (decision?.tradePlan || {}) as Record<string, unknown>;
  const buyZone = (tradePlan.buyZone as Record<string, unknown>) || {};
  const entryLow = firstPositiveRuntimeValue(buyZone.low);
  const entryHigh = firstPositiveRuntimeValue(buyZone.high, entryLow);
  const entryMid =
    entryLow && entryHigh ? Number(((entryLow + entryHigh) / 2).toFixed(12)) : firstPositiveRuntimeValue(entryLow, entryHigh);
  return {
    budgetUsd: Number(budgetUsd || 0),
    entryLow,
    entryHigh,
    entryMid,
    takeProfit: firstPositiveRuntimeValue(
      Array.isArray(tradePlan.resistance) ? tradePlan.resistance[0] : tradePlan.resistance
    ),
    stopLoss: firstPositiveRuntimeValue(tradePlan.stopLoss),
    holdHorizon: decision?.marketRegime?.timeframe
      ? `${String(decision.marketRegime.timeframe)} horizon`
      : "Adaptive hold horizon"
  };
}

function createServerOpenClawWorkspaceArtifacts(
  workspaceId: string,
  mission: Record<string, unknown>
): Record<string, string> {
  const thesis = (mission.thesis as Record<string, unknown>) || {};
  const executionTrace = (mission.executionTrace as Record<string, unknown>) || {};
  const livePosition = mission.livePosition || null;
  const activity = Array.isArray(mission.activity) ? mission.activity : [];
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
      `Status: ${String(thesis.status || "SCANNING")}`,
      `Confidence: ${Math.round(Number(thesis.confidence || 0) * 100)}%`,
      `Risk posture: ${String(thesis.riskPosture || "Standby")}`,
      "",
      String(thesis.summary || "No thesis recorded yet."),
      "",
      ...(Array.isArray(thesis.reasons) ? thesis.reasons.map((reason) => `- ${String(reason)}`) : [])
    ].join("\n"),
    "STATE.json": JSON.stringify(
      {
        workspaceId,
        missionStatus: String(mission.missionStatus || "scanning"),
        provider: "openclaw",
        sessionId: String(mission.sessionId || ""),
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

function createServerOpenClawThesis(input: {
  workspaceId: string;
  signal: Record<string, unknown> | null;
  decision: AutoTradeDecision | null;
  quote: ReturnType<typeof buildMissionQuote> | null;
  position: Record<string, unknown> | null;
}) {
  const signal = input.signal || {};
  const decision = input.decision;
  const status = normalizeMissionStatus(String(signal.status || decision?.signalStatus || "SCANNING"));
  const confidence = Math.max(
    0,
    Math.min(
      1,
      Number(signal.confidence ?? decision?.confidence ?? ((signal.killSwitch as Record<string, unknown>) || {}).confidence ?? 0)
    )
  );
  const market = ((signal.market as Record<string, unknown>) || {}) as Record<string, unknown>;
  const holderProfile = ((signal.holderProfile as Record<string, unknown>) || {}) as Record<string, unknown>;
  const connected = Number(holderProfile.connectedPct || 0);
  const newWallets = Number(holderProfile.newWalletPct || 0);
  const bundleRisk = Number(signal.bundleRiskScore || 0);
  const buys = Number((market.flow24h as Record<string, unknown>)?.buys || 0);
  const sells = Number((market.flow24h as Record<string, unknown>)?.sells || 0);
  const reasons = [
    status === "FAVORABLE"
      ? "OpenClaw sees constructive structure and can request guarded execution."
      : status === "CAUTION"
        ? "OpenClaw sees partial confirmation and keeps the mission selective."
        : "OpenClaw sees elevated risk and keeps the mission in observation mode.",
    `Order flow reads ${buys} buys vs ${sells} sells in the latest 24h sample.`,
    `Connected holders ${connected.toFixed(1)}% | new wallets ${newWallets.toFixed(1)}% | bundle risk ${bundleRisk.toFixed(1)}.`,
    market.priceUsd ? `Spot ${formatMissionUsd(Number(market.priceUsd || 0))} | liquidity ${formatMissionUsd(Number(market.liquidityUsd || 0))}.` : ""
  ].filter(Boolean);
  return {
    token: signal.token || null,
    mint: input.workspaceId,
    status,
    confidence,
    patternScore: Number(signal.patternScore || decision?.patternScore || 0),
    riskPosture:
      bundleRisk >= 55 || connected >= 30
        ? "Defensive"
        : status === "FAVORABLE"
          ? "Constructive"
          : status === "CAUTION"
            ? "Guarded"
            : "Standby",
    actionIntent:
      input.position
        ? "Manage active position"
        : decision?.decision === "BUY_CANDIDATE"
          ? "Request guarded execution"
          : status === "CAUTION"
            ? "Preview and wait for confirmation"
            : "Stand down",
    executionPosture: input.position ? "Monitoring guarded execution" : "OpenClaw planned / guarded execution",
    summary: input.position ? "OpenClaw is actively supervising a live guarded position." : reasons[0] || "OpenClaw is evaluating the mission.",
    reasons,
    note:
      input.position
        ? "Position is live. OpenClaw keeps adjusting around runtime feedback and market structure."
        : status === "FAVORABLE"
          ? "OpenClaw sees enough structure to request guarded execution."
          : status === "CAUTION"
            ? "OpenClaw keeps the thesis live but execution stays selective."
            : "OpenClaw keeps the token under review and avoids weak structure.",
    priceUsd: Number(market.priceUsd || 0),
    entryLow: input.quote?.entryLow || null,
    entryHigh: input.quote?.entryHigh || null,
    stopLoss: input.quote?.stopLoss || null,
    takeProfit: input.quote?.takeProfit || null,
    holdHorizon: input.quote?.holdHorizon || "Adaptive hold horizon"
  };
}

function buildServerMissionModel(input: {
  workspaceId: string;
  sessionId?: string | null;
  missionStatus: string;
  signal: Record<string, unknown> | null;
  decision: AutoTradeDecision | null;
  quote: ReturnType<typeof buildMissionQuote> | null;
  livePosition: Record<string, unknown> | null;
  executionTrace?: Record<string, unknown>;
  activity?: Array<Record<string, unknown>>;
}) {
  return {
    provider: "openclaw",
    providerLabel: "OpenClaw Mission Adapter",
    workspaceFiles: ["SOUL.md", "USER.md", "THESIS.md", "STATE.json", "POSITIONS.json", "EXECUTIONS.json"],
    workspaceArtifacts: {},
    sessionId: input.sessionId || null,
    missionStatus: input.missionStatus,
    thesis: createServerOpenClawThesis({
      workspaceId: input.workspaceId,
      signal: input.signal,
      decision: input.decision,
      quote: input.quote,
      position: input.livePosition
    }),
    rawSignal: input.signal,
    livePosition: input.livePosition || null,
    activity: Array.isArray(input.activity) ? input.activity.slice(0, 40) : [],
    executionTrace: {
      previewState: "Not started",
      submitted: "-",
      txHash: "-",
      filledAmount: null,
      averageEntry: input.quote?.entryMid ?? null,
      stopLoss: input.quote?.stopLoss ?? null,
      takeProfit: input.quote?.takeProfit ?? null,
      holdHorizon: input.quote?.holdHorizon || null,
      currentPnlPct: null,
      ...(input.executionTrace || {})
    }
  };
}

async function syncServerMissionState(input: {
  userId: number;
  workspaceId: string;
  sessionId?: string | null;
  budgetUsd?: number;
  mission: Record<string, unknown>;
  ensureSession?: boolean;
}) {
  return syncMissionWorkspace({
    userId: input.userId,
    workspaceId: input.workspaceId,
    provider: "openclaw",
    budgetUsd: Number(input.budgetUsd || input.mission.budgetUsd || 0),
    sessionId: input.sessionId || String(input.mission.sessionId || "").trim() || null,
    ensureSession: Boolean(input.ensureSession),
    mission: input.mission,
    workspaceArtifacts: createServerOpenClawWorkspaceArtifacts(input.workspaceId, input.mission)
  });
}

async function previewOpenClawMissionForUser(user: { id: number }, workspaceId: string, budgetUsd: number) {
  const { signalId, signal } = await buildStoredSignal(user.id, workspaceId);
  const config = getAutoTradeConfig(user.id);
  const decision = buildAutoTradeDecision({
    mint: workspaceId,
    signalId,
    signal,
    config
  });
  const quote = buildMissionQuote(decision, budgetUsd);
  const mission = buildServerMissionModel({
    workspaceId,
    missionStatus: "planning",
    signal,
    decision,
    quote,
    livePosition: null,
    activity: [
      createServerMissionActivity("Mission Initialized", "OpenClaw loaded workspace context and budget.", "info", `${budgetUsd.toFixed(2)} USD`, new Date().toISOString(), "mission_initialized"),
      createServerMissionActivity("Thesis Updated", "OpenClaw synthesized a fresh token thesis from live market and risk signals.", "info", String(decision.signalStatus || "SCANNING"), new Date().toISOString(), "thesis_updated"),
      createServerMissionActivity("Confidence Revised", "OpenClaw recalibrated confidence after reading structure, liquidity, and holder pressure.", "info", `${Math.round(Number(decision.confidence || 0) * 100)}%`, new Date().toISOString(), "confidence_revised"),
      createServerMissionActivity("Preview Requested", "OpenClaw prepared a guarded execution outline and wrote mission artifacts.", "info", workspaceId, new Date().toISOString(), "preview_requested")
    ],
    executionTrace: {
      previewState: "OpenClaw mission preview ready",
      submitted: "Awaiting Let AI Trade",
      filledAmount: budgetUsd,
      averageEntry: quote.entryMid,
      stopLoss: quote.stopLoss,
      takeProfit: quote.takeProfit,
      holdHorizon: quote.holdHorizon
    }
  });
  const snapshot = await syncServerMissionState({
    userId: user.id,
    workspaceId,
    budgetUsd,
    mission
  });
  return { snapshot, signal, signalId, decision, quote };
}

function stopMissionWorkerLoop(userId: number, workspaceId: string, sessionId: string) {
  const key = missionWorkerKey(userId, workspaceId, sessionId);
  const timer = missionWorkerLoops.get(key);
  if (timer) {
    clearInterval(timer);
    missionWorkerLoops.delete(key);
  }
  missionWorkerHeartbeats.delete(key);
}

async function monitorOpenClawMissionSession(user: { id: number }, workspaceId: string, sessionId: string) {
  const heartbeatTs = new Date().toISOString();
  missionWorkerHeartbeats.set(missionWorkerKey(user.id, workspaceId, sessionId), heartbeatTs);
  const snapshot = loadMissionWorkspaceSnapshot(user.id, workspaceId);
  if (!snapshot.mission || snapshot.sessionId !== sessionId) {
    stopMissionWorkerLoop(user.id, workspaceId, sessionId);
    return;
  }
  const open = listAutoTradePositions(user.id, "OPEN").find((position) => position.mint === workspaceId) || null;
  let livePosition = open;
  if (open) {
    const market = await fetchRealtimeMarketSnapshot(workspaceId);
    const markPriceUsd = Number(market?.priceUsd || open.lastPriceUsd || open.entryPriceUsd || 0);
    if (Number.isFinite(markPriceUsd) && markPriceUsd > 0) {
      livePosition = updateAutoTradePositionMark(user.id, open.id, markPriceUsd) || open;
    }
  }
  const previousMission = (snapshot.mission || {}) as Record<string, unknown>;
  const previousExecutionTrace = ((previousMission.executionTrace as Record<string, unknown>) || {});
  const missionStatus = livePosition ? "monitoring" : previousMission.missionStatus === "halted" ? "halted" : "exited";
  const mission = buildServerMissionModel({
    workspaceId,
    sessionId,
    missionStatus,
    signal: (previousMission.rawSignal as Record<string, unknown>) || null,
    decision: null,
    quote: {
      budgetUsd: Number(snapshot.budgetUsd || 0),
      entryLow: Number(previousExecutionTrace.averageEntry || 0),
      entryHigh: Number(previousExecutionTrace.averageEntry || 0),
      entryMid: Number(previousExecutionTrace.averageEntry || 0),
      stopLoss: Number(previousExecutionTrace.stopLoss || 0),
      takeProfit: Number(previousExecutionTrace.takeProfit || 0),
      holdHorizon: String(previousExecutionTrace.holdHorizon || "Adaptive hold horizon")
    },
    livePosition: livePosition ? ({ ...livePosition } as Record<string, unknown>) : null,
    activity: [
      createServerMissionActivity(
        "Monitoring Tick",
        livePosition
          ? "OpenClaw refreshed the mission after a monitoring pass."
          : "OpenClaw checked the workspace and found no active guarded position.",
        "info",
        workspaceId,
        new Date().toISOString(),
        "monitoring_tick"
      ),
      ...((Array.isArray(previousMission.activity) ? previousMission.activity : []) as Array<Record<string, unknown>>)
    ].slice(0, 40),
    executionTrace: {
      ...previousExecutionTrace,
      submitted: livePosition ? "Execution confirmed" : String(previousExecutionTrace.submitted || "Completed"),
      currentPnlPct: livePosition ? Number(livePosition.pnlPct || 0) : null
    }
  });
  await syncServerMissionState({
    userId: user.id,
    workspaceId,
    sessionId,
    budgetUsd: snapshot.budgetUsd,
    mission
  });
  if (!livePosition || ["halted", "exited"].includes(missionStatus)) {
    stopMissionWorkerLoop(user.id, workspaceId, sessionId);
  }
}

function startMissionWorkerLoop(user: { id: number }, workspaceId: string, sessionId: string) {
  const key = missionWorkerKey(user.id, workspaceId, sessionId);
  if (missionWorkerLoops.has(key)) return;
  missionWorkerHeartbeats.set(key, new Date().toISOString());
  const timer = setInterval(() => {
    monitorOpenClawMissionSession(user, workspaceId, sessionId).catch(() => {});
  }, 5000);
  missionWorkerLoops.set(key, timer);
}

function getMissionWorkerDiagnostics(userId: number, workspaceId: string) {
  const snapshot = loadMissionWorkspaceSnapshot(userId, workspaceId);
  const sessionId = snapshot.sessionId || "";
  const key = sessionId ? missionWorkerKey(userId, workspaceId, sessionId) : "";
  const hasLoop = key ? missionWorkerLoops.has(key) : false;
  return {
    workspaceId,
    sessionId: sessionId || null,
    provider: snapshot.provider || "openclaw",
    workerStatus: hasLoop ? "running" : snapshot.mission?.missionStatus === "halted" ? "halted" : "idle",
    lastWorkerHeartbeat: key ? missionWorkerHeartbeats.get(key) || null : null,
    fallbackState: "legacy_guarded_paper_execution",
    missionStatus: String(snapshot.mission?.missionStatus || "scanning"),
    updatedAt: snapshot.updatedAt || null
  };
}

async function executeOpenClawMissionForUser(user: { id: number }, workspaceId: string, budgetUsd: number) {
  const preview = await previewOpenClawMissionForUser(user, workspaceId, budgetUsd);
  const sessionId = preview.snapshot.sessionId || crypto.randomUUID();
  const execCfg = getAutoTradeExecutionConfig(user.id);
  let livePosition = listAutoTradePositions(user.id, "OPEN").find((position) => position.mint === workspaceId) || null;
  let executionStatus = "Execution evaluated";
  const activities = [
    createServerMissionActivity("Execution Requested", "OpenClaw requested guarded paper execution from the runtime backend.", "ok", `${budgetUsd.toFixed(2)} USD`, new Date().toISOString(), "execution_requested")
  ];

  if (!livePosition && preview.decision.decision === "BUY_CANDIDATE") {
    const signalMarket = (preview.signal.market || {}) as Record<string, unknown>;
    const entryPriceUsd = firstPositiveRuntimeValue(preview.quote.entryMid, signalMarket.priceUsd, preview.quote.entryLow, preview.quote.entryHigh);
    if (entryPriceUsd && entryPriceUsd > 0) {
      const exits = resolveAdaptiveExitPercents(execCfg, preview.decision);
      const tradeAmountUsd = Number(Math.max(1, budgetUsd).toFixed(2));
      const qtyTokens = Number((tradeAmountUsd / entryPriceUsd).toFixed(8));
      livePosition = createAutoTradePosition({
        userId: user.id,
        mint: workspaceId,
        mode: "paper",
        entrySignalId: preview.signalId,
        entryPriceUsd,
        sizeUsd: tradeAmountUsd,
        qtyTokens,
        tpPct: exits.tpPct,
        slPct: exits.slPct,
        trailingStopPct: exits.trailingStopPct,
        maxHoldMinutes: Math.min(480, Number(execCfg.maxHoldMinutes || 120))
      });
      executionStatus = "Execution confirmed";
      activities.push(
        createServerMissionActivity("Execution Confirmed", "Guarded runtime confirmed a paper position for the mission.", "ok", workspaceId, new Date().toISOString(), "execution_confirmed")
      );
    }
  }

  if (!livePosition && preview.decision.decision !== "BUY_CANDIDATE") {
    activities.push(
      createServerMissionActivity("Execution Deferred", "Guarded runtime evaluated the mission and kept execution on hold.", "info", workspaceId, new Date().toISOString(), "execution_deferred")
    );
  }

  const mission = buildServerMissionModel({
    workspaceId,
    sessionId,
    missionStatus: livePosition ? "monitoring" : "executing",
    signal: preview.signal,
    decision: preview.decision,
    quote: preview.quote,
    livePosition: livePosition ? ({ ...livePosition } as Record<string, unknown>) : null,
    activity: [...activities, ...((preview.snapshot.mission?.activity as Array<Record<string, unknown>>) || [])].slice(0, 40),
    executionTrace: {
      previewState: "OpenClaw preview executed",
      submitted: executionStatus,
      txHash: livePosition ? "paper-fill" : "-",
      filledAmount: livePosition ? Number(livePosition.sizeUsd || budgetUsd) : budgetUsd,
      averageEntry: livePosition ? Number(livePosition.entryPriceUsd || preview.quote.entryMid || 0) : preview.quote.entryMid,
      stopLoss: preview.quote.stopLoss,
      takeProfit: preview.quote.takeProfit,
      holdHorizon: preview.quote.holdHorizon,
      currentPnlPct: livePosition ? Number(livePosition.pnlPct || 0) : null
    }
  });

  const snapshot = await syncServerMissionState({
    userId: user.id,
    workspaceId,
    sessionId,
    budgetUsd,
    ensureSession: true,
    mission
  });
  if (snapshot.sessionId) {
    startMissionWorkerLoop(user, workspaceId, snapshot.sessionId);
  }
  return snapshot;
}

async function buildBatchSignals(userId: number, mints: string[]) {
  const generated = await Promise.allSettled(
    mints.map(async (mint) => {
      return buildStoredSignal(userId, mint);
    })
  );

  return generated
    .map((entry, index) => {
      if (entry.status === "fulfilled") {
        return { mint: mints[index], ok: true, ...entry.value };
      }

      return {
        mint: mints[index],
        ok: false,
        error: entry.reason instanceof Error ? entry.reason.message : "signal generation failed"
      };
    })
    .sort((a, b) => {
      const aSignal = (a as Record<string, unknown>).signal as Record<string, unknown> | undefined;
      const bSignal = (b as Record<string, unknown>).signal as Record<string, unknown> | undefined;
      const aScore = Number((aSignal?.killSwitch as Record<string, unknown> | undefined)?.score || 0);
      const bScore = Number((bSignal?.killSwitch as Record<string, unknown> | undefined)?.score || 0);
      return bScore - aScore;
    });
}

app.post("/api/auth/nonce", (req, res) => {
  const wallet = String(req.body.wallet || "").trim();
  if (!wallet) {
    return res.status(400).json({ error: "wallet is required" });
  }

  const nonce = generateNonce();
  putNonce(wallet, nonce);
  return res.json({ nonce, message: `KOBECOIN login nonce: ${nonce}` });
});

app.get("/api/access/kobx", async (req, res) => {
  try {
    const wallet = String(req.query.wallet || "").trim();
    if (!wallet) {
      return res.status(400).json({ error: "wallet is required" });
    }
    const status = await getKobxAccessStatus(wallet);
    const user = getUserByWallet(wallet);
    const payload = user ? enrichScannerQuota(status, getUsage(user.id)) : status;
    return res.json(payload);
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "KOBX access check failed"
    });
  }
});

app.post("/api/auth/verify", async (req, res) => {
  const wallet = String(req.body.wallet || "").trim();
  const nonce = String(req.body.nonce || "").trim();
  const signature = String(req.body.signature || "").trim();

  if (!wallet || !nonce || !signature) {
    return res.status(400).json({ error: "wallet, nonce, signature are required" });
  }

  const nonceOk = consumeNonce(wallet, nonce);
  if (!nonceOk) {
    return res.status(401).json({ error: "invalid or expired nonce" });
  }

  const signatureOk = verifyWalletSignature(wallet, nonce, signature);
  if (!signatureOk) {
    return res.status(401).json({ error: "invalid signature" });
  }

  try {
    const access = await getKobxAccessStatus(wallet);
    const knownUser = getUserByWallet(wallet);
    const payload = knownUser ? enrichScannerQuota(access, getUsage(knownUser.id)) : access;
    if (!payload.eligible) {
      return res.status(403).json({
        error: "KOBX balance requirement not met",
        code: "KOBX_REQUIRED",
        ...payload
      });
    }
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "KOBX access check failed"
    });
  }

  const user = hydrateUser(wallet);
  const token = issueToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: AUTH_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return res.json({ ok: true, user });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: AUTH_COOKIE_SECURE,
    sameSite: "lax",
    path: "/"
  });
  return res.json({ ok: true });
});

app.get("/api/premium/info", (_req, res) => {
  return res.json({
    paymentAddress: PREMIUM_SOL_ADDRESS,
    telegram: PREMIUM_TELEGRAM,
    tiers: {
      pro1: { lamports: PREMIUM_TIER_LAMPORTS.pro1, sol: PREMIUM_TIER_LAMPORTS.pro1 / 1_000_000_000 },
      pro2: { lamports: PREMIUM_TIER_LAMPORTS.pro2, sol: PREMIUM_TIER_LAMPORTS.pro2 / 1_000_000_000 },
      pro3: { lamports: PREMIUM_TIER_LAMPORTS.pro3, sol: PREMIUM_TIER_LAMPORTS.pro3 / 1_000_000_000 },
      pro4: { lamports: PREMIUM_TIER_LAMPORTS.pro4, sol: PREMIUM_TIER_LAMPORTS.pro4 / 1_000_000_000 }
    },
    note: "Send SOL to the payment address, then submit txSignature for verification."
  });
});

app.post("/api/premium/verify-payment", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const tier = String(req.body.tier || "").trim().toLowerCase();
    const txSignature = String(req.body.txSignature || "").trim();
    if (!["pro1", "pro2", "pro3", "pro4"].includes(tier)) {
      return res.status(400).json({ error: "tier must be one of pro1/pro2/pro3/pro4" });
    }
    if (!txSignature) {
      return res.status(400).json({ error: "txSignature is required" });
    }

    const duplicate = getPremiumPaymentBySignature(txSignature);
    if (duplicate) {
      return res.status(409).json({
        error: "transaction already submitted",
        payment: duplicate
      });
    }

    const tx = await rpcCall("getTransaction", [txSignature, { encoding: "jsonParsed", commitment: "confirmed" }]);
    const transfers = extractTransferRecordsToAddress(tx, PREMIUM_SOL_ADDRESS);
    const requiredLamports = Number(PREMIUM_TIER_LAMPORTS[tier] || 0);

    const signerWallet = String(req.user.wallet || "");
    const paidByUserLamports = transfers
      .filter((entry) => entry.source === signerWallet)
      .reduce((sum, entry) => sum + Number(entry.lamports || 0), 0);
    const txResult = (tx.result as Record<string, unknown>) || {};
    const txBlockTime = Number(txResult.blockTime || 0);
    const txMeta = (txResult.meta as Record<string, unknown>) || {};
    const err = txMeta.err;

    if (err) {
      savePremiumPayment({
        userId: req.user.id,
        wallet: signerWallet,
        tier,
        txSignature,
        lamports: paidByUserLamports,
        status: "rejected",
        note: "transaction has on-chain error"
      });
      return res.status(400).json({ error: "transaction failed on-chain" });
    }

    if (paidByUserLamports < requiredLamports) {
      savePremiumPayment({
        userId: req.user.id,
        wallet: signerWallet,
        tier,
        txSignature,
        lamports: paidByUserLamports,
        status: "rejected",
        note: "insufficient payment amount"
      });
      return res.status(400).json({
        error: "insufficient payment",
        requiredLamports,
        paidLamports: paidByUserLamports
      });
    }

    const updated = setUserPlanByWallet(signerWallet, "pro");
    const payment = savePremiumPayment({
      userId: req.user.id,
      wallet: signerWallet,
      tier,
      txSignature,
      lamports: paidByUserLamports,
      status: "verified",
      note: `verified at blockTime ${txBlockTime || "unknown"}`
    });

    return res.json({
      ok: true,
      payment,
      user: {
        id: updated.id,
        wallet: updated.wallet,
        plan: updated.plan
      },
      note: "Payment verified. Re-login wallet to refresh JWT claims."
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/users/plan", (req, res) => {
  if (!requireAdminToken(req, res)) {
    return;
  }

  const wallet = String(req.body.wallet || "").trim();
  const plan = String(req.body.plan || "").trim().toLowerCase();
  if (!wallet) {
    return res.status(400).json({ error: "wallet is required" });
  }
  if (plan !== "free" && plan !== "pro") {
    return res.status(400).json({ error: "plan must be free or pro" });
  }

  try {
    const user = getUserByWallet(wallet);
    if (!user) {
      return res.status(404).json({ error: "user not found; user must login first" });
    }

    const updated = setUserPlanByWallet(wallet, plan as "free" | "pro");
    return res.json({
      ok: true,
      user: {
        id: updated.id,
        wallet: updated.wallet,
        plan: updated.plan
      },
      note: `Plan updated to ${updated.plan}. User should re-login to refresh JWT claims.`
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/users/balance", (req, res) => {
  if (!requireAdminToken(req, res)) {
    return;
  }

  const wallet = String(req.body.wallet || "").trim();
  const lamports = Number(req.body.lamports ?? -1);
  if (!wallet) {
    return res.status(400).json({ error: "wallet is required" });
  }
  if (!Number.isFinite(lamports) || lamports < 0) {
    return res.status(400).json({ error: "lamports must be a non-negative number" });
  }

  const user = getUserByWallet(wallet);
  if (!user) {
    return res.status(404).json({ error: "user not found; user must login first" });
  }

  const balance = setUserManagedBalance(user.id, lamports);
  return res.json({ ok: true, user, balance });
});

app.get("/api/admin/withdrawals", (req, res) => {
  if (!requireAdminToken(req, res)) {
    return;
  }

  const statusRaw = String(req.query.status || "").toLowerCase();
  const status =
    statusRaw === "pending" || statusRaw === "approved" || statusRaw === "rejected"
      ? (statusRaw as "pending" | "approved" | "rejected")
      : undefined;
  const limit = Math.max(10, Math.min(300, Number(req.query.limit || 100)));
  const requests = listWithdrawalRequests({ status, limit });
  return res.json({ requests });
});

app.post("/api/admin/withdrawals/:id/approve", async (req, res) => {
  if (!requireAdminToken(req, res)) {
    return;
  }

  const requestId = Number(req.params.id || 0);
  if (!requestId) {
    return res.status(400).json({ error: "valid request id is required" });
  }

  const request = getWithdrawalRequestById(requestId);
  if (!request) {
    return res.status(404).json({ error: "withdrawal request not found" });
  }
  if (request.status !== "pending") {
    return res.status(400).json({ error: `request already ${request.status}` });
  }
  if (!LIVE_EXECUTION_ENABLED) {
    return res.status(400).json({
      error: "withdrawal transfers require ENIGMA_EXECUTION_ENABLED=1",
      hint: "set execution enabled and trader key before approving payouts"
    });
  }

  try {
    const payout = await executeSolTransfer({
      destinationWallet: request.destinationWallet,
      lamports: request.lamports
    });
    const updated = updateWithdrawalRequestStatus({
      requestId,
      status: "approved",
      payoutSignature: String(payout.signature || ""),
      note: String(req.body.note || "").trim() || "approved and transferred"
    });
    return res.json({ ok: true, request: updated, payout });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/withdrawals/:id/reject", (req, res) => {
  if (!requireAdminToken(req, res)) {
    return;
  }

  const requestId = Number(req.params.id || 0);
  if (!requestId) {
    return res.status(400).json({ error: "valid request id is required" });
  }

  const request = getWithdrawalRequestById(requestId);
  if (!request) {
    return res.status(404).json({ error: "withdrawal request not found" });
  }
  if (request.status !== "pending") {
    return res.status(400).json({ error: `request already ${request.status}` });
  }

  adjustUserManagedBalance(request.userId, request.lamports);
  const updated = updateWithdrawalRequestStatus({
    requestId,
    status: "rejected",
    note: String(req.body.note || "").trim() || "rejected by admin"
  });
  return res.json({ ok: true, request: updated });
});

app.get("/api/profile/overview", authRequired, enforceQuota("chat_calls"), async (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const usage = incrementUsage(req.user.id, "chat_calls");
  const stats = getDashboardStats(req.user.id);
  const balance = getUserManagedBalance(req.user.id);
  const openPositions = listAutoTradePositions(req.user.id, "OPEN");
  const access = await buildScannerAccessStatus(req.user.id, req.user.wallet);
  return res.json({ user: req.user, stats, balance, openPositionsCount: openPositions.length, usage, access });
});

app.get("/api/profile/history", authRequired, enforceQuota("chat_calls"), (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const usage = incrementUsage(req.user.id, "chat_calls");
  const payments = listPremiumPaymentsByUser(req.user.id).slice(0, 50);
  const positions = listAutoTradePositions(req.user.id).slice(0, 100);
  const withdrawals = listWithdrawalRequests({ userId: req.user.id, limit: 100 });
  const stats = getDashboardStats(req.user.id);
  const performance = getAutoTradePerformance(req.user.id, 50);
  return res.json({
    user: req.user,
    payments,
    positions,
    withdrawals,
    recentSignals: (stats.recentSignals as Array<Record<string, unknown>>) || [],
    recentRuns: (performance.recentRuns as Array<Record<string, unknown>>) || [],
    usage
  });
});

app.get("/api/withdrawals/me", authRequired, enforceQuota("chat_calls"), (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const usage = incrementUsage(req.user.id, "chat_calls");
  const balance = getUserManagedBalance(req.user.id);
  const requests = listWithdrawalRequests({ userId: req.user.id, limit: 100 });
  return res.json({ balance, requests, usage });
});

app.post("/api/withdrawals/request", authRequired, enforceQuota("chat_calls"), (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const destinationWallet = String(req.body.destinationWallet || req.user.wallet || "").trim();
  const lamports = Number(req.body.lamports || 0);
  if (!destinationWallet || !isValidSolanaMint(destinationWallet)) {
    return res.status(400).json({ error: "valid destination wallet is required" });
  }
  if (!Number.isFinite(lamports) || lamports <= 0) {
    return res.status(400).json({ error: "lamports must be a positive number" });
  }

  const currentBalance = getUserManagedBalance(req.user.id);
  if (Number(currentBalance.lamports || 0) < Math.floor(lamports)) {
    return res.status(400).json({ error: "insufficient managed balance for withdrawal request" });
  }

  adjustUserManagedBalance(req.user.id, -Math.floor(lamports));
  const request = createWithdrawalRequest({
    userId: req.user.id,
    userWallet: req.user.wallet,
    destinationWallet,
    lamports: Math.floor(lamports),
    note: String(req.body.note || "").trim() || undefined
  });
  const usage = incrementUsage(req.user.id, "chat_calls");
  return res.json({
    ok: true,
    request,
    balance: getUserManagedBalance(req.user.id),
    usage,
    note: "Withdrawal request submitted. Admin approval required."
  });
});

app.get("/api/auth/me", authRequired, async (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const stats = getDashboardStats(req.user.id);
  const access = await buildScannerAccessStatus(req.user.id, req.user.wallet);
  const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
  return res.json({
    user: req.user,
    stats,
    access,
    usage: getUsage(req.user.id),
    live: {
      paperOnlyMode: PAPER_ONLY_MODE,
      executionEnabled: LIVE_EXECUTION_ENABLED,
      emergencyHalt: GLOBAL_EMERGENCY_HALT,
      internalGateEnabled: REQUIRE_INTERNAL_LIVE_WALLET,
      eligible: liveEligibility.allowed && LIVE_EXECUTION_ENABLED && !PAPER_ONLY_MODE,
      reason: liveEligibility.allowed
        ? LIVE_EXECUTION_ENABLED
          ? PAPER_ONLY_MODE
            ? "paper_only_mode"
            : "ready"
          : "execution_disabled"
        : liveEligibility.reason || "blocked",
      signerConfigured: hasSignerForWallet(req.user.wallet)
    }
  });
});

app.get("/api/live/readiness", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
  const executionConfig = getAutoTradeExecutionConfig(req.user.id);
  const policyConfig = getAutoTradeConfig(req.user.id);
  const signerConfigured = hasSignerForWallet(req.user.wallet);
  const liveModeRequested = executionConfig.mode === "live" || policyConfig.mode === "live";
  const liveModeEnabled = executionConfig.enabled && executionConfig.mode === "live";
  const ready =
    LIVE_EXECUTION_ENABLED &&
    !PAPER_ONLY_MODE &&
    !GLOBAL_EMERGENCY_HALT &&
    liveEligibility.allowed &&
    signerConfigured &&
    liveModeEnabled;

  const reasons: string[] = [];
  if (!LIVE_EXECUTION_ENABLED) reasons.push("execution_disabled");
  if (PAPER_ONLY_MODE) reasons.push("paper_only_mode");
  if (GLOBAL_EMERGENCY_HALT) reasons.push("global_emergency_halt");
  if (!liveEligibility.allowed) reasons.push(String(liveEligibility.reason || "live_not_allowed"));
  if (!signerConfigured) reasons.push("missing_wallet_signer_mapping");
  if (!executionConfig.enabled) reasons.push("execution_engine_disabled");
  if (executionConfig.mode !== "live") reasons.push("execution_mode_not_live");
  if (liveRuntimeErrors.length > 0) reasons.push("runtime_config_errors_present");

  return res.json({
    ts: new Date().toISOString(),
    user: {
      wallet: req.user.wallet,
      plan: req.user.plan
    },
    live: {
      ready,
      reasons,
      executionEnabled: LIVE_EXECUTION_ENABLED,
      paperOnlyMode: PAPER_ONLY_MODE,
      globalEmergencyHalt: GLOBAL_EMERGENCY_HALT,
      internalWalletGate: REQUIRE_INTERNAL_LIVE_WALLET,
      eligibleWallet: liveEligibility.allowed,
      eligibleReason: liveEligibility.allowed ? "ok" : String(liveEligibility.reason || "blocked"),
      signerConfigured,
      runtimeErrors: liveRuntimeErrors
    },
    config: {
      policyEnabled: policyConfig.enabled,
      policyMode: policyConfig.mode,
      executionEnabled: executionConfig.enabled,
      executionMode: executionConfig.mode,
      liveModeRequested
    },
    safety: {
      maxTotalExposureUsd: SAFETY_MAX_TOTAL_EXPOSURE_USD,
      maxDailyLossUsd: SAFETY_MAX_DAILY_LOSS_USD,
      maxHourlyLossUsd: SAFETY_MAX_HOURLY_LOSS_USD,
      maxTokenDailyLossUsd: SAFETY_MAX_TOKEN_DAILY_LOSS_USD,
      maxTokenHourlyLossUsd: SAFETY_MAX_TOKEN_HOURLY_LOSS_USD,
      maxLossPerTradeUsd: SAFETY_MAX_LOSS_PER_TRADE_USD,
      maxDrawdownPct: SAFETY_MAX_DRAWDOWN_PCT
    }
  });
});

app.get("/api/health", async (_req, res) => {
  const context = await createEnigmaContext();
  const helius = await context.tools.onchain.rpcHealth();

  res.json({
    ok: true,
    app: "KOBECOIN AI Guardian",
    role: "Multi-chain paper scanner (Solana + BTC/ETH)",
    boundaries: [
      "Execution is optional and policy-gated",
      "Probabilistic signals",
      ...(PAPER_ONLY_MODE ? ["Paper-only mode enabled (live execution disabled)"] : [])
    ],
    live: {
      executionEnabled: LIVE_EXECUTION_ENABLED,
      paperOnlyMode: PAPER_ONLY_MODE,
      emergencyHalt: GLOBAL_EMERGENCY_HALT,
      internalWalletGate: REQUIRE_INTERNAL_LIVE_WALLET,
      internalWalletCount: INTERNAL_LIVE_WALLETS.size,
      requirePerWalletSigner: REQUIRE_PER_WALLET_SIGNER,
      safetyMaxDrawdownPct: SAFETY_MAX_DRAWDOWN_PCT,
      safetyDrawdownPauseSec: SAFETY_DRAWDOWN_PAUSE_SEC,
      runtimeErrors: liveRuntimeErrors
    },
    helius
  });
});

app.post(
  "/api/signal",
  authRequired,
  enforceQuota("signal_calls"),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      const quota = await enforceScannerDailyLimit(req, res);
      if (!quota.ok) return;

      const mint = String(req.body.mint || "").trim();
      const normalized = normalizeTrackedAssetId(mint);
      if (!normalized) {
        return res.status(400).json({ error: "valid token is required (Solana mint, BTC, ETH)" });
      }

      const output = await buildStoredSignal(req.user.id, normalized);
      const usage = incrementUsage(req.user.id, "signal_calls");
      const scannerUsage = incrementUsage(req.user.id, "scanner_calls");
      const access = enrichScannerQuota(await getKobxAccessStatus(req.user.wallet), scannerUsage);
      return res.json({ ...output, usage: scannerUsage, signalUsage: usage, access });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.get("/api/token/market/live", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const mint = normalizeTrackedAssetId(String(req.query.mint || "").trim());
    if (!mint) {
      return res.status(400).json({ error: "valid token is required (Solana mint, BTC, ETH)" });
    }

    const windowSec = Math.max(60, Math.min(900, Number(req.query.windowSec || 300)));

    let market: Record<string, unknown> | null = null;
    try {
      market = await fetchRealtimeMarketSnapshot(mint);
      const priceUsd = Number(market.priceUsd || 0);
      if (Number.isFinite(priceUsd) && priceUsd > 0) {
        livePriceCache.set(mint, {
          priceUsd,
          updatedAt: Date.now(),
          market
        });
      }
    } catch {
      market = null;
    }

    const cached = livePriceCache.get(mint);
    if (!market && !cached) {
      return res.status(503).json({ error: "live market price unavailable for this mint" });
    }

    const effectiveMarket = market || cached?.market || {};
    const pairAddress = String(effectiveMarket.pairAddress || "");
    const timeframe = windowSec <= 90 ? "1m" : windowSec <= 300 ? "5m" : "15m";
    const candleLimit = timeframe === "1m" ? 160 : timeframe === "5m" ? 120 : 80;
    const candles = isSolanaTrackedAsset(mint)
      ? pairAddress
        ? await fetchCandlesFromGeckoTerminal({
            pairAddress,
            timeframe: timeframe === "1m" ? "5m" : timeframe,
            limit: candleLimit
          })
        : []
      : await fetchCandlesFromBinanceSymbol({
          symbol: mint,
          timeframe: timeframe === "1m" ? "5m" : timeframe,
          limit: candleLimit
        });

    const points = candles.map((candle) => ({
      ts: normalizeTsMs(Number(candle.ts || 0)),
      price: Number(candle.close || 0)
    }));

    return res.json({
      ts: new Date().toISOString(),
      mint,
      stale: !market,
      market: effectiveMarket,
      chart: {
        source: points.length ? "candles" : "tick",
        timeframe,
        windowSec,
        points
      },
      cache: cached
        ? {
            updatedAt: new Date(cached.updatedAt).toISOString(),
            ageSec: Math.max(0, Math.floor((Date.now() - cached.updatedAt) / 1000))
          }
        : null
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post(
  "/api/discovery/suggest",
  authRequired,
  enforceQuota("signal_calls"),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      const quota = await enforceScannerDailyLimit(req, res);
      if (!quota.ok) return;

      const limit = Math.min(10, Math.max(3, Number(req.body.limit || 5)));
      const candidates = await discoverNewSolanaMints(30);
      if (candidates.length === 0) {
        return res.status(200).json({ items: [], note: "no candidates from discovery source" });
      }

      const context = await createEnigmaContext();
      const evaluated = await Promise.allSettled(
        candidates.slice(0, 20).map(async (candidate) => {
          const signal = await generateSignal(context, candidate.mint);
          return { candidate, signal };
        })
      );

      const items = evaluated
        .filter(
          (
            entry
          ): entry is PromiseFulfilledResult<{ candidate: { mint: string; iconUrl?: string; headerUrl?: string }; signal: Record<string, unknown> }> =>
            entry.status === "fulfilled"
        )
        .map((entry) => entry.value)
        .map(({ candidate, signal }) => {
          const market = (signal.market as Record<string, unknown>) || {};
          const token = (signal.token as Record<string, unknown>) || {};
          return {
            mint: candidate.mint,
            signal: {
              ...signal,
              token: {
                ...token,
                imageUrl: String(token.imageUrl || candidate.iconUrl || ""),
                headerUrl: String(token.headerUrl || candidate.headerUrl || "")
              }
            },
            forecastScore: Number(signal.forecastScore || 0),
            liquidityUsd: Number(market.liquidityUsd || 0)
          };
        })
        .filter((item) => item.liquidityUsd >= 10000)
        .sort((a, b) => b.forecastScore - a.forecastScore)
        .slice(0, limit);

      const usage = incrementUsage(req.user.id, "signal_calls");
      const scannerUsage = incrementUsage(req.user.id, "scanner_calls");
      const access = enrichScannerQuota(await getKobxAccessStatus(req.user.wallet), scannerUsage);
      return res.json({
        ts: new Date().toISOString(),
        items,
        usage: scannerUsage,
        signalUsage: usage,
        access,
        note: "Discovery suggestions are probabilistic and may include high-risk tokens"
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.post("/api/forecast/resolve", authRequired, (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const signalId = Number(req.body.signalId || 0);
    const won = Boolean(req.body.won);
    const pnlPct = Number(req.body.pnlPct || 0);
    const note = String(req.body.note || "").trim() || undefined;

    if (!signalId || !Number.isFinite(signalId)) {
      return res.status(400).json({ error: "signalId is required" });
    }

    resolveForecast({ userId: req.user.id, signalId, won, pnlPct, note });
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.get(
  "/api/token/holders",
  authRequired,
  enforceQuota("signal_calls"),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const mint = normalizeTrackedAssetId(String(req.query.mint || "").trim());
      const limit = Math.min(50, Math.max(8, Number(req.query.limit || 40)));
      const requestedAnalysisMode = String(req.query.mode || "sample").toLowerCase();
      const analysisMode =
        requestedAnalysisMode === "full"
          ? "full"
          : requestedAnalysisMode === "deep"
            ? "deep"
            : "sample";
      if (!mint) {
        return res.status(400).json({ error: "valid token is required (Solana mint, BTC, ETH)" });
      }

      if (!isSolanaTrackedAsset(mint)) {
        const usage = incrementUsage(req.user.id, "signal_calls");
        return res.json({
          mint,
          holderProfiles: [],
          holderBehavior: {
            connectedHolderPct: 0,
            newWalletHolderPct: 0,
            connectedGroupCount: 0,
            avgWalletAgeDays: 0,
            analyzedTopAccounts: 0,
            connectedGroups: [],
            analysisCoverage: {
              topAccountsAnalyzed: 0,
              buySellTxSamplePerAccount: 0,
              accountsWithBuySellSampling: 0,
              signatureSamplePerAccount: 0,
              note: "Holder analytics are available for Solana tokens only in this build."
            }
          },
          analysisMode,
          usage
        });
      }

      const context = await createEnigmaContext();
      const risk = await context.tools.onchain.riskSignals(mint, { holderLimit: limit, analysisMode });
      const usage = incrementUsage(req.user.id, "signal_calls");

      return res.json({
        mint,
        holderProfiles: (risk.holderProfiles as Array<Record<string, unknown>>) || [],
        holderBehavior: (risk.holderBehavior as Record<string, unknown>) || {},
        analysisMode,
        usage
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
);

app.get("/api/dashboard/stats", authRequired, async (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const usage = getUsage(req.user.id);
  const stats = getDashboardStats(req.user.id);
  const access = await buildScannerAccessStatus(req.user.id, req.user.wallet);
  return res.json({ stats, usage, access });
});

app.get("/api/autotrade/config", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return res.json({ config: getAutoTradeConfig(req.user.id) });
});

app.put("/api/autotrade/config", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const current = getAutoTradeConfig(req.user.id);
  const modeInput = String(req.body.mode || current.mode).toLowerCase();
  const requestedMode: "paper" | "live" = modeInput === "live" ? "live" : "paper";
  const mode: "paper" | "live" = PAPER_ONLY_MODE ? "paper" : requestedMode;
  const forcedPaper = PAPER_ONLY_MODE && requestedMode === "live";
  const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
  if (mode === "live" && !liveEligibility.allowed) {
    return res
      .status(403)
      .json(
        liveEligibility.reason === "internal_wallet_required"
          ? internalWalletRequiredResponse()
          : premiumRequiredResponse()
      );
  }

  const next = putAutoTradeConfig(req.user.id, {
    enabled: typeof req.body.enabled === "boolean" ? Boolean(req.body.enabled) : current.enabled,
    mode,
    allowCautionEntries:
      typeof req.body.allowCautionEntries === "boolean"
        ? Boolean(req.body.allowCautionEntries)
        : current.allowCautionEntries,
    allowHighRiskEntries:
      typeof req.body.allowHighRiskEntries === "boolean"
        ? Boolean(req.body.allowHighRiskEntries)
        : current.allowHighRiskEntries,
    minPatternScore: clampNumber(
      Number(req.body.minPatternScore ?? current.minPatternScore),
      0,
      95
    ),
    minConfidence: clampNumber(Number(req.body.minConfidence ?? current.minConfidence), 0.1, 0.99),
    maxConnectedHolderPct: clampNumber(
      Number(req.body.maxConnectedHolderPct ?? current.maxConnectedHolderPct),
      1,
      80
    ),
    requireKillSwitchPass:
      typeof req.body.requireKillSwitchPass === "boolean"
        ? Boolean(req.body.requireKillSwitchPass)
        : current.requireKillSwitchPass,
    maxPositionUsd: clampNumber(Number(req.body.maxPositionUsd ?? current.maxPositionUsd), 1, 50000),
    scanIntervalSec: clampNumber(Number(req.body.scanIntervalSec ?? current.scanIntervalSec), 10, 3600)
  });

  return res.json({
    config: next,
    note:
      forcedPaper
        ? "Paper-only mode is enabled. Live request was forced to paper."
        : "Auto-trade policy updated. Use /api/autotrade/engine/tick for managed position open/close execution."
  });
});

app.post(
  "/api/autotrade/run",
  authRequired,
  async (req: AuthedRequest, res) => {
    let lockAcquired = false;
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      lockAcquired = acquireUserExecutionLock(autotradeRunLocks, req.user.id);
      if (!lockAcquired) {
        return res.status(429).json({ error: "autotrade run already in progress; retry shortly" });
      }

      const config = getAutoTradeConfig(req.user.id);
      const execCfg = getAutoTradeExecutionConfig(req.user.id);
      if (!config.enabled) {
        return res.status(400).json({ error: "autotrade is disabled", config });
      }

      const agentMint = resolveSingleAgentMint(
        String(req.body.mint || ""),
        String(req.body.mints || "")
      );
      if (!agentMint) {
        return res.status(400).json({ error: "exactly one valid agent token is required (Solana mint, BTC, ETH)" });
      }
      const mints = [agentMint];

      const decisions = await evaluateAutoTradeDecisions(req.user.id, mints, config);
      const requestedModel = String(req.body?.testModel || "").trim().toLowerCase();
      const testModel =
        requestedModel === "guardian_safe" ||
        requestedModel === "guardian_balanced" ||
        requestedModel === "guardian_fast"
          ? requestedModel
          : "guardian_balanced";

      const usage = incrementUsage(req.user.id, "signal_calls");
      const candidates = decisions.filter((item) => item.ok && item.decision === "BUY_CANDIDATE");
      const effectiveTradeAmountUsd = getEffectiveTradeAmountUsd(config, execCfg);
      const openExposureUsd = getOpenExposureUsd(req.user.id);
      const paperBudgetUsd = Number(
        Math.max(effectiveTradeAmountUsd, Number(execCfg.paperBudgetUsd || 100)).toFixed(2)
      );
      const paperAvailableUsd = Number(Math.max(0, paperBudgetUsd - openExposureUsd).toFixed(2));
      const baseModeState = getEffectiveMode(config, execCfg, req.user.plan, req.user.wallet);
      const modeState = PAPER_ONLY_MODE
        ? {
            mode: "paper" as const,
            warnings: [...baseModeState.warnings, "paper-only mode enabled: live execution is disabled"]
          }
        : baseModeState;
      const expectedPnlValues = candidates.map((item) =>
        projectDecisionPnlPct(Number(item.patternScore || 0), Number(item.confidence || 0))
      );
      const avgExpectedPnlPct = expectedPnlValues.length
        ? Number(
            (
              expectedPnlValues.reduce((sum, value) => sum + value, 0) / expectedPnlValues.length
            ).toFixed(2)
          )
        : 0;
      const projectedExposureUsd = Number((candidates.length * effectiveTradeAmountUsd).toFixed(2));
      const simulatedExposureUsd = Number(
        (
          modeState.mode === "paper"
            ? Math.min(projectedExposureUsd, paperAvailableUsd)
            : projectedExposureUsd
        ).toFixed(2)
      );
      const runId = saveAutoTradeRun({
        userId: req.user.id,
        mode: modeState.mode,
        testModel,
        scannedCount: mints.length,
        buyCandidates: candidates.length,
        skippedCount: decisions.length - candidates.length,
        simulatedExposureUsd,
        expectedPnlPct: avgExpectedPnlPct
      });

      const modeNote =
        modeState.mode === "paper"
          ? PAPER_ONLY_MODE
            ? "paper-only mode: no live orders are executed"
            : "paper mode: no orders are executed"
          : "live mode policy pass: route candidate orders into your Jupiter execution worker";

      return res.json({
        ts: new Date().toISOString(),
        mode: modeState.mode,
        warnings: modeState.warnings,
        config,
        executionConfig: execCfg,
        scanned: mints.length,
        decisions,
        summary: {
          testModel,
          buyCandidates: candidates.length,
          skipped: decisions.length - candidates.length,
          maxPositionUsd: config.maxPositionUsd,
          effectiveTradeAmountUsd,
          paperBudgetUsd,
          paperAvailableUsd,
          openExposureUsd,
          simulatedExposureUsd,
          avgExpectedPnlPct
        },
        execution: {
          ready: modeState.mode === "live",
          note: modeNote
        },
        runId,
        usage
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    } finally {
      if (lockAcquired && req.user) {
        releaseUserExecutionLock(autotradeRunLocks, req.user.id);
      }
    }
  }
);

app.get("/api/autotrade/performance", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const limit = Math.max(5, Math.min(100, Number(req.query.limit || 30)));
  const usage = getUsage(req.user.id);
  const performance = getAutoTradePerformance(req.user.id, limit);
  return res.json({ performance, usage });
});

app.post("/api/autotrade/performance/reset", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const scopeRaw = String(req.body?.scope || "paper").toLowerCase();
  const scope: "paper" | "live" | "all" =
    scopeRaw === "live" || scopeRaw === "all" ? (scopeRaw as "paper" | "live" | "all") : "paper";

  const deletedRuns = resetAutoTradeRuns(req.user.id, scope);
  const usage = getUsage(req.user.id);
  const performance = getAutoTradePerformance(req.user.id, 30);
  return res.json({ ok: true, scope, deletedRuns, performance, usage });
});

app.get("/api/autotrade/execution-config", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return res.json({ config: getAutoTradeExecutionConfig(req.user.id) });
});

app.put("/api/autotrade/execution-config", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const current = getAutoTradeExecutionConfig(req.user.id);
  const modeInput = String(req.body.mode || current.mode).toLowerCase();
  const requestedMode: "paper" | "live" = modeInput === "live" ? "live" : "paper";
  const mode: "paper" | "live" = PAPER_ONLY_MODE ? "paper" : requestedMode;
  const forcedPaper = PAPER_ONLY_MODE && requestedMode === "live";
  const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
  if (mode === "live" && !liveEligibility.allowed) {
    return res
      .status(403)
      .json(
        liveEligibility.reason === "internal_wallet_required"
          ? internalWalletRequiredResponse()
          : premiumRequiredResponse()
      );
  }

  const next = putAutoTradeExecutionConfig(req.user.id, {
    enabled: typeof req.body.enabled === "boolean" ? Boolean(req.body.enabled) : current.enabled,
    mode,
    paperBudgetUsd: normalizeSelectableBudgetUsd(
      Number(req.body.paperBudgetUsd ?? current.paperBudgetUsd),
      current.paperBudgetUsd
    ),
    tradeAmountUsd: clampNumber(Number(req.body.tradeAmountUsd ?? current.tradeAmountUsd), 1, 50000),
    maxOpenPositions: clampNumber(Number(req.body.maxOpenPositions ?? current.maxOpenPositions), 1, 50),
    tpPct: clampNumber(Number(req.body.tpPct ?? current.tpPct), 0.2, 200),
    slPct: clampNumber(Number(req.body.slPct ?? current.slPct), 0.2, 99),
    trailingStopPct: clampNumber(
      Number(req.body.trailingStopPct ?? current.trailingStopPct),
      0.1,
      99
    ),
    maxHoldMinutes: clampNumber(Number(req.body.maxHoldMinutes ?? current.maxHoldMinutes), 1, 10080),
    cooldownSec: clampNumber(Number(req.body.cooldownSec ?? current.cooldownSec), 0, 86400),
    pollIntervalSec: clampNumber(Number(req.body.pollIntervalSec ?? current.pollIntervalSec), 2, 3600)
  });

  return res.json({
    config: next,
    note:
      forcedPaper
        ? "Paper-only mode is enabled. Live request was forced to paper."
        : "Execution config updated. For real on-chain live execution, connect dedicated signer + router worker."
  });
});

app.get("/api/autotrade/positions", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const statusRaw = String(req.query.status || "").toUpperCase();
  const status = statusRaw === "OPEN" || statusRaw === "CLOSED" ? statusRaw : undefined;
  const usage = getUsage(req.user.id);
  const positions = listAutoTradePositions(req.user.id, status as "OPEN" | "CLOSED" | undefined);
  return res.json({ positions, usage });
});

app.get("/api/autotrade/events", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const limit = Math.max(10, Math.min(500, Number(req.query.limit || 120)));
  const usage = getUsage(req.user.id);
  const events = listAutoTradeEvents(req.user.id, limit).map((item) => ({
    ...item,
    payload: (() => {
      try {
        return JSON.parse(String(item.payloadJson || "{}"));
      } catch {
        return {};
      }
    })()
  }));
  return res.json({ events, usage });
});

app.get("/api/mission/workspaces/:workspaceId", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  return res.json(loadMissionWorkspaceSnapshot(req.user.id, workspaceId));
});

app.get("/api/mission/sessions/:sessionId", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const sessionId = String(req.params.sessionId || "").trim();
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }
  const snapshot = loadMissionSessionSnapshot(req.user.id, sessionId);
  if (!snapshot) {
    return res.status(404).json({ error: "mission session not found" });
  }
  return res.json(snapshot);
});

app.get("/api/mission/workspaces/:workspaceId/activity", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  const snapshot = loadMissionWorkspaceSnapshot(req.user.id, workspaceId);
  return res.json({
    workspaceId,
    sessionId: snapshot.sessionId,
    provider: snapshot.provider,
    activity: snapshot.activity,
    updatedAt: snapshot.updatedAt
  });
});

app.get("/api/mission/workspaces/:workspaceId/sessions", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 12)));
  return res.json({
    workspaceId,
    sessions: listMissionWorkspaceSessions(req.user.id, workspaceId, limit)
  });
});

app.get("/api/mission/workspaces/:workspaceId/diagnostics", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  return res.json(getMissionWorkerDiagnostics(req.user.id, workspaceId));
});

app.post("/api/mission/workspaces/:workspaceId/preview", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const workspaceId = String(req.params.workspaceId || req.body?.mint || "").trim();
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const budgetUsd = normalizeSelectableBudgetUsd(
      Number(req.body?.budgetUsd || 0),
      Number(req.user ? getAutoTradeExecutionConfig(req.user.id).paperBudgetUsd : 100)
    );
    const result = await previewOpenClawMissionForUser(req.user, workspaceId, budgetUsd);
    return res.json({
      workspaceId,
      sessionId: result.snapshot.sessionId,
      budgetUsd,
      signalId: result.signalId,
      signal: result.signal,
      decision: result.decision,
      quote: result.quote,
      snapshot: result.snapshot
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/mission/workspaces/:workspaceId/execute", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const workspaceId = String(req.params.workspaceId || req.body?.mint || "").trim();
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const budgetUsd = normalizeSelectableBudgetUsd(
      Number(req.body?.budgetUsd || 0),
      Number(req.user ? getAutoTradeExecutionConfig(req.user.id).paperBudgetUsd : 100)
    );
    const snapshot = await executeOpenClawMissionForUser(req.user, workspaceId, budgetUsd);
    return res.json({
      workspaceId,
      sessionId: snapshot.sessionId,
      budgetUsd,
      snapshot
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/mission/workspaces/:workspaceId/close", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const workspaceId = String(req.params.workspaceId || req.body?.mint || "").trim();
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const requestedPositionId = Number(req.body?.positionId || 0);
    const openPosition =
      listAutoTradePositions(req.user.id, "OPEN").find((position) =>
        requestedPositionId > 0 ? position.id === requestedPositionId : position.mint === workspaceId
      ) || null;
    if (!openPosition) {
      return res.status(404).json({ error: "no matching open position" });
    }
    const market = await fetchRealtimeMarketSnapshot(workspaceId);
    const markPriceUsd = Number(market?.priceUsd || openPosition.lastPriceUsd || openPosition.entryPriceUsd || 0);
    if (!Number.isFinite(markPriceUsd) || markPriceUsd <= 0) {
      return res.status(400).json({ error: "unable to price open position" });
    }
    const closed = closeAutoTradePosition({
      userId: req.user.id,
      positionId: openPosition.id,
      markPriceUsd,
      closeReason: "MANUAL_CLOSE"
    });
    const snapshotBefore = loadMissionWorkspaceSnapshot(req.user.id, workspaceId);
    const previousMission = (snapshotBefore.mission || {}) as Record<string, unknown>;
    const previousExecutionTrace = ((previousMission.executionTrace as Record<string, unknown>) || {});
    const mission = buildServerMissionModel({
      workspaceId,
      sessionId: snapshotBefore.sessionId,
      missionStatus: "exited",
      signal: (previousMission.rawSignal as Record<string, unknown>) || null,
      decision: null,
      quote: {
        budgetUsd: Number(snapshotBefore.budgetUsd || 0),
        entryLow: Number(previousExecutionTrace.averageEntry || 0),
        entryHigh: Number(previousExecutionTrace.averageEntry || 0),
        entryMid: Number(previousExecutionTrace.averageEntry || 0),
        stopLoss: Number(previousExecutionTrace.stopLoss || 0),
        takeProfit: Number(previousExecutionTrace.takeProfit || 0),
        holdHorizon: String(previousExecutionTrace.holdHorizon || "Adaptive hold horizon")
      },
      livePosition: null,
      activity: [
        createServerMissionActivity("Position Closed", "OpenClaw acknowledged the operator close and archived the mission.", "info", workspaceId, new Date().toISOString(), "position_closed"),
        ...((Array.isArray(previousMission.activity) ? previousMission.activity : []) as Array<Record<string, unknown>>)
      ].slice(0, 40),
      executionTrace: {
        ...previousExecutionTrace,
        submitted: "Closed by operator",
        currentPnlPct: null
      }
    });
    const snapshot = await syncServerMissionState({
      userId: req.user.id,
      workspaceId,
      sessionId: snapshotBefore.sessionId,
      budgetUsd: snapshotBefore.budgetUsd,
      mission
    });
    if (snapshot.sessionId) {
      stopMissionWorkerLoop(req.user.id, workspaceId, snapshot.sessionId);
    }
    return res.json({ ok: true, position: closed, snapshot });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/mission/workspaces/:workspaceId/halt", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const workspaceId = String(req.params.workspaceId || req.body?.mint || "").trim();
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }
    const currentPolicy = getAutoTradeConfig(req.user.id);
    const currentExecution = getAutoTradeExecutionConfig(req.user.id);
    putAutoTradeConfig(req.user.id, {
      ...currentPolicy,
      enabled: false,
      mode: "paper"
    });
    putAutoTradeExecutionConfig(req.user.id, {
      ...currentExecution,
      enabled: false,
      mode: "paper"
    });
    const snapshotBefore = loadMissionWorkspaceSnapshot(req.user.id, workspaceId);
    const previousMission = (snapshotBefore.mission || {}) as Record<string, unknown>;
    const previousExecutionTrace = ((previousMission.executionTrace as Record<string, unknown>) || {});
    const mission = buildServerMissionModel({
      workspaceId,
      sessionId: snapshotBefore.sessionId,
      missionStatus: "halted",
      signal: (previousMission.rawSignal as Record<string, unknown>) || null,
      decision: null,
      quote: {
        budgetUsd: Number(snapshotBefore.budgetUsd || 0),
        entryLow: Number(previousExecutionTrace.averageEntry || 0),
        entryHigh: Number(previousExecutionTrace.averageEntry || 0),
        entryMid: Number(previousExecutionTrace.averageEntry || 0),
        stopLoss: Number(previousExecutionTrace.stopLoss || 0),
        takeProfit: Number(previousExecutionTrace.takeProfit || 0),
        holdHorizon: String(previousExecutionTrace.holdHorizon || "Adaptive hold horizon")
      },
      livePosition:
        previousMission.livePosition && typeof previousMission.livePosition === "object"
          ? ({ ...(previousMission.livePosition as Record<string, unknown>) } as Record<string, unknown>)
          : null,
      activity: [
        createServerMissionActivity("Halt Acknowledged", "OpenClaw marked the mission halted and blocked further actions.", "error", workspaceId, new Date().toISOString(), "halt_acknowledged"),
        ...((Array.isArray(previousMission.activity) ? previousMission.activity : []) as Array<Record<string, unknown>>)
      ].slice(0, 40),
      executionTrace: {
        ...previousExecutionTrace,
        submitted: "Halt engaged"
      }
    });
    const snapshot = await syncServerMissionState({
      userId: req.user.id,
      workspaceId,
      sessionId: snapshotBefore.sessionId,
      budgetUsd: snapshotBefore.budgetUsd,
      mission
    });
    if (snapshot.sessionId) {
      stopMissionWorkerLoop(req.user.id, workspaceId, snapshot.sessionId);
    }
    return res.json({ ok: true, halted: true, snapshot });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/mission/workspaces/:workspaceId/sync", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).json({ error: "workspaceId is required" });
  }
  const mission = req.body?.mission;
  if (!mission || typeof mission !== "object") {
    return res.status(400).json({ error: "mission payload is required" });
  }
  const snapshot = syncMissionWorkspace({
    userId: req.user.id,
    workspaceId,
    provider: String(req.body?.provider || mission.provider || "openclaw"),
    budgetUsd: Number(req.body?.budgetUsd || mission.budgetUsd || 0),
    sessionId: String(req.body?.sessionId || mission.sessionId || "").trim() || null,
    ensureSession: Boolean(req.body?.ensureSession),
    mission: mission as Record<string, unknown>,
    workspaceArtifacts:
      req.body?.workspaceArtifacts && typeof req.body.workspaceArtifacts === "object"
        ? (req.body.workspaceArtifacts as Record<string, string>)
        : {}
  });
  return res.json(snapshot);
});

app.get("/api/mission/workspaces/:workspaceId/stream", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const workspaceId = String(req.params.workspaceId || "").trim();
  if (!workspaceId) {
    return res.status(400).end();
  }
  subscribeMissionWorkspaceStream(req.user.id, workspaceId, res);
});

app.post("/api/autotrade/positions/close", authRequired, async (req: AuthedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const requestedPositionId = Number(req.body?.positionId || 0);
    const requestedMint = String(req.body?.mint || "").trim();
    const openPositions = listAutoTradePositions(req.user.id, "OPEN");
    if (!openPositions.length) {
      return res.status(404).json({ error: "no open position" });
    }

    const selected =
      openPositions.find((item) => requestedPositionId > 0 && item.id === requestedPositionId) ||
      openPositions.find((item) => requestedMint && item.mint === requestedMint) ||
      openPositions[0];

    if (!selected) {
      return res.status(404).json({ error: "matching open position not found" });
    }

    const market = await fetchRealtimeMarketSnapshot(selected.mint);
    const markPriceUsd = Number(
      market?.priceUsd || selected.lastPriceUsd || selected.entryPriceUsd || 0
    );
    if (!Number.isFinite(markPriceUsd) || markPriceUsd <= 0) {
      return res.status(400).json({ error: "unable to price open position for manual close" });
    }

    const closed = closeAutoTradePosition({
      userId: req.user.id,
      positionId: selected.id,
      markPriceUsd,
      closeReason: "MANUAL_CLOSE"
    });
    if (!closed) {
      return res.status(500).json({ error: "manual close failed" });
    }
    saveAutoTradeEvent({
      userId: req.user.id,
      mode: closed.mode,
      eventType: "MANUAL_CLOSE",
      mint: closed.mint,
      positionId: closed.id,
      closeReason: "MANUAL_CLOSE",
      realizedPnlPct: Number(closed.pnlPct || 0),
      payload: {
        sizeUsd: Number(closed.sizeUsd || 0),
        entryPriceUsd: Number(closed.entryPriceUsd || 0),
        markPriceUsd
      }
    });

    return res.json({
      ok: true,
      ts: new Date().toISOString(),
      position: closed,
      action: {
        type: "CLOSE",
        mint: closed.mint,
        sizeUsd: closed.sizeUsd,
        pnlPct: closed.pnlPct,
        reason: "MANUAL_CLOSE"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/autotrade/halt", authRequired, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const currentPolicy = getAutoTradeConfig(req.user.id);
  const currentExecution = getAutoTradeExecutionConfig(req.user.id);
  const nextPolicy = putAutoTradeConfig(req.user.id, {
    ...currentPolicy,
    enabled: false,
    mode: "paper"
  });
  const nextExecution = putAutoTradeExecutionConfig(req.user.id, {
    ...currentExecution,
    enabled: false,
    mode: "paper"
  });
  saveAutoTradeEvent({
    userId: req.user.id,
    mode: "live",
    eventType: "HALT",
    payload: {
      halted: true,
      source: "operator",
      policyMode: currentPolicy.mode,
      executionMode: currentExecution.mode
    }
  });

  return res.json({
    ok: true,
    ts: new Date().toISOString(),
    halted: true,
    config: nextPolicy,
    executionConfig: nextExecution
  });
});

app.post("/api/autotrade/monitor", authRequired, async (req: AuthedRequest, res) => {
  let lockAcquired = false;
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const nowMs = Date.now();
    const safetyState = getExecutionSafetyState(req.user.id);
    pruneSafetyErrors(safetyState, nowMs);
    lockAcquired = acquireUserExecutionLock(autotradeMonitorLocks, req.user.id);
    if (!lockAcquired) {
      return res.status(429).json({ error: "monitor tick already in progress; retry shortly" });
    }

    const execCfg = getAutoTradeExecutionConfig(req.user.id);
    const strategyBudgetUsd = Number(Math.max(1, Number(execCfg.paperBudgetUsd || 100)).toFixed(2));
    const startupEquity = getStrategyEquitySnapshot(req.user.id, strategyBudgetUsd, safetyState);
    const openPositions = listAutoTradePositions(req.user.id, "OPEN");
    const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
    const liveAllowed = liveEligibility.allowed;
    const monitorMode: "paper" | "live" =
      openPositions.some((position) => position.mode === "live") &&
      LIVE_EXECUTION_ENABLED &&
      liveAllowed
        ? "live"
        : execCfg.mode === "live" &&
            LIVE_EXECUTION_ENABLED &&
            liveAllowed
          ? "live"
          : "paper";
    if (!openPositions.length) {
      const usage = getUsage(req.user.id);
      return res.json({
        ts: new Date().toISOString(),
        mode: monitorMode,
        openCount: 0,
        updatedCount: 0,
        ticks: [],
        positions: [],
        safety: {
          maxTotalExposureUsd: SAFETY_MAX_TOTAL_EXPOSURE_USD,
          maxDailyLossUsd: SAFETY_MAX_DAILY_LOSS_USD,
          maxHourlyLossUsd: SAFETY_MAX_HOURLY_LOSS_USD,
          maxTokenDailyLossUsd: SAFETY_MAX_TOKEN_DAILY_LOSS_USD,
          maxTokenHourlyLossUsd: SAFETY_MAX_TOKEN_HOURLY_LOSS_USD,
          maxLossPerTradeUsd: SAFETY_MAX_LOSS_PER_TRADE_USD,
          maxDrawdownPct: SAFETY_MAX_DRAWDOWN_PCT,
          emergencyHalt: GLOBAL_EMERGENCY_HALT,
          paperBudgetUsd: Number(Math.max(1, Number(execCfg.paperBudgetUsd || 100)).toFixed(2)),
          paperAvailableUsd: Number(Math.max(0, Number(execCfg.paperBudgetUsd || 100)).toFixed(2)),
          openExposureUsd: 0,
          dailyRealizedLossUsd: getDailyRealizedLossUsd(req.user.id, nowMs),
          hourlyRealizedLossUsd: getWindowRealizedLossUsd(req.user.id, 60 * 60 * 1000, nowMs),
          realizedPnlUsd: startupEquity.realizedPnlUsd,
          unrealizedPnlUsd: 0,
          currentEquityUsd: startupEquity.currentEquityUsd,
          peakEquityUsd: startupEquity.peakEquityUsd,
          drawdownPct: startupEquity.drawdownPct,
          lossStreak: getConsecutiveLossStreak(req.user.id),
          pausedUntil: safetyState.pausedUntil ? new Date(safetyState.pausedUntil).toISOString() : null,
          errorCountWindow: safetyState.errorTimestamps.length
        },
        usage
      });
    }

    const monitorLimit = Math.min(15, openPositions.length);
    const requestedSweeps = clampNumber(
      Number(
        req.body?.sweeps ??
          (req.body?.eventDriven ? 3 : 1)
      ),
      1,
      4
    );
    const sweepIntervalMs = clampNumber(Number(req.body?.intervalMs || 250), 100, 2000);
    const liveEnabled = LIVE_EXECUTION_ENABLED;
    const actions: Array<Record<string, unknown>> = [];
    const ticksByPosition = new Map<
      number,
      { positionId: number; mint: string; markPriceUsd: number; pnlPct: number | null }
    >();
    let latestOpen = openPositions.slice();

    for (let sweep = 0; sweep < requestedSweeps; sweep += 1) {
      const selected = latestOpen.slice(0, Math.min(monitorLimit, latestOpen.length));
      if (!selected.length) break;
      const updates = await Promise.allSettled(
        selected.map(async (position) => {
          const market = await fetchRealtimeMarketSnapshot(position.mint);
          const marketRecord = (market as Record<string, unknown>) || {};
          const markPriceUsd = Number(marketRecord.priceUsd || 0);
          if (!Number.isFinite(markPriceUsd) || markPriceUsd <= 0) {
            return null;
          }
          const marked = updateAutoTradePositionMark(req.user!.id, position.id, markPriceUsd);
          if (!marked) return null;

          const entry = Number(marked.entryPriceUsd || 0);
          const highWater = Number(marked.highWaterPriceUsd || markPriceUsd);
          const tpPrice = entry * (1 + Number(marked.tpPct || 0) / 100);
          let slPrice = entry * (1 - Number(marked.slPct || 0) / 100);
          const breakevenTriggerPrice = entry * (1 + BREAKEVEN_TRIGGER_PCT / 100);
          if (markPriceUsd >= breakevenTriggerPrice) {
            slPrice = Math.max(slPrice, entry * (1 + BREAKEVEN_LOCK_PCT / 100));
          }
          const trailingFloor = highWater * (1 - Number(marked.trailingStopPct || 0) / 100);
          const elapsedMinutes = minutesSince(marked.opened_at);
          let closeReason = "";

          if (markPriceUsd <= slPrice) closeReason = "SL_HIT";
          else if (markPriceUsd >= tpPrice) closeReason = "TP_HIT";
          else if (markPriceUsd <= trailingFloor && highWater > entry) closeReason = "TRAILING_STOP";
          else if (elapsedMinutes >= Number(marked.maxHoldMinutes || 0)) closeReason = "MAX_HOLD_TIME";

          if (closeReason) {
            const spreadBps =
              Number(marketRecord.estimatedSpreadBps || 0) > 0
                ? Number(marketRecord.estimatedSpreadBps)
                : estimateSpreadBps(
                    Number(marketRecord.liquidityUsd || 0),
                    Number(marketRecord.volume24hUsd || 0)
                  );
            const closeFill = simulateExecutionFill({
              side: "SELL",
              mode: marked.mode,
              referencePriceUsd: markPriceUsd,
              requestedNotionalUsd: Number(marked.sizeUsd || 0),
              spreadBps,
              volatilityIndex: null,
              pollIntervalSec: 2
            });
            const effectiveClosePrice = Number(closeFill.fillPriceUsd || markPriceUsd);

            if (marked.mode === "live" && liveEnabled) {
              try {
                const sellResponse = await executeUltraSell({
                  mint: marked.mint,
                  traderWallet: req.user!.wallet
                });
                actions.push({
                  type: "LIVE_SELL",
                  positionId: marked.id,
                  mint: marked.mint,
                  markPriceUsd,
                  closeFillPriceUsd: effectiveClosePrice,
                  entryPriceUsd: marked.entryPriceUsd,
                  sizeUsd: marked.sizeUsd,
                  signature: String(
                    (sellResponse.execution as Record<string, unknown>)?.signature || ""
                  ),
                  status: String((sellResponse.execution as Record<string, unknown>)?.status || "UNKNOWN")
                });
              } catch (error) {
                recordExecutionError(req.user!.id);
                actions.push({
                  type: "ERROR",
                  positionId: marked.id,
                  mint: marked.mint,
                  reason: `live sell failed: ${(error as Error).message}`
                });
                return {
                  positionId: marked.id,
                  mint: marked.mint,
                  markPriceUsd,
                  pnlPct: marked.pnlPct
                };
              }
              recordExecutionSuccess(req.user!.id);
            }

            const closed = closeAutoTradePosition({
              userId: req.user!.id,
              positionId: marked.id,
              markPriceUsd: effectiveClosePrice,
              closeReason
            });
            if (closed) {
              const meta = positionExecutionMeta.get(closed.id);
              const exitNotionalUsd = Number((Number(closed.qtyTokens || 0) * effectiveClosePrice).toFixed(4));
              const attribution = computePnlAttribution({
                entryNotionalUsd: Number(closed.sizeUsd || 0),
                exitNotionalUsd,
                entryReferencePriceUsd: Number(meta?.entryReferencePriceUsd || closed.entryPriceUsd || 0),
                exitReferencePriceUsd: markPriceUsd,
                entryFillCostUsd: Number(meta?.entryFillCostUsd || 0),
                exitFillCostUsd: Number(closeFill.totalCostUsd || 0)
              });
              positionExecutionMeta.delete(closed.id);
              actions.push({
                type: "CLOSE",
                positionId: closed.id,
                mint: closed.mint,
                reason: closeReason,
                markPriceUsd,
                exitFillPriceUsd: effectiveClosePrice,
                entryPriceUsd: closed.entryPriceUsd,
                sizeUsd: closed.sizeUsd,
                pnlPct: Number((closed.pnlPct || 0).toFixed(2)),
                realizedAfterCostsPct: Number(attribution.netRealizedPct || 0),
                expectedPnlPct: Number(meta?.expectedPnlPct || 0),
                attribution,
                mode: closed.mode
              });
            }
            return null;
          }

          return {
            positionId: marked.id,
            mint: marked.mint,
            markPriceUsd,
            pnlPct: marked.pnlPct
          };
        })
      );

      for (const entry of updates) {
        if (entry.status !== "fulfilled") continue;
        if (!entry.value) continue;
        ticksByPosition.set(entry.value.positionId, entry.value);
      }

      latestOpen = listAutoTradePositions(req.user.id, "OPEN");
      if (!latestOpen.length) break;
      if (sweep < requestedSweeps - 1) {
        await new Promise((resolve) => setTimeout(resolve, sweepIntervalMs));
      }
    }

    const ticks = Array.from(ticksByPosition.values());

    const usage = getUsage(req.user.id);
    latestOpen = listAutoTradePositions(req.user.id, "OPEN");
    const openExposureUsd = Number(
      latestOpen.reduce((sum, position) => sum + Number(position.sizeUsd || 0), 0).toFixed(2)
    );
    const paperBudgetUsd = Number(Math.max(1, Number(execCfg.paperBudgetUsd || 100)).toFixed(2));
    const paperAvailableUsd = Number(Math.max(0, paperBudgetUsd - openExposureUsd).toFixed(2));
    const dailyRealizedLossUsd = getDailyRealizedLossUsd(req.user.id);
    const hourlyRealizedLossUsd = getWindowRealizedLossUsd(req.user.id, 60 * 60 * 1000);
    const latestSafetyState = getExecutionSafetyState(req.user.id);
    pruneSafetyErrors(latestSafetyState);
    const equity = getStrategyEquitySnapshot(req.user.id, paperBudgetUsd, latestSafetyState);
    const lossStreak = getConsecutiveLossStreak(req.user.id);
    persistAutoTradeActions(req.user.id, monitorMode, actions, {
      endpoint: "/api/autotrade/monitor"
    });
    return res.json({
      ts: new Date().toISOString(),
      mode: monitorMode,
      openCount: latestOpen.length,
      sweeps: requestedSweeps,
      updatedCount: ticks.length,
      ticks,
      actions,
      positions: latestOpen,
      safety: {
        maxTotalExposureUsd: SAFETY_MAX_TOTAL_EXPOSURE_USD,
        maxDailyLossUsd: SAFETY_MAX_DAILY_LOSS_USD,
        maxHourlyLossUsd: SAFETY_MAX_HOURLY_LOSS_USD,
        maxTokenDailyLossUsd: SAFETY_MAX_TOKEN_DAILY_LOSS_USD,
        maxTokenHourlyLossUsd: SAFETY_MAX_TOKEN_HOURLY_LOSS_USD,
        maxLossPerTradeUsd: SAFETY_MAX_LOSS_PER_TRADE_USD,
        maxDrawdownPct: SAFETY_MAX_DRAWDOWN_PCT,
        emergencyHalt: GLOBAL_EMERGENCY_HALT,
        paperBudgetUsd,
        paperAvailableUsd,
        openExposureUsd,
        dailyRealizedLossUsd,
        hourlyRealizedLossUsd,
        realizedPnlUsd: equity.realizedPnlUsd,
        unrealizedPnlUsd: equity.unrealizedPnlUsd,
        currentEquityUsd: equity.currentEquityUsd,
        peakEquityUsd: equity.peakEquityUsd,
        drawdownPct: equity.drawdownPct,
        lossStreak,
        pausedUntil: latestSafetyState.pausedUntil
          ? new Date(latestSafetyState.pausedUntil).toISOString()
          : null,
        errorCountWindow: latestSafetyState.errorTimestamps.length
      },
      usage
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  } finally {
    if (lockAcquired && req.user) {
      releaseUserExecutionLock(autotradeMonitorLocks, req.user.id);
    }
  }
});

app.post(
  "/api/autotrade/engine/tick",
  authRequired,
  async (req: AuthedRequest, res) => {
    let lockAcquired = false;
    try {
      if (!req.user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      lockAcquired = acquireUserExecutionLock(autotradeTickLocks, req.user.id);
      if (!lockAcquired) {
        return res.status(429).json({ error: "engine tick already in progress; retry shortly" });
      }

      const policy = getAutoTradeConfig(req.user.id);
      const execCfg = getAutoTradeExecutionConfig(req.user.id);
      if (!execCfg.enabled) {
        return res.status(400).json({ error: "execution engine is disabled", config: execCfg });
      }

      const liveEnabled = LIVE_EXECUTION_ENABLED;
      const liveEligibility = getLiveEligibility(req.user.plan, req.user.wallet);
      if ((execCfg.mode === "live" || policy.mode === "live") && !liveEligibility.allowed) {
        return res
          .status(403)
          .json(
            liveEligibility.reason === "internal_wallet_required"
              ? internalWalletRequiredResponse()
              : premiumRequiredResponse()
          );
      }
      const baseModeState = getEffectiveMode(policy, execCfg, req.user.plan, req.user.wallet);
      const modeState = PAPER_ONLY_MODE
        ? {
            mode: "paper" as const,
            warnings: [...baseModeState.warnings, "paper-only mode enabled: live execution is disabled"]
          }
        : baseModeState;
      const executionMode: "paper" | "live" =
        modeState.mode === "live" && liveEnabled && !PAPER_ONLY_MODE ? "live" : "paper";
      if (executionMode === "live" && GLOBAL_EMERGENCY_HALT) {
        return res.status(423).json({
          error: "global emergency halt is active; live execution ticks are blocked",
          code: "GLOBAL_EMERGENCY_HALT",
          live: {
            executionEnabled: LIVE_EXECUTION_ENABLED,
            paperOnlyMode: PAPER_ONLY_MODE,
            emergencyHalt: GLOBAL_EMERGENCY_HALT
          }
        });
      }
      const nowMs = Date.now();
      const safetyState = getExecutionSafetyState(req.user.id);
      pruneSafetyErrors(safetyState, nowMs);
      const modeWarnings = modeState.warnings.slice();
      if (modeState.mode === "live" && !liveEnabled) {
        modeWarnings.push(
          "live mode requested but ENIGMA_EXECUTION_ENABLED!=1, downgraded to paper simulation"
        );
      }
      const effectiveTradeAmountUsd = getEffectiveTradeAmountUsd(policy, execCfg);

      const agentMint = resolveSingleAgentMint(
        String(req.body.mint || ""),
        String(req.body.mints || "")
      );
      if (!agentMint) {
        return res.status(400).json({ error: "exactly one valid agent token is required (Solana mint, BTC, ETH)" });
      }
      const mints = [agentMint];
      const fallbackKey = entryFallbackKey(req.user.id, agentMint);

      const actions: Array<Record<string, unknown>> = [];
      const openBefore = listAutoTradePositions(req.user.id, "OPEN");
      let openPositions = openBefore.slice();

      for (const position of openPositions) {
        const built = await buildStoredSignal(req.user.id, position.mint);
        const market = (built.signal.market as Record<string, unknown>) || {};
        const openDecision = buildAutoTradeDecision({
          mint: position.mint,
          signalId: built.signalId,
          signal: built.signal,
          config: policy
        });
        const markPrice = Number(market.priceUsd || 0);
        if (!Number.isFinite(markPrice) || markPrice <= 0) {
          continue;
        }

        const marked = updateAutoTradePositionMark(req.user.id, position.id, markPrice) || position;
        const entry = Number(marked.entryPriceUsd || 0);
        const highWater = Number(marked.highWaterPriceUsd || markPrice);
        const elapsedMinutes = minutesSince(marked.opened_at);
        const exitPct = resolveAdaptiveExitPercents(
          {
            ...execCfg,
            tpPct: Number(marked.tpPct || execCfg.tpPct),
            slPct: Number(marked.slPct || execCfg.slPct),
            trailingStopPct: Number(marked.trailingStopPct || execCfg.trailingStopPct)
          },
          openDecision
        );
        const tpPrice = entry * (1 + exitPct.tpPct / 100);
        let slPrice = entry * (1 - exitPct.slPct / 100);
        const breakevenTriggerPrice = entry * (1 + BREAKEVEN_TRIGGER_PCT / 100);
        if (markPrice >= breakevenTriggerPrice) {
          slPrice = Math.max(slPrice, entry * (1 + BREAKEVEN_LOCK_PCT / 100));
        }
        const trailingFloor = highWater * (1 - exitPct.trailingStopPct / 100);
        let closeReason = "";

        if (markPrice <= slPrice) closeReason = "SL_HIT";
        else if (markPrice >= tpPrice) closeReason = "TP_HIT";
        else if (markPrice <= trailingFloor && highWater > entry) closeReason = "TRAILING_STOP";
        else if (elapsedMinutes >= Number(marked.maxHoldMinutes || 0)) closeReason = "MAX_HOLD_TIME";
        else if (SAFETY_EXIT_ON_HOSTILE_REGIME && openDecision.regimePolicy?.hostile) closeReason = "REGIME_KILL_SWITCH";

        if (closeReason) {
          const spreadBps =
            Number(openDecision.market?.spreadBps || 0) > 0
              ? Number(openDecision.market?.spreadBps || 0)
              : estimateSpreadBps(Number(market.liquidityUsd || 0), Number(market.volume24hUsd || 0));
          const closeFill = simulateExecutionFill({
            side: "SELL",
            mode: executionMode,
            referencePriceUsd: markPrice,
            requestedNotionalUsd: Number(marked.sizeUsd || 0),
            spreadBps,
            volatilityIndex: Number(openDecision.marketRegime?.volatilityIndex ?? NaN),
            pollIntervalSec: Number(execCfg.pollIntervalSec || 5)
          });
          const effectiveClosePrice = Number(closeFill.fillPriceUsd || markPrice);

          if (executionMode === "live") {
            try {
              const sellResponse = await executeUltraSell({
                mint: marked.mint,
                traderWallet: req.user.wallet
              });
              actions.push({
                type: "LIVE_SELL",
                positionId: marked.id,
                mint: marked.mint,
                markPriceUsd: markPrice,
                closeFillPriceUsd: effectiveClosePrice,
                entryPriceUsd: marked.entryPriceUsd,
                sizeUsd: marked.sizeUsd,
                signature: String((sellResponse.execution as Record<string, unknown>)?.signature || ""),
                status: String((sellResponse.execution as Record<string, unknown>)?.status || "UNKNOWN")
              });
              recordExecutionSuccess(req.user.id);
            } catch (error) {
              recordExecutionError(req.user.id);
              actions.push({
                type: "ERROR",
                positionId: marked.id,
                mint: marked.mint,
                reason: `live sell failed: ${(error as Error).message}`
              });
              continue;
            }
          }

          const closed = closeAutoTradePosition({
            userId: req.user.id,
            positionId: marked.id,
            markPriceUsd: effectiveClosePrice,
            closeReason
          });
          if (closed) {
            const entryMeta = positionExecutionMeta.get(closed.id);
            const exitNotionalUsd = Number(
              (Number(closed.qtyTokens || 0) * Number(effectiveClosePrice || 0)).toFixed(4)
            );
            const attribution = computePnlAttribution({
              entryNotionalUsd: Number(closed.sizeUsd || 0),
              exitNotionalUsd,
              entryReferencePriceUsd: Number(entryMeta?.entryReferencePriceUsd || closed.entryPriceUsd || 0),
              exitReferencePriceUsd: markPrice,
              entryFillCostUsd: Number(entryMeta?.entryFillCostUsd || 0),
              exitFillCostUsd: Number(closeFill.totalCostUsd || 0)
            });
            positionExecutionMeta.delete(closed.id);
            actions.push({
              type: "CLOSE",
              positionId: closed.id,
              mint: closed.mint,
              reason: closeReason,
              markPriceUsd: markPrice,
              exitFillPriceUsd: effectiveClosePrice,
              entryPriceUsd: closed.entryPriceUsd,
              sizeUsd: closed.sizeUsd,
              pnlPct: Number((closed.pnlPct || 0).toFixed(2)),
              expectedPnlPct: Number(entryMeta?.expectedPnlPct || 0),
              realizedAfterCostsPct: Number(attribution.netRealizedPct || 0),
              attribution,
              mode: executionMode
            });
          }
        }
      }

      openPositions = listAutoTradePositions(req.user.id, "OPEN");
      if (openPositions.length > 0) {
        entryFallbackState.delete(fallbackKey);
      }
      const capacity = Math.max(0, Number(execCfg.maxOpenPositions || 0) - openPositions.length);
      let decisions: Array<{ ok: boolean } & AutoTradeDecision> = [];
      const openExposureUsd = Number(
        openPositions.reduce((sum, position) => sum + Number(position.sizeUsd || 0), 0).toFixed(2)
      );
      const paperBudgetUsd = Number(
        Math.max(effectiveTradeAmountUsd, Number(execCfg.paperBudgetUsd || 100)).toFixed(2)
      );
      const paperAvailableUsd = Number(Math.max(0, paperBudgetUsd - openExposureUsd).toFixed(2));
      const dailyRealizedLossUsd = getDailyRealizedLossUsd(req.user.id, nowMs);
      const equity = getStrategyEquitySnapshot(req.user.id, paperBudgetUsd, safetyState);
      const drawdownLimitReached =
        executionMode === "live" && equity.drawdownPct >= SAFETY_MAX_DRAWDOWN_PCT;
      if (drawdownLimitReached) {
        safetyState.pausedUntil = Math.max(
          safetyState.pausedUntil,
          nowMs + SAFETY_DRAWDOWN_PAUSE_SEC * 1000
        );
      }
      const safetyPaused =
        executionMode === "live" && safetyState.pausedUntil > nowMs;
      const lossLimitReached =
        executionMode === "live" && dailyRealizedLossUsd >= SAFETY_MAX_DAILY_LOSS_USD;
      const remainingExposureUsd = Number(
        Math.max(0, SAFETY_MAX_TOTAL_EXPOSURE_USD - openExposureUsd).toFixed(2)
      );
      const exposureCapacity =
        executionMode === "live"
          ? Math.max(0, Math.floor(remainingExposureUsd / Math.max(0.0001, effectiveTradeAmountUsd)))
          : Math.max(0, Math.floor(paperAvailableUsd / Math.max(0.0001, effectiveTradeAmountUsd)));

      if (capacity > 0 && policy.enabled) {
        decisions = await evaluateAutoTradeDecisions(
          req.user.id,
          mints,
          policy
        );

        const primary = decisions.find((item) => item.ok && item.mint === agentMint);
        const primaryRegimeHostile = Boolean(primary?.regimePolicy?.hostile);
        const hourlyLossUsd = getWindowRealizedLossUsd(req.user.id, 60 * 60 * 1000, nowMs);
        const tokenHourlyLossUsd = getTokenWindowRealizedLossUsd(
          req.user.id,
          agentMint,
          60 * 60 * 1000,
          nowMs
        );
        const tokenDailyLossUsd = getTokenWindowRealizedLossUsd(
          req.user.id,
          agentMint,
          24 * 60 * 60 * 1000,
          nowMs
        );
        const lossStreak = getConsecutiveLossStreak(req.user.id);
        if (lossStreak >= SAFETY_LOSS_STREAK_THRESHOLD) {
          safetyState.pausedUntil = Math.max(
            safetyState.pausedUntil,
            nowMs + SAFETY_LOSS_STREAK_PAUSE_SEC * 1000
          );
        }

        const lastOpenedAt = openPositions.length
          ? Math.max(...openPositions.map((item) => Date.parse(item.opened_at) || 0))
          : 0;
        const cooldownReady = Date.now() - lastOpenedAt >= Number(execCfg.cooldownSec || 0) * 1000;

        if (safetyPaused) {
          actions.push({
            type: "INFO",
            note: `safety pause active until ${new Date(safetyState.pausedUntil).toLocaleTimeString()}`
          });
        } else if (hourlyLossUsd >= SAFETY_MAX_HOURLY_LOSS_USD) {
          actions.push({
            type: "INFO",
            note: `hourly loss cap reached (${SAFETY_MAX_HOURLY_LOSS_USD} USD), no new positions opened`
          });
        } else if (tokenHourlyLossUsd >= SAFETY_MAX_TOKEN_HOURLY_LOSS_USD) {
          actions.push({
            type: "INFO",
            note: `token hourly loss cap reached (${SAFETY_MAX_TOKEN_HOURLY_LOSS_USD} USD), no new positions opened`
          });
        } else if (tokenDailyLossUsd >= SAFETY_MAX_TOKEN_DAILY_LOSS_USD) {
          actions.push({
            type: "INFO",
            note: `token daily loss cap reached (${SAFETY_MAX_TOKEN_DAILY_LOSS_USD} USD), no new positions opened`
          });
        } else if (lossStreak >= SAFETY_LOSS_STREAK_THRESHOLD) {
          actions.push({
            type: "INFO",
            note: `loss streak pause active (${lossStreak} consecutive losses)`
          });
        } else if (lossLimitReached) {
          actions.push({
            type: "INFO",
            note: `daily loss cap reached (${SAFETY_MAX_DAILY_LOSS_USD} USD), no new positions opened`
          });
        } else if (drawdownLimitReached) {
          actions.push({
            type: "INFO",
            note: `drawdown kill-switch active (${equity.drawdownPct}% >= ${SAFETY_MAX_DRAWDOWN_PCT}%), no new positions opened`
          });
        } else if (SAFETY_EXIT_ON_HOSTILE_REGIME && primaryRegimeHostile) {
          actions.push({
            type: "INFO",
            note: "global regime kill-switch active (hostile regime), no new positions opened"
          });
        } else if (executionMode === "live" && exposureCapacity <= 0) {
          actions.push({
            type: "INFO",
            note: `exposure cap reached (${SAFETY_MAX_TOTAL_EXPOSURE_USD} USD), no new positions opened`
          });
        } else if (executionMode === "paper" && exposureCapacity <= 0) {
          actions.push({
            type: "INFO",
            note: `paper budget fully allocated (${paperBudgetUsd} USD), waiting for position exits`
          });
        } else if (cooldownReady) {
          const slotCap = Math.max(0, Math.min(capacity, Math.max(0, exposureCapacity)));
          let availableEntryBudgetUsd =
            executionMode === "live" ? remainingExposureUsd : paperAvailableUsd;
          const candidateEntries: Array<{
            candidate: { ok: boolean } & AutoTradeDecision;
            trigger: ReturnType<typeof chooseAdaptiveEntryTrigger>;
          }> = [];

          if (slotCap > 0 && primary && primary.ok) {
            const state = entryFallbackState.get(fallbackKey) || {
              startedAt: nowMs,
              lastSeenAt: nowMs,
              cycles: 0
            };
            state.lastSeenAt = nowMs;
            state.cycles = Number.isFinite(state.cycles) ? state.cycles : 0;
            const timeoutSec = resolveAdaptiveEntryTimeoutSec(execCfg, primary);
            const elapsedSec = Math.max(0, Math.floor((nowMs - state.startedAt) / 1000));

            const tradePlan = (primary.tradePlan || {}) as Record<string, unknown>;
            const buyZone = (tradePlan.buyZone as Record<string, unknown>) || {};
            const support = Array.isArray(tradePlan.support) ? tradePlan.support : [];
            const resistance = Array.isArray(tradePlan.resistance) ? tradePlan.resistance : [];
            const trigger = chooseAdaptiveEntryTrigger({
              marketPriceUsd: Number(primary.entryPriceUsd || primary.market?.priceUsd || 0),
              buyZoneLow: Number(buyZone.low || 0),
              buyZoneHigh: Number(buyZone.high || 0),
              resistance1: Number(resistance[0] || 0),
              support1: Number(support[0] || 0),
              change5mPct: Number(primary.market?.priceChange5mPct || 0),
              breakoutMinMove5mPct: ENTRY_BREAKOUT_5M_PCT,
              adx: Number(primary.marketRegime?.adx ?? NaN),
              volatilityIndex: Number(primary.marketRegime?.volatilityIndex ?? NaN),
              elapsedSec,
              timeoutSec,
              fallbackCycle: state.cycles
            });

            const minConfidenceForFallback = Math.max(
              ENTRY_FALLBACK_CONFIDENCE_FLOOR,
              ENTRY_FALLBACK_MIN_CONFIDENCE - state.cycles * ENTRY_FALLBACK_CONFIDENCE_DECAY
            );
            const confidenceReady = Number(primary.confidence || 0) >= minConfidenceForFallback;
            const statusFallbackAllowed =
              String(primary.signalStatus || "") !== "HIGH_RISK" || policy.allowHighRiskEntries;

            const directReady = primary.decision === "BUY_CANDIDATE" && trigger.trigger !== "none";
            const timeoutReady =
              trigger.trigger === "timeout" && confidenceReady && statusFallbackAllowed;

            if (directReady || timeoutReady) {
              candidateEntries.push({ candidate: primary, trigger });
              if (trigger.trigger === "timeout") {
                state.cycles += 1;
              } else {
                state.cycles = 0;
              }
              state.startedAt = nowMs;
            } else {
              const waitRemainingSec = Math.max(0, timeoutSec - elapsedSec);
              actions.push({
                type: "INFO",
                note: `${trigger.note}: timeout in ${waitRemainingSec}s (conf ${Number(
                  primary.confidence || 0
                ).toFixed(2)} / need ${minConfidenceForFallback.toFixed(2)})`
              });
            }

            entryFallbackState.set(fallbackKey, state);
          }

          for (const entry of candidateEntries.slice(0, slotCap)) {
            if (!Number.isFinite(availableEntryBudgetUsd) || availableEntryBudgetUsd < 1) {
              actions.push({
                type: "INFO",
                note:
                  executionMode === "paper"
                    ? "paper budget exhausted for this cycle"
                    : "exposure cap exhausted for this cycle"
              });
              break;
            }
            const candidate = entry.candidate;
            const entryPrice = Number(candidate.entryPriceUsd || candidate.market?.priceUsd || 0);
            if (!Number.isFinite(entryPrice) || entryPrice <= 0) continue;
            const tradePlan = (candidate.tradePlan || {}) as Record<string, unknown>;
            const support = Array.isArray(tradePlan.support) ? tradePlan.support : [];
            const stopLoss = firstPositiveNumber([
              tradePlan.stopLoss,
              support[1],
              support[0],
              entryPrice * (1 - Number(execCfg.slPct || 0) / 100)
            ]);
            const spreadBps = Number(candidate.market?.spreadBps || 0);
            const maxPositionCapUsd = Number(
              Math.min(
                effectiveTradeAmountUsd,
                availableEntryBudgetUsd > 0 ? availableEntryBudgetUsd : effectiveTradeAmountUsd
              ).toFixed(2)
            );
            const sizing = computeDynamicPositionSize({
              entryPriceUsd: entryPrice,
              stopPriceUsd: stopLoss,
              maxPositionCapUsd,
              maxRiskPerTradeUsd: Math.min(SAFETY_MAX_LOSS_PER_TRADE_USD, maxPositionCapUsd),
              spreadBps,
              volatilityIndex: Number(candidate.marketRegime?.volatilityIndex ?? NaN),
              regimeRiskMultiplier: Number(candidate.regimePolicy?.riskMultiplier || 1)
            });
            const triggerMultiplier = Math.max(0.1, Number(entry.trigger.sizeMultiplier || 1));
            let requestedAmountUsd = Number((sizing.sizeUsd * triggerMultiplier).toFixed(2));
            requestedAmountUsd = Number(
              Math.min(requestedAmountUsd, maxPositionCapUsd, remainingExposureUsd || requestedAmountUsd).toFixed(2)
            );
            if (!Number.isFinite(requestedAmountUsd) || requestedAmountUsd < 1) continue;

            if (executionMode === "live") {
              try {
                const buyResponse = await executeUltraBuy({
                  outputMint: candidate.mint,
                  amountUsd: requestedAmountUsd,
                  traderWallet: req.user.wallet
                });
                actions.push({
                  type: "LIVE_BUY",
                  mint: candidate.mint,
                  requestedAmountUsd,
                  signature: String((buyResponse.execution as Record<string, unknown>)?.signature || ""),
                  status: String((buyResponse.execution as Record<string, unknown>)?.status || "UNKNOWN")
                });
                recordExecutionSuccess(req.user.id);
              } catch (error) {
                recordExecutionError(req.user.id);
                actions.push({
                  type: "ERROR",
                  mint: candidate.mint,
                  reason: `live buy failed: ${(error as Error).message}`
                });
                continue;
              }
            }

            const fill = simulateExecutionFill({
              side: "BUY",
              mode: executionMode,
              referencePriceUsd: entryPrice,
              requestedNotionalUsd: requestedAmountUsd,
              spreadBps,
              volatilityIndex: Number(candidate.marketRegime?.volatilityIndex ?? NaN),
              pollIntervalSec: Number(execCfg.pollIntervalSec || 5)
            });
            const executedNotionalUsd = Number(fill.executedNotionalUsd || 0);
            if (!Number.isFinite(executedNotionalUsd) || executedNotionalUsd < 1) continue;
            availableEntryBudgetUsd = Number(
              Math.max(0, availableEntryBudgetUsd - executedNotionalUsd).toFixed(2)
            );
            const fillPrice = Number(fill.fillPriceUsd || entryPrice);
            const qty = Number((executedNotionalUsd / fillPrice).toFixed(8));
            const adaptiveExit = resolveAdaptiveExitPercents(execCfg, candidate);
            const created = createAutoTradePosition({
              userId: req.user.id,
              mint: candidate.mint,
              mode: executionMode,
              entrySignalId: candidate.signalId || null,
              entryPriceUsd: fillPrice,
              sizeUsd: executedNotionalUsd,
              qtyTokens: qty,
              tpPct: adaptiveExit.tpPct,
              slPct: adaptiveExit.slPct,
              trailingStopPct: adaptiveExit.trailingStopPct,
              maxHoldMinutes: Number(execCfg.maxHoldMinutes || 0)
            });
            positionExecutionMeta.set(created.id, {
              entryReferencePriceUsd: entryPrice,
              entryFillCostUsd: Number(fill.totalCostUsd || 0),
              expectedPnlPct: projectDecisionPnlPct(
                Number(candidate.patternScore || 0),
                Number(candidate.confidence || 0)
              )
            });

            actions.push({
              type: "OPEN",
              positionId: created.id,
              mint: created.mint,
              trigger: entry.trigger.trigger,
              strategy: candidate.regimePolicy?.style || "TREND",
              entryPriceUsd: created.entryPriceUsd,
              referencePriceUsd: entryPrice,
              sizeUsd: created.sizeUsd,
              qtyTokens: created.qtyTokens,
              spreadBps: Number(spreadBps || 0),
              stopDistancePct: Number(sizing.stopDistancePct || 0),
              riskBudgetUsd: Number(sizing.riskBudgetUsd || 0),
              expectedPnlPct: projectDecisionPnlPct(
                Number(candidate.patternScore || 0),
                Number(candidate.confidence || 0)
              ),
              executionCostsUsd: Number(fill.totalCostUsd || 0),
              fillRatio: Number(fill.fillRatio || 1),
              mode: executionMode,
              note: `${entry.trigger.note}; policy ${candidate.regimePolicy?.style || "N/A"}`
            });
          }
        } else {
          actions.push({
            type: "INFO",
            note: `cooldown active (${execCfg.cooldownSec}s), no new positions opened`
          });
        }
      }

      const usage = incrementUsage(req.user.id, "signal_calls");
      const openAfter = listAutoTradePositions(req.user.id, "OPEN");
      const closedRecent = listAutoTradePositions(req.user.id, "CLOSED").slice(0, 10);
      const openExposureAfterUsd = Number(
        openAfter.reduce((sum, position) => sum + Number(position.sizeUsd || 0), 0).toFixed(2)
      );
      const paperAvailableAfterUsd = Number(
        Math.max(0, Math.max(effectiveTradeAmountUsd, Number(execCfg.paperBudgetUsd || 100)) - openExposureAfterUsd).toFixed(2)
      );
      const dailyRealizedLossAfterUsd = getDailyRealizedLossUsd(req.user.id);
      const hourlyRealizedLossAfterUsd = getWindowRealizedLossUsd(req.user.id, 60 * 60 * 1000);
      const tokenDailyRealizedLossAfterUsd = getTokenWindowRealizedLossUsd(
        req.user.id,
        agentMint,
        24 * 60 * 60 * 1000
      );
      const tokenHourlyRealizedLossAfterUsd = getTokenWindowRealizedLossUsd(
        req.user.id,
        agentMint,
        60 * 60 * 1000
      );
      const lossStreakAfter = getConsecutiveLossStreak(req.user.id);
      const latestSafetyState = getExecutionSafetyState(req.user.id);
      pruneSafetyErrors(latestSafetyState);
      persistAutoTradeActions(req.user.id, executionMode, actions, {
        endpoint: "/api/autotrade/engine/tick"
      });

      return res.json({
        ts: new Date().toISOString(),
        mode: executionMode,
        warnings: modeWarnings,
        policy,
        executionConfig: execCfg,
        effectiveTradeAmountUsd,
        scanned: mints.length,
        decisions,
        actions,
        positions: {
          openCount: openAfter.length,
          open: openAfter,
          recentlyClosed: closedRecent
        },
        safety: {
          maxTotalExposureUsd: SAFETY_MAX_TOTAL_EXPOSURE_USD,
          maxDailyLossUsd: SAFETY_MAX_DAILY_LOSS_USD,
          maxHourlyLossUsd: SAFETY_MAX_HOURLY_LOSS_USD,
          maxTokenDailyLossUsd: SAFETY_MAX_TOKEN_DAILY_LOSS_USD,
          maxTokenHourlyLossUsd: SAFETY_MAX_TOKEN_HOURLY_LOSS_USD,
          maxLossPerTradeUsd: SAFETY_MAX_LOSS_PER_TRADE_USD,
          maxDrawdownPct: SAFETY_MAX_DRAWDOWN_PCT,
          emergencyHalt: GLOBAL_EMERGENCY_HALT,
          paperBudgetUsd: Number(Math.max(effectiveTradeAmountUsd, Number(execCfg.paperBudgetUsd || 100)).toFixed(2)),
          paperAvailableUsd: paperAvailableAfterUsd,
          openExposureUsd: openExposureAfterUsd,
          dailyRealizedLossUsd: dailyRealizedLossAfterUsd,
          hourlyRealizedLossUsd: hourlyRealizedLossAfterUsd,
          tokenDailyRealizedLossUsd: tokenDailyRealizedLossAfterUsd,
          tokenHourlyRealizedLossUsd: tokenHourlyRealizedLossAfterUsd,
          realizedPnlUsd: equity.realizedPnlUsd,
          unrealizedPnlUsd: equity.unrealizedPnlUsd,
          currentEquityUsd: equity.currentEquityUsd,
          peakEquityUsd: equity.peakEquityUsd,
          drawdownPct: equity.drawdownPct,
          lossStreak: lossStreakAfter,
          pausedUntil: latestSafetyState.pausedUntil
            ? new Date(latestSafetyState.pausedUntil).toISOString()
            : null,
          errorCountWindow: latestSafetyState.errorTimestamps.length
        },
        usage
      });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    } finally {
      if (lockAcquired && req.user) {
        releaseUserExecutionLock(autotradeTickLocks, req.user.id);
      }
    }
  }
);

app.get("*", (_req, res) => {
  res.sendFile(resolve(publicDir, "index.html"));
});

function startServer(port: number, retriesLeft = 10): void {
  const server = app.listen(port, host, () => {
    console.log(`KOBECOIN AI Guardian web running at http://localhost:${port}`);
    console.log(
      `[config] mode=${runtimeConfig.mode} rpc=${runtimeConfig.hasRpc ? "configured" : "missing"}`
    );
    if (process.env.CODESPACE_NAME) {
      const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
      console.log(`Codespaces URL: https://${process.env.CODESPACE_NAME}-${port}.${domain}`);
    }
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && retriesLeft > 0) {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1, retriesLeft - 1);
      return;
    }

    if (error.code === "EADDRINUSE") {
      console.error(`No available port from ${startPort} to ${port}. Set PORT in .env and retry.`);
      process.exit(1);
    }

    console.error(error);
    process.exit(1);
  });
}

startServer(startPort);
