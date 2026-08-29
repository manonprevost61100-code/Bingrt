/**
 * Client TMDB (The Movie Database).
 * Nécessite la variable d'env TMDB_API_KEY (clé API v3 gratuite : https://www.themoviedb.org/settings/api)
 *
 * TMDB ne distingue pas nativement "anime" comme catégorie séparée : on le déduit
 * des séries/films dont le genre inclut "Animation" (16) et dont le pays/langue
 * d'origine est le japonais ("ja"). C'est l'heuristique standard utilisée par la
 * plupart des trackers (utilisée aussi par MyAnimeList <-> TMDB bridges).
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const ANIMATION_GENRE_ID = 16;

function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", "fr-FR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  return fetch(url.toString(), { next: { revalidate: 3600 } }).then((res) => {
    if (!res.ok) throw new Error(`TMDB error ${res.status}: ${path}`);
    return res.json();
  });
}

export type MediaKind = "MOVIE" | "TV" | "ANIME";

function inferKind(item: any, mediaType: "movie" | "tv"): MediaKind {
  const isAnimation = item.genre_ids?.includes(ANIMATION_GENRE_ID);
  const isJapanese =
    item.original_language === "ja" || item.origin_country?.includes("JP");
  if (isAnimation && isJapanese) return "ANIME";
  return mediaType === "movie" ? "MOVIE" : "TV";
}

export function posterUrl(path: string | null, size: "w200" | "w342" | "w500" = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

/** Recherche multi-type (films + séries), avec kind (MOVIE/TV/ANIME) déduit. */
export async function searchMedia(query: string) {
  const data = await tmdbFetch("/search/multi", { query, include_adult: "false" });
  return (data.results as any[])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => ({
      tmdbId: r.id,
      kind: inferKind(r, r.media_type),
      title: r.title ?? r.name,
      posterPath: r.poster_path,
      releaseDate: r.release_date || r.first_air_date || null,
      overview: r.overview,
    }));
}

/** Détails complets d'un film TMDB. */
export async function getMovieDetails(tmdbId: number) {
  const d = await tmdbFetch(`/movie/${tmdbId}`);
  return {
    tmdbId: d.id,
    kind: inferKind({ ...d, genre_ids: d.genres?.map((g: any) => g.id) }, "movie"),
    title: d.title,
    originalTitle: d.original_title,
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    synopsis: d.overview,
    genres: d.genres?.map((g: any) => g.name) ?? [],
    releaseDate: d.release_date || null,
    runtime: d.runtime,
  };
}

/** Détails complets d'une série TMDB, avec liste des saisons. */
export async function getTvDetails(tmdbId: number) {
  const d = await tmdbFetch(`/tv/${tmdbId}`);
  return {
    tmdbId: d.id,
    kind: inferKind({ ...d, genre_ids: d.genres?.map((g: any) => g.id) }, "tv"),
    title: d.name,
    originalTitle: d.original_name,
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    synopsis: d.overview,
    genres: d.genres?.map((g: any) => g.name) ?? [],
    releaseDate: d.first_air_date || null,
    totalSeasons: d.number_of_seasons,
    totalEpisodes: d.number_of_episodes,
    seasons: (d.seasons ?? []).map((s: any) => ({
      seasonNumber: s.season_number,
      episodeCount: s.episode_count,
      name: s.name,
    })),
  };
}

/** Épisodes détaillés d'une saison précise (pour peupler la table Episode). */
export async function getSeasonEpisodes(tmdbId: number, seasonNumber: number) {
  const d = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`);
  return (d.episodes as any[]).map((ep) => ({
    seasonNumber,
    episodeNumber: ep.episode_number,
    title: ep.name,
    airDate: ep.air_date || null,
    runtime: ep.runtime ?? null,
  }));
}

/** Séries dont un nouvel épisode sort dans les prochains jours (pour le calendrier). */
export async function getUpcomingEpisodesForShow(tmdbId: number) {
  const d = await tmdbFetch(`/tv/${tmdbId}`);
  return d.next_episode_to_air
    ? {
        seasonNumber: d.next_episode_to_air.season_number,
        episodeNumber: d.next_episode_to_air.episode_number,
        airDate: d.next_episode_to_air.air_date,
        title: d.next_episode_to_air.name,
      }
    : null;
}
