import type { AgentContext } from "../agent/schema.js";
import { killSwitch } from "../workflows/killSwitch.js";
import { estimateSpreadBps } from "./agentPolicy.js";
import {
  fetchCandlesFromBinanceSymbol,
  supportedMarketTimeframes,
  type MarketTimeframe
} from "./candles.js";
import { computeMarketRegimeFromCandles } from "./indicators/regime.js";
import { buildMarketRegime } from "./marketRegime.js";

interface DexScreenerTokenResponse {
  pairs?: Array<{
    dexId?: string;
    pairAddress?: string;
    url?: string;
    priceUsd?: string;
    liquidity?: { usd?: number };
    volume?: { h24?: number };
    priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
    fdv?: number;
    txns?: { h24?: { buys?: number; sells?: number } };
    chainId?: string;
    pairCreatedAt?: number;
    baseToken?: { address?: string; name?: string; symbol?: string };
    info?: { imageUrl?: string; header?: string; openGraph?: string };
  }>;
}

interface DexScreenerProfile {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
  header?: string;
}

interface BinanceTicker24hResponse {
  lastPrice?: string;
  quoteVolume?: string;
  count?: number;
  takerBuyQuoteVolume?: string;
  priceChangePercent?: string;
}

interface BinanceBookTickerResponse {
  bidPrice?: string;
  askPrice?: string;
}

interface SymbolMeta {
  symbol: "BTC" | "ETH";
  pair: "BTCUSDT" | "ETHUSDT";
  name: string;
  iconUrl: string;
  links: {
    dexscreener: string;
    birdeye: string;
    solscan: string;
  };
  circulatingSupply: number;
}

interface TimeframeRegime {
  timeframe: MarketTimeframe;
  volatilityIndex: number | null;
  volatilityLabel: "Low" | "Medium" | "High" | "Unavailable";
  adx: number | null;
  adxLabel: "Sideways" | "Developing trend" | "Strong trend" | "Very strong trend" | "Unavailable";
  regime: "Trending & Expanding" | "Trending & Stable" | "Choppy & Volatile" | "Ranging & Quiet" | "Unavailable";
  strategyHint: string;
  sufficientData: boolean;
  candleCount: number;
  note?: string;
}

const SOLANA_MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const PAPER_SYMBOLS: Record<string, SymbolMeta> = {
  BTC: {
    symbol: "BTC",
    pair: "BTCUSDT",
    name: "Bitcoin",
    iconUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    links: {
      dexscreener: "https://www.tradingview.com/symbols/BTCUSD/",
      birdeye: "https://www.coingecko.com/en/coins/bitcoin",
      solscan: "https://www.binance.com/en/trade/BTC_USDT"
    },
    circulatingSupply: 19_700_000
  },
  ETH: {
    symbol: "ETH",
    pair: "ETHUSDT",
    name: "Ethereum",
    iconUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    links: {
      dexscreener: "https://www.tradingview.com/symbols/ETHUSD/",
      birdeye: "https://www.coingecko.com/en/coins/ethereum",
      solscan: "https://www.binance.com/en/trade/ETH_USDT"
    },
    circulatingSupply: 120_600_000
  }
};

const PAPER_SYMBOL_ALIASES: Record<string, keyof typeof PAPER_SYMBOLS> = {
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

export interface DiscoveryCandidate {
  mint: string;
  iconUrl?: string;
  headerUrl?: string;
}

export function normalizeTrackedAssetId(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (SOLANA_MINT_RE.test(trimmed)) return trimmed;

  const key = trimmed.toUpperCase().replace(/[\s/_-]/g, "");
  const alias = PAPER_SYMBOL_ALIASES[key];
  return alias ? alias : "";
}

export function isSolanaTrackedAsset(value: string): boolean {
  return SOLANA_MINT_RE.test(String(value || "").trim());
}

export function isPaperSymbolAsset(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(PAPER_SYMBOLS, normalizeTrackedAssetId(value));
}

export function isSupportedTrackedAsset(value: string): boolean {
  return Boolean(normalizeTrackedAssetId(value));
}

async function fetchDiscoverySource(url: string): Promise<DexScreenerProfile[]> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const json = (await response.json()) as DexScreenerProfile[];
    if (!Array.isArray(json)) return [];
    return json;
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toPrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number(value.toPrecision(8));
}

