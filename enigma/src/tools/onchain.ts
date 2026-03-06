interface RpcResult<T> {
  result?: T;
  error?: { code: number; message: string };
}

interface TokenLargestAccount {
  amount: string;
  address: string;
  uiAmountString?: string;
}

interface HolderNode {
  tokenAccount: string;
  owner: string;
  amountRaw: number;
  amountUi: number;
  walletAgeDays: number | null;
  recentSignatures: string[];
}

interface HolderActivity {
  buyTxCount: number;
  sellTxCount: number;
}

interface AccountMeta {
  ownerProgram: string;
  executable: boolean;
  dataLength: number;
}

type RpcCaller = <T>(method: string, params: unknown[]) => Promise<T>;

const DEFAULT_RPC_TIMEOUT_MS = Number(process.env.ENIGMA_RPC_TIMEOUT_MS || 12_000);
const DEFAULT_RPC_ATTEMPTS = Math.max(1, Number(process.env.ENIGMA_RPC_RETRY_ATTEMPTS || 3));
const DEFAULT_CACHE_TTL_MS = Math.max(5_000, Number(process.env.ENIGMA_ONCHAIN_CACHE_TTL_SEC || 60) * 1000);
const FAILURE_CACHE_TTL_MS = 10_000;
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const SAMPLE_SIGNATURE_LIMIT = Math.max(25, Number(process.env.ENIGMA_HOLDER_SIGNATURE_SAMPLE || 25));
const SAMPLE_BUY_SELL_SIGNATURE_LIMIT = Math.max(
  8,
  Number(process.env.ENIGMA_HOLDER_BUYSELL_SIGNATURE_SAMPLE || 8)
);
const DEEP_SIGNATURE_LIMIT = Math.max(120, Number(process.env.ENIGMA_HOLDER_SIGNATURE_DEEP || 240));
const DEEP_BUY_SELL_SIGNATURE_LIMIT = Math.max(
  20,
  Number(process.env.ENIGMA_HOLDER_BUYSELL_SIGNATURE_DEEP || 60)
);
const SAMPLE_BUY_SELL_HOLDER_LIMIT = Math.max(
  3,
  Number(process.env.ENIGMA_HOLDER_BUYSELL_HOLDER_SAMPLE || 5)
);
const DEEP_BUY_SELL_HOLDER_LIMIT = Math.max(
  SAMPLE_BUY_SELL_HOLDER_LIMIT,
  Number(process.env.ENIGMA_HOLDER_BUYSELL_HOLDER_DEEP || 12)
);
const FULL_SIGNATURE_LIMIT = Math.max(
  DEEP_SIGNATURE_LIMIT,
  Number(process.env.ENIGMA_HOLDER_SIGNATURE_FULL || 5000)
);
const FULL_BUY_SELL_SIGNATURE_LIMIT = Math.max(
  DEEP_BUY_SELL_SIGNATURE_LIMIT,
  Number(process.env.ENIGMA_HOLDER_BUYSELL_SIGNATURE_FULL || 5000)
);
const DEFAULT_ANALYSIS_MODE_RAW = String(process.env.ENIGMA_HOLDER_ANALYSIS_MODE || "sample")
  .trim()
  .toLowerCase();
const DEFAULT_ANALYSIS_MODE: "sample" | "deep" | "full" =
  DEFAULT_ANALYSIS_MODE_RAW === "sample"
    ? "sample"
    : DEFAULT_ANALYSIS_MODE_RAW === "deep"
      ? "deep"
      : "full";

function parseWalletLabels(): Record<string, string> {
  const raw = String(process.env.ENIGMA_WALLET_LABELS || "").trim();
  if (!raw) return {};
  const map: Record<string, string> = {};
  raw.split(",").forEach((item) => {
    const [address, label] = item.split(":").map((value) => value.trim());
    if (!address || !label) return;
    map[address] = label;
  });
  return map;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sanitizeRpcEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "configured";
  }
}

