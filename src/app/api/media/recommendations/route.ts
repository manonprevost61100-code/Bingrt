import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMovieRecommendations, getTvRecommendations } from "@/lib/tmdb";

/**
 * Recommandations personnalisées basées sur les 3 titres les mieux notés
 * (score >= 7) de l'utilisateur. On interroge TMDB pour chacun, on dédoublonne,
 * et on exclut les titres déjà présents dans sa bibliothèque.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const userId = session.user.id;

  const topRated = await prisma.rating.findMany({
    where: { userId, score: { gte: 7 } },
    include: { mediaItem: true },
    orderBy: { score: "desc" },
    take: 3,
  });

  if (topRated.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const existing = await prisma.mediaItem.findMany({
    where: { watchStatuses: { some: { userId } } },
    select: { tmdbId: true },
  });
  const existingIds = new Set(existing.map((m) => m.tmdbId));

  const recsByTitle = await Promise.all(
    topRated.map((r) =>
      r.mediaItem.type === "MOVIE"
        ? getMovieRecommendations(r.mediaItem.tmdbId)
        : getTvRecommendations(r.mediaItem.tmdbId)
    )
  );

  const seen = new Set<number>();
  const results = recsByTitle
    .flat()
    .filter((r) => {
      if (existingIds.has(r.tmdbId) || seen.has(r.tmdbId)) return false;
      seen.add(r.tmdbId);
      return true;
    })
    .slice(0, 12);

  return NextResponse.json({ results });
}
