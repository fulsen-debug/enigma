export type RegimeStyle = "BREAKOUT" | "TREND" | "MEAN_REVERT" | "NO_TRADE";

export interface RegimePolicyInput {
  adx: number | null;
  volatilityIndex: number | null;
  liquidityUsd: number;
  participation: number;
  connectedHolderPct: number;
  spreadBps: number;
}

export interface RegimePolicyDecision {
  style: RegimeStyle;
  allowEntry: boolean;
  hostile: boolean;
  riskMultiplier: number;
  strategyHint: string;
  reason: string;
}

export interface AdaptiveEntryInput {
  marketPriceUsd: number;
  buyZoneLow: number;
  buyZoneHigh: number;
  resistance1: number;
  support1: number;
  change5mPct: number;
  breakoutMinMove5mPct?: number;
  adx: number | null;
  volatilityIndex: number | null;
  elapsedSec: number;
  timeoutSec: number;
  fallbackCycle: number;
}

export interface AdaptiveEntryDecision {
  trigger: "pullback" | "momentum" | "timeout" | "none";
  sizeMultiplier: number;
  note: string;
}

export interface DynamicPositionInput {
  entryPriceUsd: number;
  stopPriceUsd: number;
  maxPositionCapUsd: number;
  maxRiskPerTradeUsd: number;
  spreadBps: number;
  volatilityIndex: number | null;
  regimeRiskMultiplier: number;
}

export interface DynamicPositionOutput {
  sizeUsd: number;
  stopDistancePct: number;
  riskBudgetUsd: number;
  appliedMultiplier: number;
}

export interface FillSimulationInput {
  side: "BUY" | "SELL";
  mode: "paper" | "live";
  referencePriceUsd: number;
  requestedNotionalUsd: number;
  spreadBps: number;
  volatilityIndex: number | null;
  pollIntervalSec: number;
}

export interface FillSimulationResult {
  fillPriceUsd: number;
  executedNotionalUsd: number;
  fillRatio: number;
  slippageCostUsd: number;
  feeCostUsd: number;
  latencyCostUsd: number;
  totalCostUsd: number;
}

export interface PnlAttributionInput {
  entryNotionalUsd: number;
  exitNotionalUsd: number;
  entryReferencePriceUsd: number;
  exitReferencePriceUsd: number;
  entryFillCostUsd: number;
  exitFillCostUsd: number;
}