function fmtPct(value: number): string {
  return `${Number(value || 0).toFixed(2)}%`;
}

function pctChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function priceN(candles: Array<{ close: number }>, barsBack: number): number {
  if (!candles.length) return 0;
  const idx = candles.length - 1 - barsBack;
  if (idx < 0) return Number(candles[0]?.close || 0);
  return Number(candles[idx]?.close || 0);
}

function buildMiniChart(price: number, changes: { m5: number; h1: number; h6: number; h24: number }) {
  if (!price || price <= 0) return { points: [], labels: ["24h", "6h", "1h", "5m", "now"] };

  const p24 = price / (1 + changes.h24 / 100 || 1);
  const p6 = price / (1 + changes.h6 / 100 || 1);
  const p1 = price / (1 + changes.h1 / 100 || 1);
  const p5 = price / (1 + changes.m5 / 100 || 1);
  return {
    points: [p24, p6, p1, p5, price].map((p) => Number(p.toPrecision(8))),
    labels: ["24h", "6h", "1h", "5m", "now"]
  };
}

function defaultUnavailable(timeframe: MarketTimeframe): TimeframeRegime {
  return {
    timeframe,
    volatilityIndex: null,
    volatilityLabel: "Unavailable",
    adx: null,
    adxLabel: "Unavailable",
    regime: "Unavailable",
    strategyHint: "Wait for sufficient data",
    sufficientData: false,
    candleCount: 0,
    note: "Insufficient candles"
  };
}

function choosePrimaryRegime(results: TimeframeRegime[], preferred: MarketTimeframe): TimeframeRegime {
  const preferredResult = results.find((entry) => entry.timeframe === preferred);
  if (preferredResult?.sufficientData) return preferredResult;

  const fallbackOrder: MarketTimeframe[] = ["1h", "15m", "5m", "4h", "1d"];
  for (const tf of fallbackOrder) {
    const candidate = results.find((entry) => entry.timeframe === tf);
    if (candidate?.sufficientData) return candidate;
  }

  return preferredResult || results[0] || defaultUnavailable(preferred);
}

function defaultHolderBehavior(note = "holder analytics unavailable for this market"): Record<string, unknown> {
  return {
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
      note
    }
  };
}

async function fetchSolanaMarketSnapshot(mint: string): Promise<Record<string, unknown>> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`DexScreener HTTP ${response.status}`);
  }

  const json = (await response.json()) as DexScreenerTokenResponse;
  const solPairs = (json.pairs || []).filter((pair) => pair.chainId === "solana");
  const best = solPairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0))[0];

  if (!best) {
    throw new Error("No liquid Solana pair found");
  }

  const liquidityUsd = Number(best.liquidity?.usd || 0);
  const volume24hUsd = Number(best.volume?.h24 || 0);

  return {
    source: "dexscreener",
    chain: "solana",
    dexId: best.dexId || "unknown",
    pairAddress: best.pairAddress || "unknown",
    pairUrl: best.url || "",
    pairCreatedAt: Number(best.pairCreatedAt || 0),
    tokenAddress: String(best.baseToken?.address || mint),
    tokenName: String(best.baseToken?.name || "Unknown Token"),
    tokenSymbol: String(best.baseToken?.symbol || "N/A"),
    imageUrl: String(best.info?.imageUrl || best.info?.openGraph || ""),
    headerUrl: String(best.info?.header || ""),
    priceUsd: Number(best.priceUsd || 0),
    liquidityUsd,
    volume24hUsd,
    buys24h: Number(best.txns?.h24?.buys || 0),
    sells24h: Number(best.txns?.h24?.sells || 0),
    priceChange5mPct: Number(best.priceChange?.m5 || 0),
    priceChange1hPct: Number(best.priceChange?.h1 || 0),
    priceChange6hPct: Number(best.priceChange?.h6 || 0),
    priceChange24hPct: Number(best.priceChange?.h24 || 0),
    fdvUsd: Number(best.fdv || 0),
    estimatedSpreadBps: estimateSpreadBps(liquidityUsd, volume24hUsd)
  };
}

