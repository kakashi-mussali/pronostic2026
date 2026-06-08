import { NextResponse } from "next/server";
import store from "@/lib/store";
import { normName, normalizeBracket, emptyBracket, type Entry, type Bracket } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }

  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Indique ton prénom." }, { status: 400 });

  const cfg = await store.getConfig();
  if (cfg.locked) return NextResponse.json({ error: "Les pronos sont verrouillés 🔒" }, { status: 403 });

  const entries = await store.getEntries();
  const existing = entries.find((e) => normName(e.name) === normName(name));
  const id = existing ? existing.id : `${normName(name).replace(/[^a-z0-9]/g, "") || "x"}-${Math.random().toString(36).slice(2, 7)}`;

  const groups = (b.groups && typeof b.groups === "object") ? (b.groups as Entry["groups"]) : {};
  const bracket = normalizeBracket((b.bracket as Bracket) || emptyBracket());

  const entry: Entry = {
    id, name,
    createdAt: existing ? existing.createdAt : Date.now(),
    groups,
    bracket,
    scorer: String(b.scorer ?? "").trim(),
    surprise: String(b.surprise ?? "").trim(),
    total: (b.total as string | number) ?? "",
  };

  await store.upsertEntry(entry);
  return NextResponse.json({ ok: true, updated: !!existing });
}