export interface PnlAttributionResult {
  grossEdgeUsd: number;
  slippageFeeLatencyUsd: number;
  netRealizedUsd: number;
  netRealizedPct: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function estimateSpreadBps(liquidityUsd: number, volume24hUsd: number): number {
  const liquidity = Math.max(1, Number(liquidityUsd || 0));
  const volume = Math.max(0, Number(volume24hUsd || 0));
  // Higher liquidity and participation tends to tighten spread in DEX environments.
  const participation = volume / liquidity;
  const raw = 85 - Math.log10(liquidity) * 9 - participation * 6;
  return Number(clamp(raw, 8, 220).toFixed(2));
}

export function deriveRegimePolicy(input: RegimePolicyInput): RegimePolicyDecision {
  const adx = Number(input.adx ?? NaN);
  const vol = Number(input.volatilityIndex ?? NaN);
  const liquidity = Math.max(0, Number(input.liquidityUsd || 0));
  const participation = Math.max(0, Number(input.participation || 0));
  const connected = Math.max(0, Number(input.connectedHolderPct || 0));
  const spreadBps = Math.max(0, Number(input.spreadBps || 0));

  if (liquidity < 8000 || spreadBps > 180 || connected >= 55 || participation <= 0.03) {
    return {
      style: "NO_TRADE",
      allowEntry: false,
      hostile: true,
      riskMultiplier: 0,
      strategyHint: "No-trade safety mode",
      reason: "liquidity/spread/holder-risk guardrail failed"
    };
  }

  if (Number.isFinite(adx) && Number.isFinite(vol)) {
    if (adx >= 25 && vol >= 60) {
      return {
        style: "BREAKOUT",
        allowEntry: true,
        hostile: false,
        riskMultiplier: 0.95,
        strategyHint: "Breakout favored",
        reason: "trend strength + expanding volatility"
      };
    }
    if (adx >= 25 && vol < 60) {
      return {
        style: "TREND",
        allowEntry: true,
        hostile: false,
        riskMultiplier: 1.0,
        strategyHint: "Trend-following favored",
        reason: "trend strength with controlled volatility"
      };
    }
    if (adx < 20 && vol < 60) {
      return {
        style: "MEAN_REVERT",
        allowEntry: true,
        hostile: false,
        riskMultiplier: 0.82,
        strategyHint: "Mean-reversion favored",
        reason: "sideways + quiet regime"
      };
    }
    return {
      style: "NO_TRADE",
      allowEntry: false,
      hostile: true,
      riskMultiplier: 0,
      strategyHint: "No-trade in choppy volatility",
      reason: "choppy + volatile regime"
    };
  }

  return {
    style: "TREND",
    allowEntry: true,
    hostile: false,
    riskMultiplier: 0.85,
    strategyHint: "Data-limited conservative mode",
    reason: "partial regime data; reduced size"
  };
}

export function chooseAdaptiveEntryTrigger(input: AdaptiveEntryInput): AdaptiveEntryDecision {
  const price = Number(input.marketPriceUsd || 0);
  const low = Number(input.buyZoneLow || 0);
  const high = Number(input.buyZoneHigh || 0);
  const resistance1 = Number(input.resistance1 || 0);
  const support1 = Number(input.support1 || 0);
  const move5m = Number(input.change5mPct || 0);
  const breakoutMinMove = Math.max(0, Number(input.breakoutMinMove5mPct ?? 0.8));
  const adx = Number(input.adx ?? NaN);
  const vol = Number(input.volatilityIndex ?? NaN);
  const elapsedSec = Math.max(0, Number(input.elapsedSec || 0));
  const timeoutSec = Math.max(1, Number(input.timeoutSec || 1));
  const cycle = Math.max(0, Number(input.fallbackCycle || 0));

  if (price > 0 && low > 0 && high > 0 && price >= low && price <= high) {
    return {
      trigger: "pullback",
      sizeMultiplier: 1,
      note: "pullback entry inside buy zone"
    };
  }

  const breakoutGate = Number.isFinite(adx) && adx >= 25 && move5m >= breakoutMinMove;
  if (price > 0 && high > 0 && price > high && breakoutGate) {
    const volPenalty = Number.isFinite(vol) && vol >= 80 ? 0.72 : 0.82;
    return {
      trigger: "momentum",
      sizeMultiplier: volPenalty,
      note: "momentum continuation entry above buy zone"
    };
  }

  if (elapsedSec >= timeoutSec) {
    const cycleBoost = clamp(0.55 + cycle * 0.08, 0.45, 0.9);
    let suffix = "";
    if (price > 0 && high > 0 && price > high) {
      suffix = " (above buy zone)";
    } else if (price > 0 && low > 0 && price < low) {
      suffix = " (below buy zone)";
    } else if (!(low > 0 && high > 0) || !(support1 > 0 && resistance1 > 0)) {
      suffix = " (zone/levels incomplete)";
    }
    return {
      trigger: "timeout",
      sizeMultiplier: Number(cycleBoost.toFixed(2)),
      note: `timeout fallback entry after ${elapsedSec}s${suffix}`
    };
  }

  return {
    trigger: "none",
    sizeMultiplier: 0,
    note: "entry watch active"
  };
}

export function computeDynamicPositionSize(input: DynamicPositionInput): DynamicPositionOutput {
  const entry = Math.max(0, Number(input.entryPriceUsd || 0));
  const stop = Math.max(0, Number(input.stopPriceUsd || 0));
  const maxCap = Math.max(1, Number(input.maxPositionCapUsd || 1));
  const maxRisk = Math.max(0.1, Number(input.maxRiskPerTradeUsd || 0.1));
  const spreadBps = Math.max(0, Number(input.spreadBps || 0));
  const vol = Number(input.volatilityIndex ?? NaN);
  const regimeMult = clamp(Number(input.regimeRiskMultiplier || 1), 0, 1.2);

  const stopDistancePct =
    entry > 0 && stop > 0 ? Math.max(0.2, (Math.abs(entry - stop) / entry) * 100) : 2.5;
  const riskSizedUsd = maxRisk / Math.max(0.0001, stopDistancePct / 100);

  let multiplier = regimeMult;
  if (Number.isFinite(vol) && vol >= 75) multiplier *= 0.6;
  else if (Number.isFinite(vol) && vol >= 60) multiplier *= 0.78;
  else if (Number.isFinite(vol) && vol <= 35) multiplier *= 1.08;

  if (spreadBps >= 120) multiplier *= 0.65;
  else if (spreadBps >= 80) multiplier *= 0.8;
  else if (spreadBps <= 25) multiplier *= 1.03;

  multiplier = clamp(multiplier, 0.25, 1.1);
  const sized = Math.min(maxCap, riskSizedUsd) * multiplier;

  return {
    sizeUsd: Number(clamp(sized, 1, maxCap).toFixed(2)),
    stopDistancePct: Number(stopDistancePct.toFixed(4)),
    riskBudgetUsd: Number(Math.min(maxRisk, maxCap).toFixed(2)),
    appliedMultiplier: Number(multiplier.toFixed(4))
  };
}

export function simulateExecutionFill(input: FillSimulationInput): FillSimulationResult {
  const side = input.side;
  const mode = input.mode;
  const reference = Math.max(0.0000001, Number(input.referencePriceUsd || 0.0000001));
  const requestedNotional = Math.max(0, Number(input.requestedNotionalUsd || 0));
  const spreadBps = Math.max(0, Number(input.spreadBps || 0));
  const vol = Number(input.volatilityIndex ?? NaN);
  const pollIntervalSec = Math.max(1, Number(input.pollIntervalSec || 1));

  const baseFeeBps = mode === "live" ? 22 : 12;
  const volBps = Number.isFinite(vol) ? clamp(vol * 0.18, 1, 24) : 8;
  const spreadImpactBps = clamp(spreadBps * 0.3, 1, 35);
  const latencyBps = clamp(pollIntervalSec * 1.25, 1, 32);
  const totalImpactBps = baseFeeBps + volBps + spreadImpactBps + latencyBps;

  const partialPenalty = clamp((spreadBps - 35) / 260, 0, 0.35);
  const volPenalty = Number.isFinite(vol) ? clamp((vol - 70) / 220, 0, 0.25) : 0;
  const fillRatio = clamp(1 - partialPenalty - volPenalty, 0.55, 1);
  const executedNotionalUsd = Number((requestedNotional * fillRatio).toFixed(2));

  const impactPct = totalImpactBps / 10000;
  const fillPriceUsd = Number(
    (side === "BUY" ? reference * (1 + impactPct) : reference * (1 - impactPct)).toPrecision(8)
  );

  const slippageCostUsd = Number((executedNotionalUsd * ((volBps + spreadImpactBps) / 10000)).toFixed(4));
  const feeCostUsd = Number((executedNotionalUsd * (baseFeeBps / 10000)).toFixed(4));
  const latencyCostUsd = Number((executedNotionalUsd * (latencyBps / 10000)).toFixed(4));
  const totalCostUsd = Number((slippageCostUsd + feeCostUsd + latencyCostUsd).toFixed(4));

  return {
    fillPriceUsd,
    executedNotionalUsd,
    fillRatio: Number(fillRatio.toFixed(4)),
    slippageCostUsd,
    feeCostUsd,
    latencyCostUsd,
    totalCostUsd
  };
}

export function computePnlAttribution(input: PnlAttributionInput): PnlAttributionResult {
  const entryNotional = Number(input.entryNotionalUsd || 0);
  const exitNotional = Number(input.exitNotionalUsd || 0);
  const entryRef = Number(input.entryReferencePriceUsd || 0);
  const exitRef = Number(input.exitReferencePriceUsd || 0);
  const costs = Number(input.entryFillCostUsd || 0) + Number(input.exitFillCostUsd || 0);

  let grossEdgeUsd = 0;
  if (entryRef > 0 && exitRef > 0 && entryNotional > 0) {
    const qty = entryNotional / entryRef;
    grossEdgeUsd = qty * exitRef - entryNotional;
  }
  const netRealizedUsd = exitNotional - entryNotional;
  const slippageFeeLatencyUsd = grossEdgeUsd - netRealizedUsd;
  const netRealizedPct = entryNotional > 0 ? (netRealizedUsd / entryNotional) * 100 : 0;

  return {
    grossEdgeUsd: Number(grossEdgeUsd.toFixed(4)),
    slippageFeeLatencyUsd: Number((slippageFeeLatencyUsd + costs).toFixed(4)),
    netRealizedUsd: Number(netRealizedUsd.toFixed(4)),
    netRealizedPct: Number(netRealizedPct.toFixed(4))
  };
}
