/**
 * Règles de badges. Calculées à la volée à partir des données existantes —
 * aucune écriture en base, aucune migration nécessaire (les tables Badge/
 * UserBadge existent déjà dans le schéma mais ne sont pas utilisées ici pour
 * rester simple ; on pourra les activer plus tard si on veut persister les
 * dates d'obtention).
 */

export type BadgeDef = {
  code: string;
  name: string;
  description: string;
  color: string;
  progress: (stats: UserStats) => number;
};

export type UserStats = {
  completedCount: number;
  completedAnimeCount: number;
  totalEpisodesWatched: number;
  distinctGenresWatched: number;
  maxEpisodesWatchedInOneDay: number;
};

export const BADGES: BadgeDef[] = [
  {
    code: "TEN_SHOWS",
    name: "10 titres",
    description: "Termine 10 séries, films ou animes",
    color: "#F5A544",
    progress: (s) => Math.min(100, Math.round((s.completedCount / 10) * 100)),
  },
  {
    code: "FIVE_ANIMES",
    name: "5 animes",
    description: "Termine 5 animes",
    color: "#FF4E86",
    progress: (s) =>
      Math.min(100, Math.round((s.completedAnimeCount / 5) * 100)),
  },
  {
    code: "MARATHON",
    name: "Marathon",
    description: "Regarde 10 épisodes en une seule journée",
    color: "#3FBFA6",
    progress: (s) =>
      Math.min(100, Math.round((s.maxEpisodesWatchedInOneDay / 10) * 100)),
  },
  {
    code: "HUNDRED_EPISODES",
    name: "100 épisodes",
    description: "Regarde 100 épisodes au total",
    color: "#F5A544",
    progress: (s) =>
      Math.min(100, Math.round((s.totalEpisodesWatched / 100) * 100)),
  },
  {
    code: "GENRE_EXPLORER",
    name: "Explorateur",
    description: "Regarde des titres d'au moins 5 genres différents",
    color: "#FF4E86",
    progress: (s) =>
      Math.min(100, Math.round((s.distinctGenresWatched / 5) * 100)),
  },
];