async function fetchPaperSymbolMarketSnapshot(symbol: "BTC" | "ETH"): Promise<Record<string, unknown>> {
  const meta = PAPER_SYMBOLS[symbol];
  const [tickerResp, bookResp, candles5m] = await Promise.all([
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${meta.pair}`, {
      headers: { Accept: "application/json" }
    }),
    fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${meta.pair}`, {
      headers: { Accept: "application/json" }
    }),
    fetchCandlesFromBinanceSymbol({ symbol, timeframe: "5m", limit: 320 })
  ]);

  if (!tickerResp.ok) {
    throw new Error(`Binance ticker HTTP ${tickerResp.status}`);
  }

  const ticker = (await tickerResp.json()) as BinanceTicker24hResponse;
  const book = bookResp.ok ? ((await bookResp.json()) as BinanceBookTickerResponse) : {};

  const priceUsd = Number(ticker.lastPrice || 0);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error(`Binance ${symbol} price unavailable`);
  }

  const quoteVolume = Number(ticker.quoteVolume || 0);
  const tradesCount = Math.max(1, Number(ticker.count || 0));
  const takerBuyQuoteVolume = Number(ticker.takerBuyQuoteVolume || 0);
  const buyRatio = clamp(
    quoteVolume > 0 ? takerBuyQuoteVolume / quoteVolume : 0.5,
    0,
    1
  );

  const buys24h = Math.max(0, Math.round(tradesCount * buyRatio));
  const sells24h = Math.max(0, tradesCount - buys24h);

  const cNow = Number(candles5m[candles5m.length - 1]?.close || priceUsd);
  const c5m = priceN(candles5m, 1);
  const c1h = priceN(candles5m, 12);
  const c6h = priceN(candles5m, 72);
  const c24h = priceN(candles5m, 288);

  const priceChange24hPctTicker = Number(ticker.priceChangePercent || 0);
  const priceChange5mPct = Number(pctChange(cNow, c5m).toFixed(4));
  const priceChange1hPct = Number(pctChange(cNow, c1h).toFixed(4));
  const priceChange6hPct = Number(pctChange(cNow, c6h).toFixed(4));
  const derived24h = Number(pctChange(cNow, c24h).toFixed(4));
  const priceChange24hPct = Number.isFinite(derived24h) && Math.abs(derived24h) > 0.00001
    ? derived24h
    : priceChange24hPctTicker;

  const bid = Number(book.bidPrice || 0);
  const ask = Number(book.askPrice || 0);
  const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : 0;
  const spreadBpsFromBook = mid > 0 && ask > bid ? ((ask - bid) / mid) * 10000 : 0;

  const liquidityUsd = Number((quoteVolume * 0.35).toFixed(2));
  const volume24hUsd = Number(quoteVolume.toFixed(2));
  const spreadBps = spreadBpsFromBook > 0
    ? Number(clamp(spreadBpsFromBook, 0.5, 180).toFixed(2))
    : estimateSpreadBps(liquidityUsd, volume24hUsd);

  return {
    source: "binance",
    chain: "cex",
    dexId: "binance",
    pairAddress: meta.pair,
    pairUrl: `https://www.binance.com/en/trade/${meta.symbol}_USDT`,
    pairCreatedAt: 0,
    tokenAddress: meta.symbol,
    tokenName: meta.name,
    tokenSymbol: meta.symbol,
    imageUrl: meta.iconUrl,
    headerUrl: "",
    priceUsd,
    liquidityUsd,
    volume24hUsd,
    buys24h,
    sells24h,
    priceChange5mPct,
    priceChange1hPct,
    priceChange6hPct,
    priceChange24hPct,
    fdvUsd: Number((meta.circulatingSupply * priceUsd).toFixed(2)),
    estimatedSpreadBps: spreadBps
  };
}

