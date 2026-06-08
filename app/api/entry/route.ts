import { NextResponse } from "next/server";
import store from "@/lib/store";
import { normName, type Entry } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }

  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Indique ton prénom." }, { status: 400 });
  if (!b.champ || !b.final) return NextResponse.json({ error: "Choisis au moins le champion et le finaliste." }, { status: 400 });

  const cfg = await store.getConfig();
  if (cfg.locked) return NextResponse.json({ error: "Les pronos sont verrouillés 🔒" }, { status: 403 });

  const entries = await store.getEntries();
  const existing = entries.find((e) => normName(e.name) === normName(name));
  const id = existing ? existing.id : `${normName(name).replace(/[^a-z0-9]/g, "") || "x"}-${Math.random().toString(36).slice(2, 7)}`;

  const entry: Entry = {
    id,
    name,
    champ: String(b.champ ?? ""),
    final: String(b.final ?? ""),
    scorer: String(b.scorer ?? "").trim(),
    france: String(b.france ?? ""),
    surprise: String(b.surprise ?? "").trim(),
    fr: (b.fr as string | number) ?? "",
    sn: (b.sn as string | number) ?? "",
    total: (b.total as string | number) ?? "",
    createdAt: existing ? existing.createdAt : Date.now(),
  };

  await store.upsertEntry(entry);
  return NextResponse.json({ ok: true, updated: !!existing });
}
