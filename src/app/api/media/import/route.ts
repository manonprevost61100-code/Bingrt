import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMovieDetails,
  getTvDetails,
  getSeasonEpisodes,
} from "@/lib/tmdb";

/**
 * Importe un média TMDB vers la base locale s'il n'y existe pas déjà.
 * Pour les séries/animes, importe aussi tous les épisodes (hors saison 0 = spéciaux).
 * Retourne l'id local du MediaItem dans tous les cas (idempotent).
 */
export async function POST(req: NextRequest) {
  const { tmdbId, mediaType } = await req.json(); // mediaType: "movie" | "tv"

  if (!tmdbId || !mediaType) {
    return NextResponse.json(
      { error: "tmdbId et mediaType sont requis" },
      { status: 400 }
    );
  }

  try {
    if (mediaType === "movie") {
      const details = await getMovieDetails(tmdbId);
      const existing = await prisma.mediaItem.findUnique({
        where: { tmdbId_type: { tmdbId, type: details.kind } },
      });
      if (existing) return NextResponse.json({ id: existing.id });

      const created = await prisma.mediaItem.create({
        data: {
          tmdbId: details.tmdbId,
          type: details.kind,
          title: details.title,
          originalTitle: details.originalTitle,
          posterPath: details.posterPath,
          backdropPath: details.backdropPath,
          synopsis: details.synopsis,
          genres: details.genres,
          releaseDate: details.releaseDate ? new Date(details.releaseDate) : null,
          runtime: details.runtime,
        },
      });
      return NextResponse.json({ id: created.id });
    }

    // mediaType === "tv"
    const details = await getTvDetails(tmdbId);
    const existing = await prisma.mediaItem.findUnique({
      where: { tmdbId_type: { tmdbId, type: details.kind } },
    });
    if (existing) return NextResponse.json({ id: existing.id });

    const created = await prisma.mediaItem.create({
      data: {
        tmdbId: details.tmdbId,
        type: details.kind,
        title: details.title,
        originalTitle: details.originalTitle,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        synopsis: details.synopsis,
        genres: details.genres,
        releaseDate: details.releaseDate ? new Date(details.releaseDate) : null,
        totalSeasons: details.totalSeasons,
        totalEpisodes: details.totalEpisodes,
      },
    });

    // Importe les épisodes de chaque saison réelle (on saute la saison 0 = spéciaux)
    const realSeasons = details.seasons.filter((s) => s.seasonNumber > 0);
    for (const season of realSeasons) {
      const episodes = await getSeasonEpisodes(tmdbId, season.seasonNumber);
      if (episodes.length === 0) continue;

      await prisma.episode.createMany({
        data: episodes.map((ep) => ({
          mediaItemId: created.id,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          airDate: ep.airDate ? new Date(ep.airDate) : null,
          runtime: ep.runtime,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ id: created.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erreur lors de l'import TMDB" },
      { status: 502 }
    );
  }
}
