import { readFile } from "node:fs/promises";
import { createLogger } from "../tools/logger.js";
import { createOnchainTool } from "../tools/onchain.js";
import { createStorageTool } from "../tools/storage.js";
import { createWebTool } from "../tools/web.js";
import type { AgentConfig, AgentContext } from "./schema.js";

export async function loadConfig(): Promise<AgentConfig> {
  const configUrl = new URL("../config/default.json", import.meta.url);
  const raw = await readFile(configUrl, "utf8");
  return JSON.parse(raw) as AgentConfig;
}

function resolveRpcUrl(config: AgentConfig): string | undefined {
  if (process.env.SOLANA_RPC_URL) {
    return process.env.SOLANA_RPC_URL;
  }

  const heliusKeys = [
    ...String(process.env.HELIUS_API_KEYS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    String(process.env.HELIUS_API_KEY || "").trim()
  ].filter(Boolean);

  if (heliusKeys.length) {
    return `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(heliusKeys[0])}`;
  }

  return config.onchain?.rpcUrl;
}

export async function createEnigmaContext(): Promise<AgentContext> {
  const config = await loadConfig();
  const logger = createLogger(process.env.ENIGMA_LOG_LEVEL);
  const rpcUrl = resolveRpcUrl(config);

  return {
    config,
    tools: {
      web: createWebTool(),
      onchain: createOnchainTool(rpcUrl),
      storage: createStorageTool(),
      logger
    }
  };
}
