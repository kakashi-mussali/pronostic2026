import { Redis } from "@upstash/redis";
import type { Entry, Results } from "./scoring";

export type Config = { pin: string | null; locked: boolean; results: Results };

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const ENTRIES = "wc:entries";
const CONFIG = "wc:config";
const DEFAULT_CFG: Config = { pin: null, locked: false, results: null };

interface Store {
  getEntries(): Promise<Entry[]>;
  upsertEntry(e: Entry): Promise<void>;
  getConfig(): Promise<Config>;
  setConfig(c: Config): Promise<void>;
  clearEntries(): Promise<void>;
}

const parse = <T,>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : (v as T));

let store: Store;

if (url && token) {
  const redis = new Redis({ url, token });
  store = {
    async getEntries() {
      const h = await redis.hgetall<Record<string, unknown>>(ENTRIES);
      if (!h) return [];
      return Object.values(h).map((v) => parse<Entry>(v));
    },
    async upsertEntry(e) {
      await redis.hset(ENTRIES, { [e.id]: JSON.stringify(e) });
    },
    async getConfig() {
      const c = await redis.get<unknown>(CONFIG);
      return c ? parse<Config>(c) : { ...DEFAULT_CFG };
    },
    async setConfig(c) {
      await redis.set(CONFIG, JSON.stringify(c));
    },
    async clearEntries() {
      await redis.del(ENTRIES);
    },
  };
} else {
  // Fallback mémoire — DEV LOCAL UNIQUEMENT (non persistant en serverless).
  const g = globalThis as unknown as {
    __wcmem?: { entries: Record<string, Entry>; config: Config };
  };
  g.__wcmem = g.__wcmem || { entries: {}, config: { ...DEFAULT_CFG } };
  const mem = g.__wcmem;
  store = {
    async getEntries() { return Object.values(mem.entries); },
    async upsertEntry(e) { mem.entries[e.id] = e; },
    async getConfig() { return mem.config; },
    async setConfig(c) { mem.config = c; },
    async clearEntries() { mem.entries = {}; },
  };
  if (process.env.NODE_ENV !== "production") {
    console.warn("[pronos] Aucune base Upstash détectée — stockage mémoire (dev). Ajoute UPSTASH_REDIS_REST_URL/TOKEN pour le partage.");
  }
}

export const hasRedis = !!(url && token);
export default store;
