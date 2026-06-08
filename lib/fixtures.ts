// Composition officielle des 12 groupes — Coupe du Monde 2026
export const GROUPS: Record<string, string[]> = {
  A: ["Mexique", "Afrique du Sud", "Corée du Sud", "Tchéquie"],
  B: ["Canada", "Bosnie-Herzégovine", "Qatar", "Suisse"],
  C: ["Brésil", "Maroc", "Haïti", "Écosse"],
  D: ["États-Unis", "Paraguay", "Australie", "Turquie"],
  E: ["Allemagne", "Curaçao", "Côte d'Ivoire", "Équateur"],
  F: ["Pays-Bas", "Japon", "Suède", "Tunisie"],
  G: ["Belgique", "Égypte", "Iran", "Nouvelle-Zélande"],
  H: ["Espagne", "Cap-Vert", "Arabie saoudite", "Uruguay"],
  I: ["France", "Sénégal", "Irak", "Norvège"],
  J: ["Argentine", "Algérie", "Autriche", "Jordanie"],
  K: ["Portugal", "RD Congo", "Ouzbékistan", "Colombie"],
  L: ["Angleterre", "Croatie", "Ghana", "Panama"],
};

export type GroupMatch = { id: string; group: string; md: number; home: string; away: string };

// Schéma round-robin standard pour 4 équipes [t0,t1,t2,t3]
// J1: t0-t1, t2-t3 | J2: t0-t2, t3-t1 | J3: t3-t0, t1-t2
const PATTERN: [number, number, number][] = [
  [1, 0, 1], [1, 2, 3],
  [2, 0, 2], [2, 3, 1],
  [3, 3, 0], [3, 1, 2],
];

export const GROUP_MATCHES: GroupMatch[] = (() => {
  const out: GroupMatch[] = [];
  for (const [g, teams] of Object.entries(GROUPS)) {
    PATTERN.forEach(([md, hi, ai], idx) => {
      out.push({ id: `${g}${idx + 1}`, group: g, md, home: teams[hi], away: teams[ai] });
    });
  }
  return out;
})();

// Tours à élimination directe (du Round of 32 à la finale)
export const KO_ROUNDS = [
  { key: "r32", label: "16es de finale", matches: 16 },
  { key: "r16", label: "8es de finale", matches: 8 },
  { key: "r8", label: "Quarts de finale", matches: 4 },
  { key: "r4", label: "Demi-finales", matches: 2 },
  { key: "final", label: "Finale", matches: 1 },
] as const;
