import { PTS } from "./data";
import { GROUP_MATCHES } from "./fixtures";

export type Score = [number | string, number | string];

export type Bracket = {
  r32: { a: string; b: string }[]; // 16 affiches
  w32: string[]; // 16 vainqueurs -> quarts d'accès au tour suivant
  w16: string[]; // 8
  w8: string[];  // 4
  w4: string[];  // 2 (finalistes)
  champ: string; // 1
};

export type Predictions = {
  groups: Record<string, Score>; // matchId -> [butsHome, butsAway]
  bracket: Bracket;
  scorer: string;
  surprise: string;
  total: string | number;
};

export type Entry = { id: string; name: string; createdAt: number } & Predictions;
export type Results = Predictions | null;

export function emptyBracket(): Bracket {
  return {
    r32: Array.from({ length: 16 }, () => ({ a: "", b: "" })),
    w32: Array(16).fill(""),
    w16: Array(8).fill(""),
    w8: Array(4).fill(""),
    w4: Array(2).fill(""),
    champ: "",
  };
}

export function emptyPredictions(): Predictions {
  return { groups: {}, bracket: emptyBracket(), scorer: "", surprise: "", total: "" };
}

export function normName(s: string): string {
  return (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const num = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Nettoie un bracket : un vainqueur doit toujours faire partie de ses deux qualifiés.
export function normalizeBracket(b: Bracket): Bracket {
  const nb: Bracket = {
    r32: b.r32.map((m) => ({ a: m.a || "", b: m.b || "" })),
    w32: [...b.w32], w16: [...b.w16], w8: [...b.w8], w4: [...b.w4], champ: b.champ,
  };
  const ok = (winner: string, feeders: string[]) => winner && feeders.includes(winner) ? winner : "";
  for (let k = 0; k < 16; k++) nb.w32[k] = ok(nb.w32[k], [nb.r32[k].a, nb.r32[k].b]);
  for (let k = 0; k < 8; k++) nb.w16[k] = ok(nb.w16[k], [nb.w32[2 * k], nb.w32[2 * k + 1]]);
  for (let k = 0; k < 4; k++) nb.w8[k] = ok(nb.w8[k], [nb.w16[2 * k], nb.w16[2 * k + 1]]);
  for (let k = 0; k < 2; k++) nb.w4[k] = ok(nb.w4[k], [nb.w8[2 * k], nb.w8[2 * k + 1]]);
  nb.champ = ok(nb.champ, [nb.w4[0], nb.w4[1]]);
  return nb;
}

export type Breakdown = { groups: number; bracket: number; bonus: number; total: number; exact: number; good: number };

function intersectCount(a: string[], b: string[]): number {
  const set = new Set(b.filter(Boolean).map(normName));
  let n = 0;
  for (const x of a.filter(Boolean)) if (set.has(normName(x))) n++;
  return n;
}

export function scoreEntry(e: Predictions, res: Results): Breakdown {
  const empty: Breakdown = { groups: 0, bracket: 0, bonus: 0, total: 0, exact: 0, good: 0 };
  if (!res) return empty;
  let groups = 0, bracket = 0, bonus = 0, exact = 0, good = 0;

  // Matchs de groupes
  for (const m of GROUP_MATCHES) {
    const r = res.groups[m.id]; const p = e.groups[m.id];
    if (!r || !p) continue;
    const rh = num(r[0]), ra = num(r[1]), ph = num(p[0]), pa = num(p[1]);
    if (rh === null || ra === null || ph === null || pa === null) continue;
    if (ph === rh && pa === ra) { groups += PTS.groupExact; exact++; }
    else if (Math.sign(ph - pa) === Math.sign(rh - ra)) { groups += PTS.groupResult; good++; }
  }

  // Bracket (par appartenance à chaque tour)
  const rb = res.bracket, pb = e.bracket;
  if (rb && pb) {
    bracket += intersectCount(pb.w16, rb.w16) * PTS.bracketQuart;   // quarts (8)
    bracket += intersectCount(pb.w8, rb.w8) * PTS.bracketDemi;      // demies (4)
    bracket += intersectCount(pb.w4, rb.w4) * PTS.bracketFinal;     // finalistes (2)
    if (rb.champ && pb.champ && normName(pb.champ) === normName(rb.champ)) bracket += PTS.bracketChamp;
  }

  // Bonus
  if (res.scorer && e.scorer && normName(e.scorer) === normName(res.scorer)) bonus += PTS.scorer;
  if (res.surprise && e.surprise && normName(e.surprise) === normName(res.surprise)) bonus += PTS.surprise;

  const total = groups + bracket + bonus;
  return { groups, bracket, bonus, total, exact, good };
}

export type Ranked = { entry: Entry; bd: Breakdown; ecart: number | null; rank: number };

export function rankEntries(entries: Entry[], res: Results): Ranked[] {
  const totalReal = res ? num(res.total) : null;
  const rows = entries.map((entry) => {
    const bd = scoreEntry(entry, res);
    const est = num(entry.total);
    const ecart = totalReal !== null && est !== null ? Math.abs(est - totalReal) : null;
    return { entry, bd, ecart, rank: 0 };
  });
  rows.sort((a, b) => {
    if (b.bd.total !== a.bd.total) return b.bd.total - a.bd.total;
    const ea = a.ecart ?? Number.POSITIVE_INFINITY, eb = b.ecart ?? Number.POSITIVE_INFINITY;
    if (ea !== eb) return ea - eb;
    return a.entry.createdAt - b.entry.createdAt;
  });
  let rank = 0, prev = "";
  rows.forEach((r, i) => {
    const key = `${r.bd.total}|${r.ecart ?? "x"}`;
    if (key !== prev) { rank = i + 1; prev = key; }
    r.rank = rank;
  });
  return rows;
}
