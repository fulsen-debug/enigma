import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseAdaptiveEntryTrigger,
  computeDynamicPositionSize,
  computePnlAttribution,
  deriveRegimePolicy,
  estimateSpreadBps,
  simulateExecutionFill
} from "../src/server/agentPolicy.js";

test("regime policy returns BREAKOUT on strong trend + expanding vol", () => {
  const decision = deriveRegimePolicy({
    adx: 31,
    volatilityIndex: 74,
    liquidityUsd: 100_000,
    participation: 0.5,
    connectedHolderPct: 18,
    spreadBps: 24
  });
  assert.equal(decision.style, "BREAKOUT");
  assert.equal(decision.allowEntry, true);
  assert.equal(decision.hostile, false);
});

test("regime policy blocks hostile market conditions", () => {
  const decision = deriveRegimePolicy({
    adx: 17,
    volatilityIndex: 82,
    liquidityUsd: 4_000,
    participation: 0.01,
    connectedHolderPct: 63,
    spreadBps: 210
  });
  assert.equal(decision.style, "NO_TRADE");
  assert.equal(decision.allowEntry, false);
  assert.equal(decision.hostile, true);
});

test("adaptive entry chooses pullback in buy zone and timeout fallback after wait", () => {
  const pullback = chooseAdaptiveEntryTrigger({
    marketPriceUsd: 1.02,
    buyZoneLow: 0.98,
    buyZoneHigh: 1.05,
    resistance1: 1.12,
    support1: 0.95,
    change5mPct: 0.2,
    adx: 18,
    volatilityIndex: 40,
    elapsedSec: 8,
    timeoutSec: 60,
    fallbackCycle: 0
  });
  assert.equal(pullback.trigger, "pullback");

  const timeout = chooseAdaptiveEntryTrigger({
    marketPriceUsd: 1.25,
    buyZoneLow: 0.98,
    buyZoneHigh: 1.05,
    resistance1: 1.3,
    support1: 1.0,
    change5mPct: 0.3,
    adx: 18,
    volatilityIndex: 44,
    elapsedSec: 75,
    timeoutSec: 60,
    fallbackCycle: 2
  });
  assert.equal(timeout.trigger, "timeout");
  assert.ok(timeout.sizeMultiplier > 0);
});

test("adaptive entry still times out when support/resistance are missing", () => {
  const timeout = chooseAdaptiveEntryTrigger({
    marketPriceUsd: 1.25,
    buyZoneLow: 0.98,
    buyZoneHigh: 1.05,
    resistance1: 0,
    support1: 0,
    change5mPct: 0.2,
    adx: 18,
    volatilityIndex: 44,
    elapsedSec: 75,
    timeoutSec: 60,
    fallbackCycle: 1
  });
  assert.equal(timeout.trigger, "timeout");
  assert.ok(timeout.note.includes("timeout fallback"));
});

test("dynamic sizing respects risk budget and max cap", () => {
  const out = computeDynamicPositionSize({
    entryPriceUsd: 1,
    stopPriceUsd: 0.96,
    maxPositionCapUsd: 25,
    maxRiskPerTradeUsd: 1.25,
    spreadBps: 30,
    volatilityIndex: 50,
    regimeRiskMultiplier: 1
  });
  assert.ok(out.sizeUsd > 0);
  assert.ok(out.sizeUsd <= 25);
  assert.ok(out.stopDistancePct > 0);
});

test("fill simulation applies partial fill and positive costs", () => {
  const fill = simulateExecutionFill({
    side: "BUY",
    mode: "paper",
    referencePriceUsd: 1.5,
    requestedNotionalUsd: 25,
    spreadBps: 90,
    volatilityIndex: 78,
    pollIntervalSec: 5
  });
  assert.ok(fill.fillPriceUsd > 0);
  assert.ok(fill.executedNotionalUsd > 0 && fill.executedNotionalUsd <= 25);
  assert.ok(fill.totalCostUsd > 0);
  assert.ok(fill.fillRatio > 0 && fill.fillRatio <= 1);
});

test("pnl attribution returns deterministic edge/cost split", () => {
  const out = computePnlAttribution({
    entryNotionalUsd: 25,
    exitNotionalUsd: 26.2,
    entryReferencePriceUsd: 1,
    exitReferencePriceUsd: 1.06,
    entryFillCostUsd: 0.05,
    exitFillCostUsd: 0.04
  });
  assert.ok(Number.isFinite(out.grossEdgeUsd));
  assert.ok(Number.isFinite(out.netRealizedUsd));
  assert.ok(Number.isFinite(out.netRealizedPct));
});

test("spread estimate tightens with higher liquidity and volume", () => {
  const low = estimateSpreadBps(8_000, 1_500);
  const high = estimateSpreadBps(500_000, 90_000);
  assert.ok(high < low);
  assert.ok(low >= 8 && low <= 220);
  assert.ok(high >= 8 && high <= 220);
});
