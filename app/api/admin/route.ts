import { NextResponse } from "next/server";
import store from "@/lib/store";
import type { Results } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }

  const action = String(b.action ?? "");
  const cfg = await store.getConfig();

  if (action === "status") {
    return NextResponse.json({ hasPin: !!cfg.pin });
  }

  if (action === "setup") {
    if (cfg.pin) return NextResponse.json({ error: "Un code existe déjà." }, { status: 400 });
    const pin = String(b.pin ?? "").trim();
    if (!pin) return NextResponse.json({ error: "Saisis un code." }, { status: 400 });
    cfg.pin = pin;
    await store.setConfig(cfg);
    return NextResponse.json({ ok: true });
  }

  // À partir d'ici, code requis
  if (!cfg.pin || String(b.pin ?? "") !== cfg.pin) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 403 });
  }

  switch (action) {
    case "auth":
      return NextResponse.json({ ok: true });
    case "results":
      cfg.results = (b.results as Results) ?? null;
      await store.setConfig(cfg);
      return NextResponse.json({ ok: true });
    case "lock":
      cfg.locked = !!b.locked;
      await store.setConfig(cfg);
      return NextResponse.json({ ok: true, locked: cfg.locked });
    case "reset":
      await store.clearEntries();
      cfg.results = null;
      cfg.locked = false;
      await store.setConfig(cfg);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }
}
