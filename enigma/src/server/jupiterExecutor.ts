import bs58 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction
} from "@solana/web3.js";

const JUP_API_BASE = "https://api.jup.ag/ultra/v1";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const BUY_INPUT_MINT = String(process.env.ENIGMA_BUY_INPUT_MINT || SOL_MINT).trim();
let solPriceCache: { value: number; expiresAt: number } | null = null;

function optionalApiKeyHeader(): Record<string, string> {
  const apiKey = String(process.env.JUPITER_API_KEY || "").trim();
  if (!apiKey) return {};
  return { "x-api-key": apiKey };
}

function parseSecretKey(): Uint8Array {
  const base58 = String(process.env.ENIGMA_TRADER_PRIVATE_KEY || "").trim();
  if (base58) {
    return bs58.decode(base58);
  }

  const jsonRaw = String(process.env.ENIGMA_TRADER_PRIVATE_KEY_JSON || "").trim();
  if (!jsonRaw) {
    throw new Error(
      "missing trader private key; set ENIGMA_TRADER_PRIVATE_KEY (base58) or ENIGMA_TRADER_PRIVATE_KEY_JSON"
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonRaw);
  } catch {
    throw new Error("ENIGMA_TRADER_PRIVATE_KEY_JSON is not valid JSON");
  }

  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "number")) {
    throw new Error("ENIGMA_TRADER_PRIVATE_KEY_JSON must be a numeric array");
  }

  return new Uint8Array(parsed);
}

function traderWallet(): Keypair {
  return Keypair.fromSecretKey(parseSecretKey());
}

function rpcConnection(): Connection {
  const rpcUrl = String(process.env.SOLANA_RPC_URL || "").trim();
  if (!rpcUrl) {
    throw new Error("SOLANA_RPC_URL is required for direct SOL transfer");
  }
  return new Connection(rpcUrl, { commitment: "confirmed" });
}

async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(String(payload.error || `Jupiter HTTP ${response.status}`));
  }
  return payload;
}

async function signAndExecute(
  wallet: Keypair,
  orderResponse: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const transactionBase64 = String(orderResponse.transaction || "").trim();
  const requestId = String(orderResponse.requestId || "").trim();
  if (!transactionBase64 || !requestId) {
    const details = JSON.stringify(orderResponse).slice(0, 240);
    throw new Error(`Jupiter order response missing transaction/requestId: ${details}`);
  }

  const tx = VersionedTransaction.deserialize(Buffer.from(transactionBase64, "base64"));
  tx.sign([wallet]);
  const signedTransaction = Buffer.from(tx.serialize()).toString("base64");

  const executeResponse = await fetchJson(`${JUP_API_BASE}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...optionalApiKeyHeader()
    },
    body: JSON.stringify({ signedTransaction, requestId })
  });

  return executeResponse;
}

async function fetchSolUsdPrice(): Promise<number> {
  const now = Date.now();
  if (solPriceCache && solPriceCache.expiresAt > now) {
    return solPriceCache.value;
  }

  const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${SOL_MINT}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`failed to fetch SOL price (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const pairs = Array.isArray(payload.pairs) ? (payload.pairs as Array<Record<string, unknown>>) : [];
  const solanaPairs = pairs.filter((pair) => String(pair.chainId || "") === "solana");
  const best = solanaPairs.sort((a, b) => {
    const la = Number((a.liquidity as Record<string, unknown> | undefined)?.usd || 0);
    const lb = Number((b.liquidity as Record<string, unknown> | undefined)?.usd || 0);
    return lb - la;
  })[0];
  const price = Number(best?.priceUsd || 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("SOL price unavailable");
  }

  solPriceCache = { value: price, expiresAt: now + 15_000 };
  return price;
}

export async function executeUltraBuy(input: {
  outputMint: string;
  amountUsd: number;
}): Promise<Record<string, unknown>> {
  const wallet = traderWallet();
  let amountNative = "0";
  if (BUY_INPUT_MINT === USDC_MINT) {
    amountNative = String(Math.max(1, Math.floor(input.amountUsd * 1_000_000)));
  } else if (BUY_INPUT_MINT === SOL_MINT) {
    const solPriceUsd = await fetchSolUsdPrice();
    const amountSol = Math.max(0.00001, input.amountUsd / Math.max(0.00001, solPriceUsd));
    amountNative = String(Math.max(10_000, Math.floor(amountSol * 1_000_000_000)));
  } else {
    throw new Error(`unsupported ENIGMA_BUY_INPUT_MINT=${BUY_INPUT_MINT}`);
  }

  const orderUrl =
    `${JUP_API_BASE}/order` +
    `?inputMint=${BUY_INPUT_MINT}` +
    `&outputMint=${encodeURIComponent(input.outputMint)}` +
    `&amount=${amountNative}` +
    `&taker=${wallet.publicKey.toBase58()}`;

  const orderResponse = await fetchJson(orderUrl, {
    headers: {
      Accept: "application/json",
      ...optionalApiKeyHeader()
    }
  });

  const executeResponse = await signAndExecute(wallet, orderResponse);
  return {
    side: "BUY",
    inputMint: BUY_INPUT_MINT,
    outputMint: input.outputMint,
    amountUsd: input.amountUsd,
    order: orderResponse,
    execution: executeResponse
  };
}

export async function executeUltraSell(input: { mint: string }): Promise<Record<string, unknown>> {
  const wallet = traderWallet();
  const holdings = await fetchJson(`${JUP_API_BASE}/holdings/${wallet.publicKey.toBase58()}`, {
    headers: {
      Accept: "application/json",
      ...optionalApiKeyHeader()
    }
  });

  const tokens = (holdings.tokens as Record<string, unknown>) || {};
  const tokenAccounts = Array.isArray(tokens[input.mint])
    ? (tokens[input.mint] as Array<Record<string, unknown>>)
    : [];

  if (!tokenAccounts.length) {
    throw new Error("no token balance found for mint in Jupiter holdings");
  }

  const amountRaw = tokenAccounts
    .map((entry) => BigInt(String(entry.amount || "0")))
    .reduce((sum, value) => sum + value, 0n);

  if (amountRaw <= 0n) {
    throw new Error("token balance is zero; nothing to sell");
  }

  const orderUrl =
    `${JUP_API_BASE}/order` +
    `?inputMint=${encodeURIComponent(input.mint)}` +
    `&outputMint=${encodeURIComponent(BUY_INPUT_MINT)}` +
    `&amount=${amountRaw.toString()}` +
    `&taker=${wallet.publicKey.toBase58()}`;

  const orderResponse = await fetchJson(orderUrl, {
    headers: {
      Accept: "application/json",
      ...optionalApiKeyHeader()
    }
  });

  const executeResponse = await signAndExecute(wallet, orderResponse);
  return {
    side: "SELL",
    inputMint: input.mint,
    outputMint: BUY_INPUT_MINT,
    amountRaw: amountRaw.toString(),
    order: orderResponse,
    execution: executeResponse
  };
}

export async function executeSolTransfer(input: {
  destinationWallet: string;
  lamports: number;
}): Promise<Record<string, unknown>> {
  const wallet = traderWallet();
  const connection = rpcConnection();
  const lamports = Math.max(1, Math.floor(Number(input.lamports || 0)));
  const destination = new PublicKey(input.destinationWallet);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: destination,
      lamports
    })
  );

  const signature = await connection.sendTransaction(tx, [wallet], { skipPreflight: false });
  await connection.confirmTransaction(signature, "confirmed");

  return {
    ok: true,
    signature,
    destinationWallet: input.destinationWallet,
    lamports
  };
}