async function buildPaperSymbolMarketRegime(symbol: "BTC" | "ETH") {
  const allTimeframes = supportedMarketTimeframes();
  const preferred: MarketTimeframe = "1h";

  const results = await Promise.all(
    allTimeframes.map(async (timeframe) => {
      const candles = await fetchCandlesFromBinanceSymbol({
        symbol,
        timeframe,
        limit: 240
      });
      const regime = computeMarketRegimeFromCandles({
        candles,
        atrPeriod: 14,
        adxPeriod: 14,
        volatilityWindow: 200
      });

      const output: TimeframeRegime = {
        timeframe,
        volatilityIndex: regime.volatilityIndex,
        volatilityLabel: regime.volatilityLabel,
        adx: regime.adx,
        adxLabel: regime.adxLabel,
        regime: regime.regime,
        strategyHint: regime.strategyHint,
        sufficientData: regime.sufficientData,
        candleCount: candles.length,
        note: regime.note
      };
      return output;
    })
  );

  const byTimeframe = results.reduce(
    (acc, entry) => {
      acc[entry.timeframe] = entry;
      return acc;
    },
    allTimeframes.reduce(
      (base, timeframe) => {
        base[timeframe] = defaultUnavailable(timeframe);
        return base;
      },
      {} as Record<MarketTimeframe, TimeframeRegime>
    )
  );

  return {
    source: "binance",
    supportedTimeframes: allTimeframes,
    preferredTimeframe: preferred,
    current: choosePrimaryRegime(results, preferred),
    byTimeframe,
    computedAt: new Date().toISOString()
  };
}

async function fetchMarketSnapshot(assetId: string): Promise<Record<string, unknown>> {
  const normalized = normalizeTrackedAssetId(assetId);
  if (!normalized) {
    throw new Error("unsupported token format")
  }

  if (isSolanaTrackedAsset(normalized)) {
    return fetchSolanaMarketSnapshot(normalized);
  }

  return fetchPaperSymbolMarketSnapshot(normalized as "BTC" | "ETH");
}

export async function fetchRealtimeMarketSnapshot(assetId: string): Promise<Record<string, unknown>> {
  return fetchMarketSnapshot(assetId);
}

