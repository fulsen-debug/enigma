import test from "node:test";
import assert from "node:assert/strict";

import {
  isPaperSymbolAsset,
  isSolanaTrackedAsset,
  isSupportedTrackedAsset,
  normalizeTrackedAssetId
} from "../src/server/signalEngine.js";

test("normalizeTrackedAssetId keeps Solana mints and canonicalizes BTC/ETH aliases", () => {
  const solMint = "So11111111111111111111111111111111111111112";
  assert.equal(normalizeTrackedAssetId(solMint), solMint);

  assert.equal(normalizeTrackedAssetId("btc"), "BTC");
  assert.equal(normalizeTrackedAssetId("BTC-USD"), "BTC");
  assert.equal(normalizeTrackedAssetId("xbt/usdt"), "BTC");
  assert.equal(normalizeTrackedAssetId("eth_usdt"), "ETH");
  assert.equal(normalizeTrackedAssetId(" ETH "), "ETH");
});

test("tracked asset validators accept Solana/BTC/ETH and reject unsupported symbols", () => {
  const solMint = "So11111111111111111111111111111111111111112";
  assert.equal(isSupportedTrackedAsset(solMint), true);
  assert.equal(isSolanaTrackedAsset(solMint), true);

  assert.equal(isSupportedTrackedAsset("BTC"), true);
  assert.equal(isPaperSymbolAsset("btc"), true);
  assert.equal(isPaperSymbolAsset("ETHUSD"), true);

  assert.equal(isSupportedTrackedAsset("DOGE"), false);
  assert.equal(isPaperSymbolAsset("SOL"), false);
  assert.equal(isSolanaTrackedAsset("BTC"), false);
});
