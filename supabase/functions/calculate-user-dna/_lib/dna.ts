export const ALGORITHM_VERSION = 1;

export type DNAStatus = "locked" | "early" | "developing" | "solid" | "rich";
export type MediaType = "movie" | "tv";

export interface ValidEntry {
  tmdb_id: number;
  media_type: MediaType;
  status: string;
  rating: number | null;
  updated_at: string | null;
}

export interface MediaMetadata {
  title: string | null;
  genres: number[];
  runtime: number | null;
  original_language: string | null;
  origin_countries: string[];
  directors: string[];
  top_cast: string[];
  release_date: string | null;
}

export interface WeightedMetric {
  key: string;
  label: string;
  weight: number;
  percentage: number;
}

export interface RuntimeProfile {
  averageMinutes: number | null;
  label: string | null;
  coverage: number;
}

export interface RatingProfile {
  average: number | null;
  median: number | null;
  distribution: Record<string, number>;
  label: string | null;
  coverage: number;
}

export interface CreatorMetric {
  name: string;
  count: number;
}

export interface UserDNA {
  status: DNAStatus;
  algorithmVersion: number;
  validTitleCount: number;
  ratedTitleCount: number;
  confidenceScore: number;
  summary: string | null;
  topGenres: WeightedMetric[];
  formatDistribution: { movie: number; tv: number };
  decadeDistribution: WeightedMetric[];
  countryDistribution: WeightedMetric[];
  languageDistribution: WeightedMetric[];
  runtimeProfile: RuntimeProfile;
  ratingProfile: RatingProfile;
  recurringDirectors: CreatorMetric[];
  recurringCast: CreatorMetric[];
  tags: string[];
  calculatedAt: string;
  sourceUpdatedAt: string | null;
}

const STATUS_WEIGHTS: Record<string, number> = {
  completed: 1.0,
  watching: 0.5,
};

const RATING_WEIGHTS: Record<string, number> = {
  "1": 0.7,
  "2": 0.7,
  "3": 0.9,
  "4": 1.15,
  "5": 1.5,
};