export async function generateSignal(context: AgentContext, assetId: string): Promise<Record<string, unknown>> {
  const normalizedAsset = normalizeTrackedAssetId(assetId);
  if (!normalizedAsset) {
    throw new Error("unsupported token format")
  }

  const isSolana = isSolanaTrackedAsset(normalizedAsset);
  const snapshot = await fetchMarketSnapshot(normalizedAsset);
  const marketRegime = isSolana
    ? await buildMarketRegime({
        pairAddress: String(snapshot.pairAddress || ""),
        preferredTimeframe: "1h",
        limit: 240,
        includeAllTimeframes: false
      })
    : await buildPaperSymbolMarketRegime(normalizedAsset as "BTC" | "ETH");

  const liquidity = Number(snapshot.liquidityUsd || 0);
  const volume = Number(snapshot.volume24hUsd || 0);
  const change24h = Number(snapshot.priceChange24hPct || 0);
  const connectedHolderPctRaw = isSolana ? null : 0;
  const newWalletHolderPctRaw = isSolana ? null : 0;

  const nonSolSpread = Number(snapshot.estimatedSpreadBps || estimateSpreadBps(liquidity, volume));
  const nonSolBaseScore = clamp(
    82 - Math.max(0, Math.abs(change24h) - 8) * 2.2 - Math.max(0, nonSolSpread - 15) * 0.4,
    35,
    95
  );
  const nonSolVerdict: "PASS" | "CAUTION" | "BLOCK" =
    nonSolBaseScore >= 72 ? "PASS" : nonSolBaseScore >= 58 ? "CAUTION" : "BLOCK";

  const syntheticHolderBehavior = defaultHolderBehavior(
    "BTC/ETH paper mode uses market microstructure signals; holder-wallet clustering is not applicable."
  );
  const syntheticRisk = {
    concentrationRisk: "not-applicable",
    top3HolderSharePct: 0,
    top10HolderSharePct: 0,
    hasMintAuthority: false,
    hasFreezeAuthority: false,
    concentrationWindow: "top10",
    concentrationMode: "not-applicable",
    suspiciousPatterns: [],
    holderProfiles: [],
    holderBehavior: syntheticHolderBehavior
  };

  const kill = isSolana
    ? await killSwitch(context, normalizedAsset)
    : {
        data: {
          mint: normalizedAsset,
          score: Number(nonSolBaseScore.toFixed(2)),
          verdict: nonSolVerdict,
          reasons: [
            "macro-asset mode: no token mint authority/freeze risk",
            "score derived from spread, volatility, and participation",
            "wallet clustering heuristics are not applicable"
          ],
          risk: syntheticRisk
        }
      };

  const killScore = Number(kill.data.score || 0);
  const killVerdict = String(kill.data.verdict || "BLOCK");
  const holderBehavior =
    ((kill.data.risk as Record<string, unknown> | undefined)?.holderBehavior as Record<string, unknown>) ||
    defaultHolderBehavior();

  const liquidityScore = clamp((liquidity / 250000) * 100, 0, 100);
  const participationScore = clamp((volume / Math.max(liquidity, 1)) * 100, 0, 100);
  const momentumScore = clamp(50 + change24h, 0, 100);
  const estimatedSpreadBps = estimateSpreadBps(liquidity, volume);
  const connectedPenaltyBase = Number(
    connectedHolderPctRaw ?? (holderBehavior.connectedHolderPct as number | undefined) ?? 0
  );
  const newWalletPenaltyBase = Number(
    newWalletHolderPctRaw ?? (holderBehavior.newWalletHolderPct as number | undefined) ?? 0
  );
  const connectedPenalty = clamp(connectedPenaltyBase * 0.45, 0, 45);
  const newWalletPenalty = clamp(newWalletPenaltyBase * 0.3, 0, 30);
  const buys24h = Number(snapshot.buys24h || 0);
  const sells24h = Number(snapshot.sells24h || 0);
  const orderFlow = buys24h + sells24h > 0 ? buys24h / (buys24h + sells24h) : 0.5;
  const connectedHolderPct = Number(holderBehavior.connectedHolderPct || 0);
  const newWalletHolderPct = Number(holderBehavior.newWalletHolderPct || 0);
  const top10ConcentrationPct = Number(
    ((kill.data.risk as Record<string, unknown> | undefined)?.top10HolderSharePct as number | undefined) || 0
  );

  let patternScore =
    killScore * 0.45 + liquidityScore * 0.2 + participationScore * 0.15 + momentumScore * 0.2;
  patternScore -= connectedPenalty + newWalletPenalty;
  patternScore = clamp(patternScore, 0, 100);

  let status: "FAVORABLE" | "CAUTION" | "HIGH_RISK" = "CAUTION";
  if (killVerdict === "BLOCK" || patternScore < 45) {
    status = "HIGH_RISK";
  } else if (patternScore >= 70 && killVerdict === "PASS") {
    status = "FAVORABLE";
  }

  const price = Number(snapshot.priceUsd || 0);
  const volShock = clamp(Math.abs(change24h) / 100, 0.03, 0.28);
  const support1 = toPrice(price * (1 - volShock * 0.75));
  const support2 = toPrice(price * (1 - volShock * 1.2));
  const resistance1 = toPrice(price * (1 + volShock * 0.9));
  const resistance2 = toPrice(price * (1 + volShock * 1.5));
  const entryLow = toPrice(price * (1 - volShock * 0.55));
  const entryHigh = toPrice(price * (1 - volShock * 0.2));
  const stopLoss = toPrice(support2 * 0.98);

  let sentimentLabel: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  let sentimentScore = 50;
  sentimentScore += (orderFlow - 0.5) * 50;
  sentimentScore += change24h * 0.4;
  sentimentScore += (status === "FAVORABLE" ? 10 : status === "HIGH_RISK" ? -12 : 0);
  sentimentScore -= connectedPenalty * 0.35 + newWalletPenalty * 0.2;
  sentimentScore = clamp(sentimentScore, 0, 100);
  if (sentimentScore >= 62) sentimentLabel = "Bullish";
  else if (sentimentScore <= 38) sentimentLabel = "Bearish";
  const miniChart = buildMiniChart(price, {
    m5: Number(snapshot.priceChange5mPct || 0),
    h1: Number(snapshot.priceChange1hPct || 0),
    h6: Number(snapshot.priceChange6hPct || 0),
    h24: change24h
  });

  const reasons = [
    `Kill-switch: ${killVerdict} (${killScore}/100)`,
    `Pattern score: ${patternScore.toFixed(2)}/100`,
    `Liquidity: $${liquidity.toLocaleString()}`,
    `Participation (vol/liquidity): ${(volume / Math.max(liquidity, 1)).toFixed(2)}`,
    `24h price change: ${change24h.toFixed(2)}%`,
    `Connected holders: ${connectedHolderPct.toFixed(2)}%`,
    `New-wallet holders: ${newWalletHolderPct.toFixed(2)}%`,
    `Order flow (24h): buys ${buys24h}, sells ${sells24h}`,
    `Market regime (${marketRegime.current.timeframe}): ${marketRegime.current.regime} | Vol ${marketRegime.current.volatilityIndex ?? "N/A"} | ADX ${marketRegime.current.adx ?? "N/A"}`
  ];

  const confidence = Number(clamp((patternScore / 100) * 0.9 + 0.1, 0.1, 0.98).toFixed(2));
  const rugRiskRaw =
    100 -
    killScore +
    top10ConcentrationPct * 0.22 +
    connectedHolderPct * 0.35 +
    newWalletHolderPct * 0.25 +
    (Boolean((kill.data.risk as Record<string, unknown> | undefined)?.hasMintAuthority) ? 10 : 0) +
    (Boolean((kill.data.risk as Record<string, unknown> | undefined)?.hasFreezeAuthority) ? 8 : 0) +
    (status === "HIGH_RISK" ? 8 : status === "CAUTION" ? 4 : -6);
  const rugRiskScorePct = Number(clamp(rugRiskRaw, 1, 99).toFixed(1));
  const rugRiskBand = rugRiskScorePct >= 70 ? "HIGH" : rugRiskScorePct >= 45 ? "MEDIUM" : "LOW";
  const beginnerSummary =
    `Status is ${status}: kill-switch ${killVerdict} (${killScore}/100), pattern ${patternScore.toFixed(2)}/100, confidence ${confidence.toFixed(2)}. ` +
    `24h flow shows ${buys24h} buys vs ${sells24h} sells (${(orderFlow * 100).toFixed(1)}% buy-side), with price move ${fmtPct(change24h)}. ` +
    `Holder behavior is ${fmtPct(connectedHolderPct)} connected-wallet exposure and ${fmtPct(newWalletHolderPct)} new-wallet exposure.`;

  const beginnerAction =
    status === "FAVORABLE"
      ? "Setup is cleaner right now, but still confirm support reaction and position sizing before entry."
      : status === "CAUTION"
        ? "Mixed conditions; watch for stronger confirmation before entering."
        : "Risk is elevated; avoid fresh entries until behavior and kill-switch metrics improve.";

  const links = isSolana
    ? {
        dexscreener: `https://dexscreener.com/solana/${String(snapshot.pairAddress || "")}`,
        birdeye: `https://birdeye.so/token/${normalizedAsset}?chain=solana`,
        solscan: `https://solscan.io/token/${normalizedAsset}`
      }
    : PAPER_SYMBOLS[normalizedAsset as keyof typeof PAPER_SYMBOLS].links;

  const holderCoverage =
    ((holderBehavior.analysisCoverage as Record<string, unknown> | undefined)?.note as string | undefined) || "";
  const coverageNote = isSolana
    ? holderCoverage ||
      "Wallet behavior and buy/sell counts are sampled from recent on-chain activity and do not represent full lifetime wallet history."
    : "Macro-asset paper mode: wallet-holder clustering is not applied for BTC/ETH. Signals are based on market microstructure and regime metrics.";

  return {
    mint: normalizedAsset,
    status,
    confidence,
    patternScore: Number(patternScore.toFixed(2)),
    token: {
      mint: String(snapshot.tokenAddress || normalizedAsset),
      symbol: String(snapshot.tokenSymbol || "N/A"),
      name: String(snapshot.tokenName || "Unknown Token"),
      imageUrl: String(snapshot.imageUrl || ""),
      headerUrl: String(snapshot.headerUrl || "")
    },
    killSwitch: kill.data,
    rugPullRisk: {
      scorePct: rugRiskScorePct,
      band: rugRiskBand,
      note: "Heuristic rug-risk estimate from kill-switch score, concentration, wallet clustering, and authority flags."
    },
    holderBehavior,
    market: snapshot,
    marketMicrostructure: {
      estimatedSpreadBps
    },
    marketRegime,
    tradePlan: {
      recommendation:
        status === "FAVORABLE"
          ? "Potential entry candidate if price respects support and risk is controlled"
          : status === "CAUTION"
            ? "Monitor candidate; wait for confirmation near support"
            : "Avoid entry until risk profile improves",
      buyZone: { low: entryLow, high: entryHigh },
      support: [support1, support2],
      resistance: [resistance1, resistance2],
      stopLoss,
      invalidation: `Breakdown below ${stopLoss || "N/A"} with weak order flow`
    },
    sentiment: {
      label: sentimentLabel,
      score: Number(sentimentScore.toFixed(2)),
      orderFlow: {
        buys24h,
        sells24h,
        buyRatio: Number(orderFlow.toFixed(3))
      },
      summary:
        sentimentLabel === "Bullish"
          ? "Buy pressure and momentum currently favor upside continuation."
          : sentimentLabel === "Bearish"
            ? "Sell pressure and risk behavior currently dominate."
            : "Mixed flow; wait for cleaner confirmation.",
      plainLanguage: {
        current: beginnerSummary,
        action: beginnerAction,
        coverage: coverageNote
      }
    },
    miniChart,
    links,
    methodology: {
      version: "enigma_scanner_v1",
      formula:
        "pattern = 0.45*kill + 0.20*liquidity + 0.15*participation + 0.20*momentum - connected_penalty - new_wallet_penalty",
      components: {
        killScore: Number(killScore.toFixed(2)),
        liquidityScore: Number(liquidityScore.toFixed(2)),
        participationScore: Number(participationScore.toFixed(2)),
        momentumScore: Number(momentumScore.toFixed(2)),
        connectedPenalty: Number(connectedPenalty.toFixed(2)),
        newWalletPenalty: Number(newWalletPenalty.toFixed(2))
      },
      mapping: {
        favorable: "pattern >= 70 and kill-switch PASS",
        caution: "pattern 45-69 or mixed risk",
        highRisk: "kill-switch BLOCK or pattern < 45"
      }
    },
    reasons,
    disclaimer: "Scanner output is probabilistic risk analysis, not financial advice."
  };
}

export async function discoverNewSolanaMints(max = 25): Promise<DiscoveryCandidate[]> {
  const [profiles, boostsLatest, boostsTop] = await Promise.all([
    fetchDiscoverySource("https://api.dexscreener.com/token-profiles/latest/v1"),
    fetchDiscoverySource("https://api.dexscreener.com/token-boosts/latest/v1"),
    fetchDiscoverySource("https://api.dexscreener.com/token-boosts/top/v1")
  ]);

  const combined = [...profiles, ...boostsLatest, ...boostsTop];
  const seen = new Set<string>();
  const tokens: DiscoveryCandidate[] = [];

  for (const item of combined) {
    if (item.chainId !== "solana" || !item.tokenAddress) continue;
    const mint = String(item.tokenAddress);
    if (seen.has(mint)) continue;
    seen.add(mint);
    tokens.push({
      mint,
      iconUrl: item.icon || "",
      headerUrl: item.header || ""
    });
    if (tokens.length >= max) break;
  }

  return tokens;
}
