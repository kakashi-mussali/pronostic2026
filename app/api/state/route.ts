import { NextResponse } from "next/server";
import store, { hasRedis } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [entries, cfg] = await Promise.all([store.getEntries(), store.getConfig()]);
  entries.sort((a, b) => a.createdAt - b.createdAt);
  return NextResponse.json({
    entries,
    config: { locked: !!cfg.locked, results: cfg.results ?? null, hasPin: !!cfg.pin },
    hasRedis,
  });
}