function buildRpcUrls(primaryRpcUrl?: string): string[] {
  const configuredFallbacks = String(process.env.SOLANA_RPC_FALLBACK_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const urls = unique([
    primaryRpcUrl || "",
    ...configuredFallbacks,
    "https://api.mainnet-beta.solana.com"
  ]);

  return urls;
}

function isRetryableRpcError(error: unknown): boolean {
  const message = String((error as Error)?.message || "");
  if (/RPC HTTP (429|408|500|502|503|504)/.test(message)) return true;
  if (/RPC error -32005/.test(message)) return true;
  if (/timeout|aborted|network/i.test(message)) return true;
  return false;
}

async function rpcCallOnce<T>(rpcUrl: string, method: string, params: unknown[]): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_RPC_TIMEOUT_MS);

  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP ${res.status}`);
    }

    const json = (await res.json()) as RpcResult<T>;
    if (json.error) {
      throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
    }
    if (json.result === undefined) {
      throw new Error("RPC missing result");
    }

    return json.result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`RPC call failed (${method}) at ${rpcUrl}: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function createRpcCaller(primaryRpcUrl?: string): { call: RpcCaller; urls: string[] } {
  const urls = buildRpcUrls(primaryRpcUrl);

  const call: RpcCaller = async <T>(method: string, params: unknown[]): Promise<T> => {
    if (urls.length === 0) {
      throw new Error("No RPC URL configured");
    }

    let lastError: Error | null = null;

    for (const rpcUrl of urls) {
      for (let attempt = 0; attempt < DEFAULT_RPC_ATTEMPTS; attempt += 1) {
        try {
          return await rpcCallOnce<T>(rpcUrl, method, params);
        } catch (error) {
          const casted = error as Error;
          lastError = casted;
          const retryable = isRetryableRpcError(casted);
          const hasMoreAttempts = attempt < DEFAULT_RPC_ATTEMPTS - 1;
          if (!retryable || !hasMoreAttempts) break;

          const backoffMs = 250 * 2 ** attempt + Math.floor(Math.random() * 120);
          await sleep(backoffMs);
        }
      }
    }

    throw new Error(
      `All RPC endpoints failed for ${method}${lastError ? `: ${lastError.message}` : ""}`
    );
  };

  return { call, urls };
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

async function fetchSignaturesWithLookback(
  callRpc: RpcCaller,
  address: string,
  maxSignatures: number
): Promise<Array<{ signature: string; blockTime?: number | null }>> {
  const out: Array<{ signature: string; blockTime?: number | null }> = [];
  const pageSize = Math.min(200, Math.max(25, maxSignatures));
  let before: string | undefined;

  while (out.length < maxSignatures) {
    const limit = Math.min(pageSize, maxSignatures - out.length);
    const page = await callRpc<Array<{ signature: string; blockTime?: number | null }>>(
      "getSignaturesForAddress",
      [address, before ? { limit, before } : { limit }]
    );
    if (!page.length) break;
    out.push(...page);
    if (page.length < limit) break;
    before = page[page.length - 1]?.signature;
    if (!before) break;
  }

  return out;
}

function inferWalletSource(input: {
  configuredLabel?: string;
  owner: string;
  tokenAccount: string;
  isLpCandidate: boolean;
  isNewWallet: boolean;
  connectedGroupId: number;
  recentTxCount: number;
  buyTxCount: number;
  sellTxCount: number;
}): string {
  if (input.isLpCandidate) return "liquidity-pool-candidate";

  const configured = String(input.configuredLabel || "").trim();
  if (configured) return configured;

  if (input.owner === input.tokenAccount) return "token-account-owner";
  if (input.connectedGroupId > 0 && input.isNewWallet) return "clustered-new-wallet";
  if (input.connectedGroupId > 0) return "clustered-wallet";
  if (input.isNewWallet) return "new-wallet";

  const observedTrades = input.buyTxCount + input.sellTxCount;
  if (observedTrades >= 4 || input.recentTxCount >= 10) return "active-trader-wallet";

  return "unattributed-wallet";
}

function signaturesOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(a);
  return b.some((sig) => set.has(sig));
}

