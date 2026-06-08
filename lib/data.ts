// Les 48 équipes de la Coupe du Monde 2026 (tirage de décembre 2025)
export const FLAGS: Record<string, string> = {
  "Mexique":"🇲🇽","Afrique du Sud":"🇿🇦","Corée du Sud":"🇰🇷","Tchéquie":"🇨🇿",
  "Canada":"🇨🇦","Bosnie-Herzégovine":"🇧🇦","Qatar":"🇶🇦","Suisse":"🇨🇭",
  "Brésil":"🇧🇷","Maroc":"🇲🇦","Haïti":"🇭🇹","Écosse":"🏴",
  "États-Unis":"🇺🇸","Paraguay":"🇵🇾","Australie":"🇦🇺","Turquie":"🇹🇷",
  "Allemagne":"🇩🇪","Curaçao":"🇨🇼","Côte d'Ivoire":"🇨🇮","Équateur":"🇪🇨",
  "Pays-Bas":"🇳🇱","Japon":"🇯🇵","Suède":"🇸🇪","Tunisie":"🇹🇳",
  "Belgique":"🇧🇪","Égypte":"🇪🇬","Iran":"🇮🇷","Nouvelle-Zélande":"🇳🇿",
  "Espagne":"🇪🇸","Cap-Vert":"🇨🇻","Arabie saoudite":"🇸🇦","Uruguay":"🇺🇾",
  "France":"🇫🇷","Sénégal":"🇸🇳","Irak":"🇮🇶","Norvège":"🇳🇴",
  "Argentine":"🇦🇷","Algérie":"🇩🇿","Autriche":"🇦🇹","Jordanie":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Ouzbékistan":"🇺🇿","Colombie":"🇨🇴",
  "Angleterre":"🏴","Croatie":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
};

export const TEAMS: string[] = Object.keys(FLAGS).sort((a, b) => a.localeCompare(b, "fr"));

export const PTS = {
  groupExact: 3,      // score exact d'un match de groupe
  groupResult: 1,     // bon résultat (1/N/2)
  bracketQuart: 1,    // par équipe correctement placée en quarts (top 8)
  bracketDemi: 3,     // par demi-finaliste correct (top 4)
  bracketFinal: 5,    // par finaliste correct (top 2)
  bracketChamp: 10,   // champion correct
  scorer: 10,         // meilleur buteur
  surprise: 6,        // révélation
};

// Coup d'envoi du Mondial 2026 (match d'ouverture Mexique - Afrique du Sud)
export const KICKOFF = "2026-06-11T18:00:00-06:00";

export function teamLabel(name: string): string {
  if (!name) return "—";
  const f = FLAGS[name];
  return f ? `${f} ${name}` : name;
}
