import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb";
import Link from "next/link";

type MediaSeenEntry = {
  id: string;
  title: string;
  type: string;
  posterPath: string | null;
  episodeCount: number;
};

export default async function WrappedPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  const year = searchParams.year
    ? parseInt(searchParams.year, 10)
    : new Date().getFullYear();

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const watchedThisYear = await prisma.watchedEpisode.findMany({
    where: { userId: userId, watchedAt: { gte: start, lt: end } },
    include: { episode: { include: { mediaItem: true } } },
  });

  const totalMinutes = watchedThisYear.reduce(function (sum, w) {
    return sum + (w.episode.runtime ?? 24);
  }, 0);
  const totalHours = Math.round(totalMinutes / 60);

  const mediaSeen = new Map<string, MediaSeenEntry>();
  for (const w of watchedThisYear) {
    const m = w.episode.mediaItem;
    const existing = mediaSeen.get(m.id);
    if (existing) {
      existing.episodeCount += 1;
    } else {
      mediaSeen.set(m.id, {
        id: m.id,
        title: m.title,
        type: m.type,
        posterPath: m.posterPath,
        episodeCount: 1,
      });
    }
  }

  const countsByType = { MOVIE: 0, TV: 0, ANIME: 0 };
  for (const m of mediaSeen.values()) {
    if (m.type === "MOVIE") countsByType.MOVIE += 1;
    if (m.type === "TV") countsByType.TV += 1;
    if (m.type === "ANIME") countsByType.ANIME += 1;
  }

  const allMedia = Array.from(mediaSeen.values());
  allMedia.sort(function (a, b) {
    return b.episodeCount - a.episodeCount;
  });
  const topMedia = allMedia.length > 0 ? allMedia[0] : null;

  const topRating = topMedia
    ? await prisma.rating.findUnique({
        where: {
          userId_mediaItemId: { userId: userId, mediaItemId: topMedia.id },
        },
      })
    : null;

  const genreCounts = new Map<string, number>();
  for (const w of watchedThisYear) {
    for (const genre of w.episode.mediaItem.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  let totalGenreTags = 0;
  genreCounts.forEach(function (count) {
    totalGenreTags += count;
  });

  const genreEntries = Array.from(genreCounts.entries());
  genreEntries.sort(function (a, b) {
    return b[1] - a[1];
  });
  const dominantGenre = genreEntries.length > 0 ? genreEntries[0] : null;
  const dominantGenrePercent =
    dominantGenre && totalGenreTags > 0
      ? Math.round((dominantGenre[1] / totalGenreTags) * 100)
      : 0;

  const hasData = watchedThisYear.length > 0;

  return (
    <main
      className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto"
      style={{
        background: "radial-gradient(circle at 30% 0%, #3A1F42 0%, #0E0E14 55%)",
      }}
    >
      <Link
        href="/profil"
        className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors inline-block mb-8"
      >
        {"← Profil"}
      </Link>

      <div className="text-center mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-amber">
          BINGR WRAPPED
        </p>
        <h1 className="font-display text-5xl leading-none mt-2">
          {year}
          <br />
          <span className="text-magenta">EN BINGR</span>
        </h1>
      </div>

      {!hasData ? (
        <p className="text-center text-slate text-sm">
          Pas encore d'episodes vus en {year}. Reviens ici une fois que tu
          auras commence a regarder cette annee !
        </p>
      ) : (
        <div>
          <div className="text-center mb-10">
            <p className="font-mono text-[11px] text-slate">tu as passe</p>
            <p className="font-display text-6xl text-amber leading-none">
              {totalHours}h
            </p>
            <p className="font-mono text-[11px] text-slate">
              devant un ecran cette annee
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-10">
            <div className="text-center">
              <p className="font-display text-3xl text-teal">{countsByType.TV}</p>
              <p className="font-mono text-[9px] text-slate">SERIES</p>
            </div>
            <div className="w-px bg-stroke" />
            <div className="text-center">
              <p className="font-display text-3xl text-amber">{countsByType.MOVIE}</p>
              <p className="font-mono text-[9px] text-slate">FILMS</p>
            </div>
            <div className="w-px bg-stroke" />
            <div className="text-center">
              <p className="font-display text-3xl text-magenta">{countsByType.ANIME}</p>
              <p className="font-mono text-[9px] text-slate">ANIMES</p>
            </div>
          </div>

          {topMedia && (
            <div className="mb-8">
              <p className="font-mono text-[10px] text-slate text-center mb-3">
                TON TOP DE L'ANNEE
              </p>
              <div className="flex items-center gap-3 bg-panel-2 border border-stroke rounded-xl p-4">
                <div className="w-11 h-15 rounded-md overflow-hidden shrink-0 bg-panel">
                  {topMedia.posterPath && (
                    <img
                      src={posterUrl(topMedia.posterPath, "w200") ?? ""}
                      alt={topMedia.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-bold text-[13px]">{topMedia.title}</p>
                  <p className="font-mono text-[9.5px] text-slate">
                    {topMedia.episodeCount} episodes
                    {topRating ? " - note " + topRating.score + "/10" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {dominantGenre && (
            <p className="text-center font-mono text-[10px] text-teal">
              genre dominant : {dominantGenre[0]} - {dominantGenrePercent}%
            </p>
          )}
        </div>
      )}
    </main>
  );
}
