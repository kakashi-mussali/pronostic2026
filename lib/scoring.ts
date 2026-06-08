import { STAGES, PTS } from "./data";

export type Entry = {
  id: string;
  name: string;
  champ: string;
  final: string;
  scorer: string;
  france: string;
  surprise: string;
  fr: string | number;
  sn: string | number;
  total: string | number;
  createdAt: number;
};

export type Results = {
  champ: string;
  final: string;
  scorer: string;
  france: string;
  surprise: string;
  fr: string | number;
  sn: string | number;
  total: string | number;
} | null;

export function normName(s: string): string {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const num = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export type ScorePart = { label: string; pts: number };
export type Scored = { total: number; parts: ScorePart[] };

export function scoreEntry(e: Entry, res: Results): Scored {
  if (!res) return { total: 0, parts: [] };
  let pts = 0;
  const parts: ScorePart[] = [];
  const eq = (a: string, b: string) => !!a && !!b && normName(a) === normName(b);

  // Champion
  if (res.champ) {
    if (eq(e.champ, res.champ)) { pts += PTS.champ; parts.push({ label: "🏆 Champion", pts: PTS.champ }); }
    else if (res.final && eq(e.champ, res.final)) { pts += PTS.consolation; parts.push({ label: "✨ Champion→finaliste", pts: PTS.consolation }); }
  }
  // Finaliste
  if (res.final) {
    if (eq(e.final, res.final)) { pts += PTS.final; parts.push({ label: "🥈 Finaliste", pts: PTS.final }); }
    else if (res.champ && eq(e.final, res.champ)) { pts += PTS.consolation; parts.push({ label: "✨ Finaliste→champion", pts: PTS.consolation }); }
  }
  // Meilleur buteur
  if (res.scorer && e.scorer && eq(e.scorer, res.scorer)) { pts += PTS.scorer; parts.push({ label: "⚽ Buteur", pts: PTS.scorer }); }
  // Parcours France
  if (res.france && e.france) {
    const di = Math.abs(STAGES.indexOf(e.france) - STAGES.indexOf(res.france));
    if (STAGES.indexOf(e.france) >= 0 && STAGES.indexOf(res.france) >= 0) {
      if (di === 0) { pts += PTS.france; parts.push({ label: "🇫🇷 Bleus", pts: PTS.france }); }
      else if (di === 1) { pts += PTS.franceClose; parts.push({ label: "🇫🇷 Bleus (proche)", pts: PTS.franceClose }); }
    }
  }
  // Révélation
  if (res.surprise && e.surprise && eq(e.surprise, res.surprise)) { pts += PTS.surprise; parts.push({ label: "😮 Révélation", pts: PTS.surprise }); }
  // Score France-Sénégal
  const af = num(res.fr), as = num(res.sn), pf = num(e.fr), ps = num(e.sn);
  if (af !== null && as !== null && pf !== null && ps !== null) {
    if (pf === af && ps === as) { pts += PTS.scoreExact; parts.push({ label: "🎯 Score exact", pts: PTS.scoreExact }); }
    else if (Math.sign(pf - ps) === Math.sign(af - as)) { pts += PTS.scoreResult; parts.push({ label: "🎯 Bon résultat", pts: PTS.scoreResult }); }
  }
  return { total: pts, parts };
}

export type Ranked = { entry: Entry; score: Scored; ecart: number | null; rank: number };

export function rankEntries(entries: Entry[], res: Results): Ranked[] {
  const totalReal = res ? num(res.total) : null;
  const rows = entries.map((entry) => {
    const score = scoreEntry(entry, res);
    const est = num(entry.total);
    const ecart = totalReal !== null && est !== null ? Math.abs(est - totalReal) : null;
    return { entry, score, ecart, rank: 0 };
  });
  rows.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    const ea = a.ecart ?? Number.POSITIVE_INFINITY;
    const eb = b.ecart ?? Number.POSITIVE_INFINITY;
    if (ea !== eb) return ea - eb;
    return a.entry.createdAt - b.entry.createdAt;
  });
  let rank = 0, prevKey = "";
  rows.forEach((r, i) => {
    const key = `${r.score.total}|${r.ecart ?? "x"}`;
    if (key !== prevKey) { rank = i + 1; prevKey = key; }
    r.rank = rank;
  });
  return rows;
}
