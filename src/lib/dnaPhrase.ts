import type { UserDNA, WeightedMetric } from "@/types";

const VENUE_PHRASE: Record<string, string> = {
  home: "en casa",
  cinema: "en el cine",
  friend_home: "en casa de un amigo",
  travel: "de viaje",
  other: "en otros lugares",
};

const TIME_PHRASE: Record<string, string> = {
  morning: "por la mañana",
  afternoon: "a la tarde",
  night: "a la noche",
  late_night: "de madrugada",
};

const COMPANIONSHIP_PHRASE: Record<string, string> = {
  alone: "solo/a",
  partner: "en pareja",
  friends: "con amigos",
  family: "en familia",
  children: "con niños",
  other: "con otras personas",
};

const LANGUAGE_PHRASE: Record<string, string> = {
  original_subtitled: "en idioma original con subtítulos",
  original_no_subtitles: "en idioma original sin subtítulos",
  dubbed: "dobladas",
};

export interface WatchingHabitsPhrase {
  text: string;
  sampleSessions: number;
  disclaimer: string;
}

function topKey(items: WeightedMetric[]): string | null {
  return items.length > 0 ? items[0].key : null;
}

export function buildWatchingHabitsPhrase(dna: UserDNA): WatchingHabitsPhrase | null {
  const venue = topKey(dna.venueDistribution);
  const time = topKey(dna.timeDistribution);
  const companionship = topKey(dna.companionshipDistribution);
  const language = topKey(dna.languageModeDistribution);

  const parts: string[] = [];
  if (venue && VENUE_PHRASE[venue]) parts.push(VENUE_PHRASE[venue]);
  if (time && TIME_PHRASE[time]) parts.push(`especialmente ${TIME_PHRASE[time]}`);
  if (companionship && COMPANIONSHIP_PHRASE[companionship]) parts.push(COMPANIONSHIP_PHRASE[companionship]);

  let sentence1 = "";
  if (parts.length === 1) {
    sentence1 = `Preferís ver historias ${parts[0]}.`;
  } else if (parts.length === 2) {
    sentence1 = `Preferís ver historias ${parts[0]} y ${parts[1]}.`;
  } else if (parts.length === 3) {
    sentence1 = `Preferís ver historias ${parts[0]}, ${parts[1]} y ${parts[2]}.`;
  }

  let sentence2 = "";
  if (language && LANGUAGE_PHRASE[language]) {
    sentence2 = ` La mayoría las consumís ${LANGUAGE_PHRASE[language]}.`;
  }

  const text = (sentence1 + sentence2).trim();
  if (!text) return null;

  const covered = (key: string | null, sessions: number | undefined): number =>
    key != null && sessions && sessions > 0 ? sessions : 0;

  const sampleSessions = Math.max(
    covered(venue, dna.contextCoverage.venue?.sessions),
    covered(time, dna.contextCoverage.time?.sessions),
    covered(companionship, dna.contextCoverage.companionship?.sessions),
    covered(language, dna.contextCoverage.language?.sessions),
  );

  if (sampleSessions <= 0) return null;

  const disclaimer =
    sampleSessions < 10
      ? `Tendencia inicial basada en ${sampleSessions} sesiones.`
      : `Basado en ${sampleSessions} sesiones registradas.`;

  return { text, sampleSessions, disclaimer };
}