const GENRE_NAMES: Record<number, string> = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia ficción",
  10770: "Película de TV",
  53: "Thriller",
  10752: "Bélica",
  37: "Western",
  10759: "Acción y aventura",
  10762: "Kids",
  10763: "Noticias",
  10764: "Reality",
  10765: "Ciencia ficción y fantasía",
  10766: "Telenovela",
  10767: "Talk",
  10768: "Bélica",
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina",
  ES: "España",
  US: "Estados Unidos",
  GB: "Reino Unido",
  FR: "Francia",
  DE: "Alemania",
  IT: "Italia",
  JP: "Japón",
  KR: "Corea del Sur",
  CN: "China",
  MX: "México",
  BR: "Brasil",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  UY: "Uruguay",
  VE: "Venezuela",
  CA: "Canadá",
  AU: "Australia",
  NZ: "Nueva Zelanda",
  IN: "India",
  SE: "Suecia",
  NO: "Noruega",
  DK: "Dinamarca",
  NL: "Países Bajos",
  BE: "Bélgica",
  PL: "Polonia",
  RU: "Rusia",
  TR: "Turquía",
  GR: "Grecia",
  IE: "Irlanda",
  PT: "Portugal",
  AT: "Austria",
  CH: "Suiza",
  IL: "Israel",
  ZA: "Sudáfrica",
  HK: "Hong Kong",
  TW: "Taiwán",
  TH: "Tailandia",
  PH: "Filipinas",
  ID: "Indonesia",
  SG: "Singapur",
  MY: "Malasia",
  IS: "Islandia",
  CZ: "República Checa",
  HU: "Hungría",
  RO: "Rumania",
  UA: "Ucrania",
  EG: "Egipto",
  NG: "Nigeria",
  MA: "Marruecos",
};

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  fr: "Francés",
  de: "Alemán",
  it: "Italiano",
  pt: "Portugués",
  ja: "Japonés",
  ko: "Coreano",
  zh: "Chino",
  hi: "Hindi",
  ru: "Ruso",
  ar: "Árabe",
  tr: "Turco",
  sv: "Sueco",
  no: "Noruego",
  da: "Danés",
  nl: "Neerlandés",
  pl: "Polaco",
  fi: "Finlandés",
  cs: "Checo",
  el: "Griego",
  he: "Hebreo",
  th: "Tailandés",
  vi: "Vietnamita",
  id: "Indonesio",
  hu: "Húngaro",
  ro: "Rumano",
  uk: "Ucraniano",
  fa: "Persa",
  ur: "Urdu",
  bn: "Bengalí",
  ta: "Tamil",
  te: "Telugu",
  ms: "Malayo",
  ca: "Catalán",
  eu: "Euskera",
  gl: "Gallego",
  is: "Islandés",
  bg: "Búlgaro",
  hr: "Croata",
  sr: "Serbio",
  sk: "Eslovaco",
  sl: "Esloveno",
  lv: "Letón",
  lt: "Lituano",
  et: "Estonio",
  ka: "Georgiano",
  hy: "Armenio",
  az: "Azerí",
  kk: "Kazajo",
  mn: "Mongol",
  sw: "Suajili",
  af: "Afrikáans",
  ne: "Nepalí",
  si: "Cingalés",
  am: "Amárico",
  tl: "Tagalo",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function userDnaFromRow(row: Record<string, unknown> | null): UserDNA | null {
  if (!row) return null;
  return {
    status: row.status as DNAStatus,
    algorithmVersion: (row.algorithm_version as number) ?? ALGORITHM_VERSION,
    validTitleCount: (row.valid_title_count as number) ?? 0,
    ratedTitleCount: (row.rated_title_count as number) ?? 0,
    confidenceScore: (row.confidence_score as number) ?? 0,
    summary: (row.summary as string) ?? null,
    topGenres: (row.top_genres as WeightedMetric[]) ?? [],
    formatDistribution: (row.format_distribution as { movie: number; tv: number }) ?? { movie: 0, tv: 0 },
    decadeDistribution: (row.decade_distribution as WeightedMetric[]) ?? [],
    countryDistribution: (row.country_distribution as WeightedMetric[]) ?? [],
    languageDistribution: (row.language_distribution as WeightedMetric[]) ?? [],
    runtimeProfile: (row.runtime_profile as RuntimeProfile) ?? { averageMinutes: null, label: null, coverage: 0 },
    ratingProfile: (row.rating_profile as RatingProfile) ?? { average: null, median: null, distribution: {}, label: null, coverage: 0 },
    recurringDirectors: (row.recurring_directors as CreatorMetric[]) ?? [],
    recurringCast: (row.recurring_cast as CreatorMetric[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    calculatedAt: (row.calculated_at as string) ?? new Date().toISOString(),
    sourceUpdatedAt: (row.source_updated_at as string) ?? null,
  };
}

function withPercentages(items: { key: string; label: string; weight: number }[]): WeightedMetric[] {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total <= 0) return items.map((i) => ({ key: i.key, label: i.label, weight: round2(i.weight), percentage: 0 }));
  const rows = items.map((i) => {
    const exact = (i.weight / total) * 100;
    return { ...i, exact, floored: Math.floor(exact), fractional: exact - Math.floor(exact) };
  });
  const base = rows.reduce((sum, r) => sum + r.floored, 0);
  const remainder = 100 - base;
  const byFraction = [...rows].sort((a, b) => b.fractional - a.fractional);
  for (let k = 0; k < remainder; k++) byFraction[k].floored += 1;
  return rows.map((r) => ({ key: r.key, label: r.label, weight: round2(r.weight), percentage: r.floored }));
}

function titleWeight(entry: ValidEntry): number {
  const sw = STATUS_WEIGHTS[entry.status] ?? 0;
  if (sw <= 0) return 0;
  const rw = entry.rating == null ? 1 : (RATING_WEIGHTS[String(entry.rating)] ?? 1);
  return sw * rw;
}

function statusFor(count: number): DNAStatus {
  if (count < 5) return "locked";
  if (count < 10) return "early";
  if (count < 25) return "developing";
  if (count < 50) return "solid";
  return "rich";
}

function yearOf(releaseDate: string | null): number | null {
  if (!releaseDate) return null;
  const y = parseInt(releaseDate.substring(0, 4), 10);
  if (Number.isNaN(y) || y < 1900) return null;
  return y;
}

function decadeKey(year: number): string {
  return year < 1980 ? "pre80" : String(year - (year % 10));
}

function decadeLabel(key: string): string {
  return key === "pre80" ? "Antes de 1980" : key;
}

export function computeDna(entries: ValidEntry[], metadata: Map<string, MediaMetadata>): UserDNA {
  const valid = entries.filter(
    (e) => e.status === "completed" || (e.status === "watching" && e.media_type === "tv")
  );
  const count = valid.length;
  const status = statusFor(count);
  const now = new Date().toISOString();

  const sourceUpdatedAt = valid.reduce<string | null>((max, e) => {
    if (!e.updated_at) return max;
    return max && max > e.updated_at ? max : e.updated_at;
  }, null);

  const empty = (): UserDNA => ({
    status,
    algorithmVersion: ALGORITHM_VERSION,
    validTitleCount: count,
    ratedTitleCount: 0,
    confidenceScore: 0,
    summary: null,
    topGenres: [],
    formatDistribution: { movie: 0, tv: 0 },
    decadeDistribution: [],
    countryDistribution: [],
    languageDistribution: [],
    runtimeProfile: { averageMinutes: null, label: null, coverage: 0 },
    ratingProfile: { average: null, median: null, distribution: {}, label: null, coverage: 0 },
    recurringDirectors: [],
    recurringCast: [],
    tags: [],
    calculatedAt: now,
    sourceUpdatedAt,
  });

  if (count === 0) return empty();

  const weighted = valid.map((entry) => ({
    entry,
    weight: titleWeight(entry),
    meta: metadata.get(`${entry.media_type}:${entry.tmdb_id}`) ?? null,
  }));

  const genreWeights = new Map<string, number>();
  for (const { weight, meta } of weighted) {
    const genres = meta?.genres ?? [];
    if (genres.length === 0) continue;
    const share = weight / genres.length;
    for (const id of genres) genreWeights.set(String(id), (genreWeights.get(String(id)) ?? 0) + share);
  }
  const genreTotal = [...genreWeights.values()].reduce((sum, w) => sum + w, 0);
  const genreItems = [...genreWeights.entries()]
    .map(([key, w]) => ({ key, label: GENRE_NAMES[Number(key)] ?? `Género ${key}`, weight: w }))
    .sort((a, b) => b.weight - a.weight);
  const allGenres = withPercentages(genreItems);
  const topGenres = allGenres.slice(0, 5);

  let movieWeight = 0;
  let tvWeight = 0;
  for (const { entry, weight } of weighted) {
    if (entry.media_type === "movie") movieWeight += weight;
    else tvWeight += weight;
  }
  const formatTotal = movieWeight + tvWeight;
  const formatDistribution = {
    movie: formatTotal > 0 ? Math.round((movieWeight / formatTotal) * 100) : 0,
    tv: formatTotal > 0 ? Math.round((tvWeight / formatTotal) * 100) : 0,
  };

  const decadeWeights = new Map<string, number>();
  for (const { weight, meta } of weighted) {
    const y = yearOf(meta?.release_date ?? null);
    if (y == null) continue;
    const key = decadeKey(y);
    decadeWeights.set(key, (decadeWeights.get(key) ?? 0) + weight);
  }
  const decadeItems = [...decadeWeights.entries()]
    .map(([key, w]) => ({ key, label: decadeLabel(key), weight: w }))
    .sort((a, b) => b.weight - a.weight);
  const decadeDistribution = withPercentages(decadeItems).slice(0, 3);

  const countryWeights = new Map<string, number>();
  for (const { weight, meta } of weighted) {
    const countries = meta?.origin_countries ?? [];
    if (countries.length === 0) continue;
    const share = weight / countries.length;
    for (const code of countries) countryWeights.set(code, (countryWeights.get(code) ?? 0) + share);
  }
  const countryTotal = [...countryWeights.values()].reduce((sum, w) => sum + w, 0);
  const countryItems = [...countryWeights.entries()]
    .map(([code, w]) => ({ key: code, label: COUNTRY_NAMES[code] ?? code, weight: w }))
    .sort((a, b) => b.weight - a.weight);
  const countryDistribution = withPercentages(countryItems).slice(0, 5);

  const languageWeights = new Map<string, number>();
  for (const { weight, meta } of weighted) {
    const lang = meta?.original_language;
    if (!lang) continue;
    languageWeights.set(lang, (languageWeights.get(lang) ?? 0) + weight);
  }
  const languageItems = [...languageWeights.entries()]
    .map(([code, w]) => ({ key: code, label: LANGUAGE_NAMES[code] ?? code.toUpperCase(), weight: w }))
    .sort((a, b) => b.weight - a.weight);
  const languageDistribution = withPercentages(languageItems).slice(0, 3);

  const movies = weighted.filter(({ entry }) => entry.media_type === "movie");
  const runtimes = movies
    .filter(({ meta }) => !!meta?.runtime && meta.runtime > 0)
    .map(({ meta }) => (meta?.runtime as number));
  const runtimeProfile: RuntimeProfile = {
    averageMinutes: null,
    label: null,
    coverage: movies.length > 0 ? runtimes.length / movies.length : 0,
  };
  if (runtimes.length > 0) {
    const avg = runtimes.reduce((sum, r) => sum + r, 0) / runtimes.length;
    const label = avg <= 95 ? "Historias compactas" : avg <= 130 ? "Duración intermedia" : "Historias extensas";
    runtimeProfile.averageMinutes = Math.round(avg);
    runtimeProfile.label = label;
    runtimeProfile.coverage = runtimes.length / movies.length;
  }

  const rated = weighted.filter(({ entry }) => entry.rating != null);
  const ratingValues = rated.map(({ entry }) => entry.rating as number);
  const ratedCount = ratingValues.length;
  const ratingProfile: RatingProfile = {
    average: null,
    median: null,
    distribution: {},
    label: null,
    coverage: count > 0 ? ratedCount / count : 0,
  };
  if (ratingValues.length > 0) {
    const sorted = [...ratingValues].sort((a, b) => a - b);
    const avg = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const distribution: Record<string, number> = {};
    for (const v of ratingValues) distribution[String(v)] = (distribution[String(v)] ?? 0) + 1;
    let label: string | null = null;
    if (ratedCount >= 10) {
      if (avg >= 4.2) label = "Entusiasta";
      else if (avg >= 3.6) label = "Generoso";
      else if (avg >= 2.8) label = "Selectivo";
      else label = "Exigente";
    }
    ratingProfile.average = round2(avg);
    ratingProfile.median = round2(median);
    ratingProfile.distribution = distribution;
    ratingProfile.label = label;
  }

  const directorCounts = new Map<string, number>();
  const castCounts = new Map<string, number>();
  for (const { meta } of weighted) {
    for (const d of meta?.directors ?? []) directorCounts.set(d, (directorCounts.get(d) ?? 0) + 1);
    for (const c of meta?.top_cast ?? []) castCounts.set(c, (castCounts.get(c) ?? 0) + 1);
  }
  const recurringDirectors = [...directorCounts.entries()]
    .filter(([, c]) => c >= 3)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const recurringCast = [...castCounts.entries()]
    .filter(([, c]) => c >= 3)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const genresWithPct = allGenres.filter((g) => g.percentage >= 5).length;
  const pre2000Count = weighted.filter(({ meta }) => {
    const y = yearOf(meta?.release_date ?? null);
    return y != null && y < 2000;
  }).length;
  const pre2000Pct = count > 0 ? pre2000Count / count : 0;
  const currentYear = new Date().getFullYear();
  const recentCount = weighted.filter(({ meta }) => {
    const y = yearOf(meta?.release_date ?? null);
    return y != null && y >= currentYear - 3;
  }).length;
  const recentPct = count > 0 ? recentCount / count : 0;
  const tvCount = weighted.filter(({ entry }) => entry.media_type === "tv").length;
  const tvPct = count > 0 ? tvCount / count : 0;
  const moviePct = count > 0 ? 1 - tvPct : 0;
  const countriesWithPct = countryItems.filter((c) => countryTotal > 0 && (c.weight / countryTotal) * 100 >= 5).length;
  const titlesWithCountry = weighted.filter(({ meta }) => (meta?.origin_countries ?? []).length > 0).length;
  const intenseSum = [53, 27, 80, 28].reduce((sum, id) => sum + (genreWeights.get(String(id)) ?? 0), 0);
  const intensePct = genreTotal > 0 ? intenseSum / genreTotal : 0;
  const avgRating = ratingProfile.average;

  const tagDefs = [
    { label: "Explorador de géneros", category: "consumo", ok: genresWithPct >= 8 },
    { label: "Amante de los clásicos", category: "epoca", ok: pre2000Pct >= 0.3 && count >= 10 },
    { label: "En modo estreno", category: "epoca", ok: recentPct >= 0.5 && count >= 10 },
    { label: "Maratonista de series", category: "formato", ok: tvPct >= 0.6 && count >= 10 },
    { label: "Más cine que series", category: "formato", ok: moviePct >= 0.7 && count >= 10 },
    { label: "Historias sin fronteras", category: "geo", ok: countriesWithPct >= 6 && titlesWithCountry >= 15 },
    { label: "Fan de los relatos extensos", category: "formato", ok: (runtimeProfile.averageMinutes ?? 0) > 130 && runtimes.length >= 8 },
    { label: "Busca emociones fuertes", category: "emocion", ok: intensePct >= 0.45 && count >= 10 },
    { label: "Curador exigente", category: "puntuacion", ok: (avgRating ?? 5) < 2.8 && ratedCount >= 10 },
    { label: "Entusiasta audiovisual", category: "puntuacion", ok: (avgRating ?? 0) >= 4.2 && ratedCount >= 10 },
  ];
  const tags: string[] = [];
  const categoryOrder = ["consumo", "epoca", "geo", "formato", "emocion", "puntuacion"];
  for (const cat of categoryOrder) {
    if (tags.length >= 4) break;
    const def = tagDefs.find((d) => d.category === cat && d.ok && !tags.includes(d.label));
    if (def) tags.push(def.label);
  }

  const titlesWithMeta = weighted.filter(({ meta }) => meta != null).length;
  const metadataCoverage = count > 0 ? titlesWithMeta / count : 0;
  const quantityScore = Math.min(count / 50, 1) * 50;
  const metadataScore = metadataCoverage * 30;
  const ratingScore = count > 0 ? (ratedCount / count) * 20 : 0;
  const confidenceScore = Math.round(quantityScore + metadataScore + ratingScore);

  let summary: string | null = null;
  if (count >= 5) {
    const g1 = topGenres[0]?.label ?? "";
    const g2 = topGenres[1]?.label ?? "";
    const g3 = topGenres[2]?.label ?? "";
    const openings = [
      `Tu biblioteca combina ${g1}${g2 ? `, ${g2}` : ""}${g3 ? ` y ${g3}` : ""}.`,
      `Tus elecciones se mueven entre ${g1}${g2 ? `, ${g2}` : ""}${g3 ? ` y ${g3}` : ""}.`,
      `En tu pantalla predominan ${g1}${g2 ? `, ${g2}` : ""}${g3 ? ` y ${g3}` : ""}.`,
    ];
    let opening: string;
    if (topGenres.length >= 1) {
      const seed = `${g1}${g2}${g3}`.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
      opening = openings[seed % openings.length];
    } else {
      opening = "Tu biblioteca reúne historias que elegís con criterio propio.";
    }
    let format: string;
    if (formatDistribution.movie >= 65) format = "Te inclinás especialmente por las películas.";
    else if (formatDistribution.tv >= 65) format = "Las series ocupan el centro de tu biblioteca.";
    else format = "Mantenés un equilibrio entre películas y series.";
    let era: string | null = null;
    if (decadeDistribution.length > 0) {
      const currentDecade = String(currentYear - (currentYear % 10));
      if (pre2000Pct >= 0.3 && count >= 10) era = "Los clásicos tienen un lugar importante en tu perfil.";
      else if (decadeDistribution[0].key === currentDecade) era = "Tu selección mira especialmente hacia los estrenos recientes.";
      else era = `Las producciones de los ${decadeDistribution[0].label} son las que más se repiten.`;
    }
    summary = (era ? `${opening} ${format} ${era}` : `${opening} ${format}`).slice(0, 240);
  }

  return {
    status,
    algorithmVersion: ALGORITHM_VERSION,
    validTitleCount: count,
    ratedTitleCount: ratedCount,
    confidenceScore,
    summary,
    topGenres,
    formatDistribution,
    decadeDistribution,
    countryDistribution,
    languageDistribution,
    runtimeProfile,
    ratingProfile,
    recurringDirectors,
    recurringCast,
    tags,
    calculatedAt: now,
    sourceUpdatedAt,
  };
}