function connectedGroups(holders: HolderNode[]): HolderNode[][] {
  const visited = new Set<number>();
  const groups: HolderNode[][] = [];

  for (let i = 0; i < holders.length; i += 1) {
    if (visited.has(i)) continue;
    const queue = [i];
    visited.add(i);
    const group: HolderNode[] = [];

    while (queue.length > 0) {
      const idx = queue.shift() as number;
      const current = holders[idx];
      group.push(current);

      for (let j = 0; j < holders.length; j += 1) {
        if (visited.has(j)) continue;
        if (signaturesOverlap(current.recentSignatures, holders[j].recentSignatures)) {
          visited.add(j);
          queue.push(j);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

function avg(values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

async function loadAccountMetas(
  callRpc: RpcCaller,
  addresses: string[]
): Promise<Record<string, AccountMeta>> {
  if (addresses.length === 0) return {};

  const response = await callRpc<{
    value: Array<
      | {
          owner?: string;
          executable?: boolean;
          data?: [string, string] | string;
        }
      | null
    >;
  }>("getMultipleAccounts", [addresses, { encoding: "base64" }]);

  const output: Record<string, AccountMeta> = {};
  response.value.forEach((value, index) => {
    if (!value) return;
    const dataRaw = value.data;
    let dataLength = 0;
    if (Array.isArray(dataRaw) && typeof dataRaw[0] === "string") {
      try {
        dataLength = Buffer.from(dataRaw[0], "base64").length;
      } catch {
        dataLength = 0;
      }
    } else if (typeof dataRaw === "string") {
      try {
        dataLength = Buffer.from(dataRaw, "base64").length;
      } catch {
        dataLength = 0;
      }
    }
    output[addresses[index]] = {
      ownerProgram: String(value.owner || ""),
      executable: Boolean(value.executable),
      dataLength
    };
  });
  return output;
}

async function loadOwners(callRpc: RpcCaller, tokenAccounts: string[]): Promise<Record<string, string>> {
  if (tokenAccounts.length === 0) return {};

  const response = await callRpc<{
    value: Array<
      | {
          data?: {
            parsed?: {
              info?: { owner?: string };
            };
          };
        }
      | null
    >;
  }>("getMultipleAccounts", [tokenAccounts, { encoding: "jsonParsed" }]);

  const output: Record<string, string> = {};
  response.value.forEach((value, index) => {
    const owner = value?.data?.parsed?.info?.owner;
    if (owner) {
      output[tokenAccounts[index]] = owner;
    }
  });
  return output;
}

async function walletAgeDays(
  callRpc: RpcCaller,
  owner: string,
  signatureLimit: number
): Promise<number | null> {
  try {
    const signatures = await fetchSignaturesWithLookback(callRpc, owner, signatureLimit);

    const times = signatures
      .map((sig) => sig.blockTime || null)
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    if (times.length === 0) return null;

    const oldest = times[0] * 1000;
    return Math.max(0, (Date.now() - oldest) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

async function tokenAccountRecentSignatures(
  callRpc: RpcCaller,
  tokenAccount: string,
  signatureLimit: number
): Promise<string[]> {
  try {
    const signatures = await fetchSignaturesWithLookback(callRpc, tokenAccount, signatureLimit);
    return signatures.map((sig) => sig.signature).filter(Boolean);
  } catch {
    return [];
  }
}

function getAccountKeys(transaction: Record<string, unknown>): string[] {
  const keys = (transaction?.message as Record<string, unknown> | undefined)
    ?.accountKeys as Array<string | { pubkey?: string }> | undefined;
  if (!Array.isArray(keys)) return [];
  return keys.map((key) => (typeof key === "string" ? key : String(key.pubkey || ""))).filter(Boolean);
}

function parseTokenAmount(value: unknown): number {
  const entry = (value as Record<string, unknown>) || {};
  const ui = (entry.uiTokenAmount as Record<string, unknown> | undefined) || {};
  const amount = Number(ui.uiAmountString || ui.uiAmount || 0);
  if (Number.isFinite(amount)) return amount;
  return Number(ui.amount || 0) || 0;
}

function tokenAccountDeltaFromTx(tx: Record<string, unknown>, tokenAccount: string): number {
  const txBody = (tx.transaction as Record<string, unknown> | undefined) || {};
  const meta = (tx.meta as Record<string, unknown> | undefined) || {};
  const keys = getAccountKeys(txBody);
  if (!keys.length) return 0;

  const pre = (meta.preTokenBalances as Array<Record<string, unknown>> | undefined) || [];
  const post = (meta.postTokenBalances as Array<Record<string, unknown>> | undefined) || [];
  const idx = keys.findIndex((key) => key === tokenAccount);
  if (idx < 0) return 0;

  const preEntry = pre.find((entry) => Number(entry.accountIndex || -1) === idx);
  const postEntry = post.find((entry) => Number(entry.accountIndex || -1) === idx);

  return parseTokenAmount(postEntry) - parseTokenAmount(preEntry);
}

async function tokenAccountBuySellActivity(
  callRpc: RpcCaller,
  tokenAccount: string,
  signatureLimit: number
): Promise<HolderActivity> {
  try {
    const signatures = await fetchSignaturesWithLookback(callRpc, tokenAccount, signatureLimit);

    let buyTxCount = 0;
    let sellTxCount = 0;

    for (const item of signatures) {
      if (!item.signature) continue;
      let tx: Record<string, unknown> | null = null;
      try {
        tx = await callRpc<Record<string, unknown> | null>("getTransaction", [
          item.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }
        ]);
      } catch {
        continue;
      }
      if (!tx) continue;

      const delta = tokenAccountDeltaFromTx(tx, tokenAccount);
      if (delta > 0) buyTxCount += 1;
      else if (delta < 0) sellTxCount += 1;
    }

    return { buyTxCount, sellTxCount };
  } catch {
    return { buyTxCount: 0, sellTxCount: 0 };
  }
}

function ownerMintDeltaFromTx(tx: Record<string, unknown>, owner: string, mint: string): number {
  const meta = (tx.meta as Record<string, unknown> | undefined) || {};
  const pre = (meta.preTokenBalances as Array<Record<string, unknown>> | undefined) || [];
  const post = (meta.postTokenBalances as Array<Record<string, unknown>> | undefined) || [];

  const sumFor = (entries: Array<Record<string, unknown>>): number =>
    entries.reduce((sum, entry) => {
      const entryOwner = String(entry.owner || "");
      const entryMint = String(entry.mint || "");
      if (entryOwner !== owner || entryMint !== mint) return sum;
      return sum + parseTokenAmount(entry);
    }, 0);

  return sumFor(post) - sumFor(pre);
}

async function ownerAddressBuySellActivity(
  callRpc: RpcCaller,
  owner: string,
  mint: string,
  signatureLimit: number
): Promise<HolderActivity> {
  try {
    const signatures = await fetchSignaturesWithLookback(callRpc, owner, signatureLimit);
    let buyTxCount = 0;
    let sellTxCount = 0;

    for (const item of signatures) {
      if (!item.signature) continue;
      let tx: Record<string, unknown> | null = null;
      try {
        tx = await callRpc<Record<string, unknown> | null>("getTransaction", [
          item.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }
        ]);
      } catch {
        continue;
      }
      if (!tx) continue;

      const delta = ownerMintDeltaFromTx(tx, owner, mint);
      if (delta > 0) buyTxCount += 1;
      else if (delta < 0) sellTxCount += 1;
    }

    return { buyTxCount, sellTxCount };
  } catch {
    return { buyTxCount: 0, sellTxCount: 0 };
  }
}

function pickLpCandidateTokenAccount(input: {
  holders: HolderNode[];
  totalSupply: number;
  ownerMetas: Record<string, AccountMeta>;
  configuredLabels: Record<string, string>;
}): string {
  if (!input.holders.length || input.totalSupply <= 0) return "";

  let bestTokenAccount = "";
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestAmountRaw = 0;

  input.holders.forEach((holder, index) => {
    const ownerMeta = input.ownerMetas[holder.owner];
    const configuredLabel = String(input.configuredLabels[holder.owner] || "").toLowerCase();
    const amountPct = pct(holder.amountRaw, input.totalSupply);
    let score = 0;

    if (index === 0) score += 2.5;
    else if (index < 3) score += 1;

    if (amountPct >= 10) score += 2;
    else if (amountPct >= 5) score += 1;

    if (holder.recentSignatures.length >= 15) score += 2;
    else if (holder.recentSignatures.length >= 8) score += 1;

    if (holder.walletAgeDays === null) score += 1;

    if (ownerMeta) {
      if (ownerMeta.ownerProgram && ownerMeta.ownerProgram !== SYSTEM_PROGRAM_ID) score += 2;
      if (ownerMeta.dataLength > 0) score += 1;
      if (ownerMeta.executable) score -= 3;
    }

    if (configuredLabel && !/lp|pool|amm|dex|vault/.test(configuredLabel)) score -= 3;
    if (configuredLabel && /lp|pool|amm|dex|vault/.test(configuredLabel)) score += 1;

    if (score > bestScore || (score === bestScore && holder.amountRaw > bestAmountRaw)) {
      bestScore = score;
      bestAmountRaw = holder.amountRaw;
      bestTokenAccount = holder.tokenAccount;
    }
  });

  return bestScore >= 4 ? bestTokenAccount : "";
}

export function createOnchainTool(rpcUrl?: string) {
  const rpc = createRpcCaller(rpcUrl);
  const primaryRpc = rpc.urls[0];
  const knownWalletLabels = parseWalletLabels();
  const riskCache = new Map<string, { expiresAt: number; data: Record<string, unknown> }>();

  return {
    async riskSignals(
      mint: string,
      options?: {
        holderLimit?: number;
        analysisMode?: "sample" | "deep" | "full";
      }
    ): Promise<Record<string, unknown>> {
      if (!primaryRpc) {
        return {
          mint,
          concentrationRisk: "unknown",
          suspiciousPatterns: [],
          note: "Missing SOLANA_RPC_URL/HELIUS_API_KEY; returning placeholder signals."
        };
      }

      const holderLimit = Math.min(50, Math.max(8, Number(options?.holderLimit || 10)));
      const requestedMode = String(options?.analysisMode || "").trim().toLowerCase();
      const analysisMode: "sample" | "deep" | "full" =
        requestedMode === "sample"
          ? "sample"
          : requestedMode === "deep"
            ? "deep"
            : requestedMode === "full"
              ? "full"
              : DEFAULT_ANALYSIS_MODE;
      const signatureSamplePerAccount =
        analysisMode === "full"
          ? FULL_SIGNATURE_LIMIT
          : analysisMode === "deep"
            ? DEEP_SIGNATURE_LIMIT
            : SAMPLE_SIGNATURE_LIMIT;
      const buySellSignatureLimit =
        analysisMode === "full"
          ? FULL_BUY_SELL_SIGNATURE_LIMIT
          : analysisMode === "deep"
            ? DEEP_BUY_SELL_SIGNATURE_LIMIT
            : SAMPLE_BUY_SELL_SIGNATURE_LIMIT;
      const buySellHolderLimit =
        analysisMode === "full"
          ? holderLimit
          : analysisMode === "deep"
            ? DEEP_BUY_SELL_HOLDER_LIMIT
            : SAMPLE_BUY_SELL_HOLDER_LIMIT;
      const cacheKey = `${mint.trim()}::${holderLimit}::${analysisMode}`;
      const now = Date.now();
      const cached = riskCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }

      try {
        const [largestAccounts, supply, mintAccountInfo] = await Promise.all([
          rpc.call<{ value: TokenLargestAccount[] }>("getTokenLargestAccounts", [mint]),
          rpc.call<{ value: { amount: string; decimals: number; uiAmount: number | null } }>(
            "getTokenSupply",
            [mint]
          ),
          rpc.call<{
            value: {
              data?: {
                parsed?: {
                  info?: {
                    mintAuthority?: string | null;
                    freezeAuthority?: string | null;
                  };
                };
              };
            } | null;
          }>("getAccountInfo", [mint, { encoding: "jsonParsed" }])
        ]);

        const mintInfo = mintAccountInfo.value?.data?.parsed?.info;
        const mintAuthority = mintInfo?.mintAuthority || null;
        const freezeAuthority = mintInfo?.freezeAuthority || null;
        const hasMintAuthority = Boolean(mintAuthority);
        const hasFreezeAuthority = Boolean(freezeAuthority);

        const riskFlags: string[] = [];
        if (hasMintAuthority) riskFlags.push("Mint authority is active (token supply can potentially expand)");
        if (hasFreezeAuthority)
          riskFlags.push("Freeze authority is active (accounts can potentially be frozen)");

        const totalSupply = Number(supply.value.amount || 0);
        const analyzed = largestAccounts.value.slice(0, holderLimit);
        const tokenAccounts = analyzed.map((holder) => holder.address);
        const ownersByTokenAccount = await loadOwners(rpc.call, tokenAccounts);
        const walletAgeCache = new Map<string, Promise<number | null>>();

        const holderNodes: HolderNode[] = await Promise.all(
          analyzed.map(async (holder) => {
            const owner = ownersByTokenAccount[holder.address] || holder.address;
            if (!walletAgeCache.has(owner)) {
              walletAgeCache.set(owner, walletAgeDays(rpc.call, owner, signatureSamplePerAccount));
            }
            const [signatures, age] = await Promise.all([
              tokenAccountRecentSignatures(rpc.call, holder.address, signatureSamplePerAccount),
              walletAgeCache.get(owner) as Promise<number | null>
            ]);
            return {
              tokenAccount: holder.address,
              owner,
              amountRaw: Number(holder.amount || 0),
              amountUi: Number(holder.uiAmountString || 0),
              walletAgeDays: age,
              recentSignatures: signatures
            };
          })
        );

        const ownerMetas = await loadAccountMetas(
          rpc.call,
          Array.from(new Set(holderNodes.map((holder) => holder.owner)))
        );
        const lpCandidateTokenAccount = pickLpCandidateTokenAccount({
          holders: holderNodes,
          totalSupply,
          ownerMetas,
          configuredLabels: knownWalletLabels
        });
        const top3WithLp = largestAccounts.value.slice(0, 3);
        const topRawWithLp = top3WithLp.reduce((sum, holder) => sum + Number(holder.amount || 0), 0);
        const top3WithLpPct = pct(topRawWithLp, totalSupply);
        const top10WithLp = largestAccounts.value.slice(0, 10);
        const top10RawWithLp = top10WithLp.reduce((sum, holder) => sum + Number(holder.amount || 0), 0);
        const top10WithLpPct = pct(top10RawWithLp, totalSupply);
        const concentrationPool = lpCandidateTokenAccount
          ? largestAccounts.value.filter((holder) => holder.address !== lpCandidateTokenAccount)
          : largestAccounts.value;
        const top3ExcludingLp = concentrationPool.slice(0, 3);
        const topRawExcludingLp = top3ExcludingLp.reduce(
          (sum, holder) => sum + Number(holder.amount || 0),
          0
        );
        const top3Pct = pct(topRawExcludingLp, totalSupply);
        const top10ExcludingLp = concentrationPool.slice(0, 10);
        const top10RawExcludingLp = top10ExcludingLp.reduce(
          (sum, holder) => sum + Number(holder.amount || 0),
          0
        );
        const top10Pct = pct(top10RawExcludingLp, totalSupply);

        let concentrationRisk = "low";
        if (top10Pct >= 80) concentrationRisk = "high";
        else if (top10Pct >= 55) concentrationRisk = "medium";
        if (top10Pct >= 80) riskFlags.push("Top-10 holder concentration (excluding LP candidate) is elevated");
        if (!lpCandidateTokenAccount) {
          riskFlags.push("LP candidate not confidently identified; concentration may include LP account");
        }

        const freshHolders = holderNodes.filter(
          (holder) => holder.walletAgeDays !== null && holder.walletAgeDays <= 14
        );
        const freshRaw = freshHolders.reduce((sum, holder) => sum + holder.amountRaw, 0);

        const groups = connectedGroups(holderNodes).filter((group) => group.length >= 2);
        const connectedAccounts = groups.flat();
        const connectedRaw = connectedAccounts.reduce((sum, holder) => sum + holder.amountRaw, 0);
        const groupByOwner = new Map<string, number>();
        groups.forEach((group, idx) => {
          group.forEach((holder) => groupByOwner.set(holder.owner, idx + 1));
        });

        const holderBehavior = {
          analyzedTopAccounts: holderNodes.length,
          avgWalletAgeDays: avg(holderNodes.map((holder) => holder.walletAgeDays)),
          newWalletCount: freshHolders.length,
          newWalletHolderPct: Number(pct(freshRaw, totalSupply).toFixed(2)),
          connectedGroupCount: groups.length,
          connectedHolderPct: Number(pct(connectedRaw, totalSupply).toFixed(2)),
          analysisCoverage: {
            topAccountsAnalyzed: holderNodes.length,
            buySellTxSamplePerAccount: buySellSignatureLimit,
            accountsWithBuySellSampling: Math.min(holderNodes.length, buySellHolderLimit),
            buySellSource:
              analysisMode === "sample" ? "token-account" : "owner-address",
            signatureSamplePerAccount,
            walletAgeSignatureSamplePerOwner: signatureSamplePerAccount,
            mode: analysisMode,
            fullHistory: false,
            note:
              analysisMode === "full"
                ? "Full holder mode: scans holder owner-address history across available RPC pages for analyzed holders. Data may still be bounded by RPC/provider retention and configured caps."
                : analysisMode === "deep"
                  ? "Deep holder review mode: wallet age and buy/sell counts scan older owner-address signatures with pagination, but still not complete lifetime history."
                  : "Fast scan mode: behavior metrics are sampled from recent token-account activity and are not full lifetime wallet history."
          },
          connectedGroups: groups.map((group, idx) => ({
            id: idx + 1,
            holderCount: group.length,
            holdPct: Number(
              pct(
                group.reduce((sum, holder) => sum + holder.amountRaw, 0),
                totalSupply
              ).toFixed(2)
            ),
            owners: group.map((holder) => holder.owner),
            reason: "linked by shared recent token-account signatures"
          }))
        };

        const activityByTokenAccount = await Promise.all(
          holderNodes.slice(0, buySellHolderLimit).map(async (holder) => {
            const activity =
              analysisMode === "deep" || analysisMode === "full"
                ? await ownerAddressBuySellActivity(
                    rpc.call,
                    holder.owner,
                    mint,
                    buySellSignatureLimit
                  )
                : await tokenAccountBuySellActivity(
                    rpc.call,
                    holder.tokenAccount,
                    buySellSignatureLimit
                  );
            return { tokenAccount: holder.tokenAccount, activity };
          })
        );
        const activityMap = new Map(
          activityByTokenAccount.map((entry) => [entry.tokenAccount, entry.activity])
        );

        const holderProfiles = holderNodes.map((holder) => {
          const amountPct = Number(pct(holder.amountRaw, totalSupply).toFixed(2));
          const isNewWallet = holder.walletAgeDays !== null && holder.walletAgeDays <= 14;
          const connectedGroupId = groupByOwner.get(holder.owner) || 0;
          const isLpCandidate =
            Boolean(lpCandidateTokenAccount) && holder.tokenAccount === lpCandidateTokenAccount;
          const activity = activityMap.get(holder.tokenAccount) || { buyTxCount: 0, sellTxCount: 0 };
          const walletLabel = inferWalletSource({
            configuredLabel: knownWalletLabels[holder.owner],
            owner: holder.owner,
            tokenAccount: holder.tokenAccount,
            isLpCandidate,
            isNewWallet,
            connectedGroupId,
            recentTxCount: holder.recentSignatures.length,
            buyTxCount: activity.buyTxCount,
            sellTxCount: activity.sellTxCount
          });
          const sourceTag = walletLabel.toLowerCase();
          const tags: string[] = [];
          if (isLpCandidate) tags.push("lp-vault-candidate");
          if (amountPct >= 2) tags.push("whale");
          if (isNewWallet) tags.push("new-wallet");
          if (connectedGroupId > 0) tags.push(`cluster-${connectedGroupId}`);
          if (holder.recentSignatures.length >= 8) tags.push("high-activity");
          if (sourceTag.includes("okx")) tags.push("okx-labeled");
          if (sourceTag.includes("binance")) tags.push("binance-labeled");
          if (sourceTag.includes("phantom")) tags.push("phantom-labeled");

          return {
            owner: holder.owner,
            tokenAccount: holder.tokenAccount,
            amountUi: holder.amountUi,
            amountPct,
            walletAgeDays: holder.walletAgeDays,
            connectedGroupId,
            recentTxCount: holder.recentSignatures.length,
            walletSource: walletLabel,
            buyTxCount: activity.buyTxCount,
            sellTxCount: activity.sellTxCount,
            tags
          };
        });

        if (holderBehavior.newWalletHolderPct >= 20) {
          riskFlags.push("High share held by recently observed wallets");
        }
        if (holderBehavior.connectedHolderPct >= 25) {
          riskFlags.push("Connected holder cluster controls significant supply");
        }

        const result = {
          mint,
          concentrationRisk,
          suspiciousPatterns: riskFlags,
          top3HolderSharePct: Number(top3Pct.toFixed(2)),
          top3HolderSharePctWithLp: Number(top3WithLpPct.toFixed(2)),
          top10HolderSharePct: Number(top10Pct.toFixed(2)),
          top10HolderSharePctWithLp: Number(top10WithLpPct.toFixed(2)),
          concentrationWindow: "top10",
          concentrationMode: lpCandidateTokenAccount
            ? "top10_excluding_lp_candidate"
            : "top10_lp_candidate_unconfirmed",
          lpCandidateTokenAccount: lpCandidateTokenAccount || null,
          totalSupplyRaw: totalSupply,
          hasMintAuthority,
          hasFreezeAuthority,
          mintAuthority,
          freezeAuthority,
          holderBehavior,
          holderProfiles,
          sampleTopHolders: largestAccounts.value.slice(0, 8)
        };

        riskCache.set(cacheKey, { expiresAt: now + DEFAULT_CACHE_TTL_MS, data: result });
        return result;
      } catch (error) {
        const fallback = {
          mint,
          concentrationRisk: "unknown",
          suspiciousPatterns: [],
          note: `Risk check failed: ${(error as Error).message}`
        };
        riskCache.set(cacheKey, { expiresAt: now + FAILURE_CACHE_TTL_MS, data: fallback });
        return fallback;
      }
    },

    async killSwitchScore(mint: string): Promise<Record<string, unknown>> {
      const risk = await this.riskSignals(mint);

      if (risk.concentrationRisk === "unknown") {
        return {
          mint,
          score: 0,
          verdict: "BLOCK",
          reasons: ["Unable to complete on-chain checks"],
          uncertainty: "high",
          risk
        };
      }

      const top10Pct = Number(risk.top10HolderSharePct || 0);
      const hasMintAuthority = Boolean(risk.hasMintAuthority);
      const hasFreezeAuthority = Boolean(risk.hasFreezeAuthority);
      const holderBehavior = (risk.holderBehavior as Record<string, unknown>) || {};
      const connectedPct = Number(holderBehavior.connectedHolderPct || 0);
      const newWalletPct = Number(holderBehavior.newWalletHolderPct || 0);

      const reasons: string[] = [];
      let score = 100;

      if (top10Pct >= 85) {
        score -= 40;
        reasons.push("Top-10 holders control >=85% supply");
      } else if (top10Pct >= 65) {
        score -= 20;
        reasons.push("Top-10 holders control >=65% supply");
      } else if (top10Pct >= 45) {
        score -= 10;
        reasons.push("Top-10 holder concentration is non-trivial");
      } else {
        reasons.push("Holder concentration appears relatively distributed");
      }

      if (connectedPct >= 35) {
        score -= 20;
        reasons.push("Connected holder cluster >=35% of supply");
      } else if (connectedPct >= 20) {
        score -= 12;
        reasons.push("Connected holder cluster >=20% of supply");
      }

      if (newWalletPct >= 25) {
        score -= 15;
        reasons.push("Large share held by recently observed wallets");
      } else if (newWalletPct >= 12) {
        score -= 8;
        reasons.push("Notable share held by new wallets");
      }

      if (hasMintAuthority) {
        score -= 25;
        reasons.push("Mint authority is enabled");
      } else {
        reasons.push("Mint authority appears revoked");
      }

      if (hasFreezeAuthority) {
        score -= 20;
        reasons.push("Freeze authority is enabled");
      } else {
        reasons.push("Freeze authority appears revoked");
      }

      score = Math.max(0, Math.min(100, score));

      let verdict = "PASS";
      if (score < 50) verdict = "BLOCK";
      else if (score < 75) verdict = "CAUTION";

      return {
        mint,
        score,
        verdict,
        reasons,
        uncertainty: "medium",
        risk
      };
    },

    async rpcHealth(): Promise<Record<string, unknown>> {
      if (!primaryRpc) {
        return { ok: false, message: "Missing SOLANA_RPC_URL/HELIUS_API_KEY" };
      }

      const endpoint = sanitizeRpcEndpoint(primaryRpc);
      try {
        const version = await rpc.call<{ "solana-core": string }>("getVersion", []);
        return {
          ok: true,
          version,
          endpoint,
          fallbackCount: Math.max(0, rpc.urls.length - 1)
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message, endpoint };
      }
    }
  };
}
