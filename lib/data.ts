// Données statiques du concours (équipes confirmées chapeaux 1-2-3 + "Autre")
export const TEAMS: string[] = [
  "Afrique du Sud","Algérie","Allemagne","Angleterre","Arabie saoudite","Argentine","Australie",
  "Autriche","Belgique","Brésil","Canada","Colombie","Corée du Sud","Croatie","Côte d'Ivoire",
  "Écosse","Égypte","Équateur","Espagne","États-Unis","France","Iran","Japon","Maroc","Mexique",
  "Norvège","Ouzbékistan","Panama","Paraguay","Pays-Bas","Portugal","Qatar","Sénégal","Suisse",
  "Tunisie","Uruguay",
];

export const FLAGS: Record<string, string> = {
  "Afrique du Sud":"🇿🇦","Algérie":"🇩🇿","Allemagne":"🇩🇪","Angleterre":"🏴","Arabie saoudite":"🇸🇦",
  "Argentine":"🇦🇷","Australie":"🇦🇺","Autriche":"🇦🇹","Belgique":"🇧🇪","Brésil":"🇧🇷","Canada":"🇨🇦",
  "Colombie":"🇨🇴","Corée du Sud":"🇰🇷","Croatie":"🇭🇷","Côte d'Ivoire":"🇨🇮","Écosse":"🏴","Égypte":"🇪🇬",
  "Équateur":"🇪🇨","Espagne":"🇪🇸","États-Unis":"🇺🇸","France":"🇫🇷","Iran":"🇮🇷","Japon":"🇯🇵","Maroc":"🇲🇦",
  "Mexique":"🇲🇽","Norvège":"🇳🇴","Ouzbékistan":"🇺🇿","Panama":"🇵🇦","Paraguay":"🇵🇾","Pays-Bas":"🇳🇱",
  "Portugal":"🇵🇹","Qatar":"🇶🇦","Sénégal":"🇸🇳","Suisse":"🇨🇭","Tunisie":"🇹🇳","Uruguay":"🇺🇾",
};

export const STAGES: string[] = [
  "Phase de groupes","16es de finale","8es de finale","Quarts de finale",
  "Demi-finales","Finaliste","Vainqueur",
];

export const PTS = {
  champ: 20, final: 12, scorer: 10, france: 8, franceClose: 4,
  surprise: 6, scoreExact: 6, scoreResult: 3, consolation: 6,
};

// Coup d'envoi du Mondial 2026 (match d'ouverture, Mexique)
export const KICKOFF = "2026-06-11T18:00:00-06:00";

export function teamLabel(name: string): string {
  if (!name) return "—";
  const f = FLAGS[name];
  return f ? `${f} ${name}` : name;
}
