import type { Candle } from "./indicators/types.js";

export type MarketTimeframe = "5m" | "15m" | "1h" | "4h" | "1d";

const TIMEFRAME_SPECS: Record<MarketTimeframe, { path: "minute" | "hour" | "day"; aggregate: number }> = {
  "5m": { path: "minute", aggregate: 5 },
  "15m": { path: "minute", aggregate: 15 },
  "1h": { path: "hour", aggregate: 1 },
  "4h": { path: "hour", aggregate: 4 },
  "1d": { path: "day", aggregate: 1 }
};

const CANDLE_CACHE_TTL_MS = Math.max(
  10_000,
  Number(process.env.ENIGMA_CANDLE_CACHE_TTL_SEC || 60) * 1000
);

const candleCache = new Map<string, { expiresAt: number; candles: Candle[] }>();

function cacheKey(pairAddress: string, timeframe: MarketTimeframe, limit: number): string {
  return `${pairAddress}::${timeframe}::${limit}`;
}

function normalizeCandle(entry: unknown): Candle | null {
  if (!Array.isArray(entry) || entry.length < 6) return null;
  const [ts, open, high, low, close, volume] = entry;
  const parsed: Candle = {
    ts: Number(ts || 0),
    open: Number(open || 0),
    high: Number(high || 0),
    low: Number(low || 0),
    close: Number(close || 0),
    volume: Number(volume || 0)
  };

  if (!Number.isFinite(parsed.ts) || parsed.ts <= 0) return null;
  if (!Number.isFinite(parsed.open) || !Number.isFinite(parsed.high) || !Number.isFinite(parsed.low)) return null;
  if (!Number.isFinite(parsed.close) || parsed.open <= 0 || parsed.high <= 0 || parsed.low <= 0 || parsed.close <= 0) {
    return null;
  }

  return parsed;
}

function normalizeBinanceCandle(entry: unknown): Candle | null {
  if (!Array.isArray(entry) || entry.length < 6) return null;
  const [openTime, open, high, low, close, volume] = entry;
  const parsed: Candle = {
    ts: Number(openTime || 0),
    open: Number(open || 0),
    high: Number(high || 0),
    low: Number(low || 0),
    close: Number(close || 0),
    volume: Number(volume || 0)
  };

  if (!Number.isFinite(parsed.ts) || parsed.ts <= 0) return null;
  if (!Number.isFinite(parsed.open) || !Number.isFinite(parsed.high) || !Number.isFinite(parsed.low)) return null;
  if (!Number.isFinite(parsed.close) || parsed.open <= 0 || parsed.high <= 0 || parsed.low <= 0 || parsed.close <= 0) {
    return null;
  }

  return parsed;
}

function normalizePaperSymbol(input: string): "BTCUSDT" | "ETHUSDT" | null {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return null;
  const key = raw.replace(/[\s/_-]/g, "");
  if (["BTC", "BTCUSD", "BTCUSDT", "XBT", "XBTUSD", "XBTUSDT"].includes(key)) {
    return "BTCUSDT";
  }
  if (["ETH", "ETHUSD", "ETHUSDT"].includes(key)) {
    return "ETHUSDT";
  }
  return null;
}

export async function fetchCandlesFromGeckoTerminal(input: {
  pairAddress: string;
  timeframe: MarketTimeframe;
  limit?: number;
}): Promise<Candle[]> {
  const pairAddress = String(input.pairAddress || "").trim();
  const timeframe = input.timeframe;
  const limit = Math.max(30, Math.min(1000, Number(input.limit || 240)));
  if (!pairAddress) return [];

  const key = cacheKey(pairAddress, timeframe, limit);
  const now = Date.now();
  const cached = candleCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.candles;
  }

  const spec = TIMEFRAME_SPECS[timeframe];
  const url =
    `https://api.geckoterminal.com/api/v2/networks/solana/pools/${encodeURIComponent(pairAddress)}` +
    `/ohlcv/${spec.path}?aggregate=${spec.aggregate}&limit=${limit}`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      candleCache.set(key, { expiresAt: now + 10_000, candles: [] });
      return [];
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const ohlcv =
      ((payload.data as Record<string, unknown> | undefined)?.attributes as Record<string, unknown> | undefined)
        ?.ohlcv_list || [];
    const candles = (Array.isArray(ohlcv) ? ohlcv : [])
      .map((entry) => normalizeCandle(entry))
      .filter((entry): entry is Candle => Boolean(entry))
      .sort((a, b) => a.ts - b.ts);

    candleCache.set(key, {
      expiresAt: now + CANDLE_CACHE_TTL_MS,
      candles
    });

    return candles;
  } catch {
    candleCache.set(key, { expiresAt: now + 10_000, candles: [] });
    return [];
  }
}

const BINANCE_INTERVAL_BY_TIMEFRAME: Record<MarketTimeframe, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d"
};

export async function fetchCandlesFromBinanceSymbol(input: {
  symbol: string;
  timeframe: MarketTimeframe;
  limit?: number;
}): Promise<Candle[]> {
  const symbol = normalizePaperSymbol(String(input.symbol || ""));
  const timeframe = input.timeframe;
  const limit = Math.max(30, Math.min(1000, Number(input.limit || 240)));
  if (!symbol) return [];

  const key = `binance:${symbol}::${timeframe}::${limit}`;
  const now = Date.now();
  const cached = candleCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.candles;
  }

  const interval = BINANCE_INTERVAL_BY_TIMEFRAME[timeframe];
  const url =
    `https://api.binance.com/api/v3/klines` +
    `?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(String(limit))}`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      candleCache.set(key, { expiresAt: now + 10_000, candles: [] });
      return [];
    }

    const payload = (await response.json()) as unknown;
    const candles = (Array.isArray(payload) ? payload : [])
      .map((entry) => normalizeBinanceCandle(entry))
      .filter((entry): entry is Candle => Boolean(entry))
      .sort((a, b) => a.ts - b.ts);

    candleCache.set(key, {
      expiresAt: now + CANDLE_CACHE_TTL_MS,
      candles
    });

    return candles;
  } catch {
    candleCache.set(key, { expiresAt: now + 10_000, candles: [] });
    return [];
  }
}

export function supportedMarketTimeframes(): MarketTimeframe[] {
  return ["5m", "15m", "1h", "4h", "1d"];
}
