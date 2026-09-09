import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posterUrl, backdropUrl } from "@/lib/tmdb";
import WatchStatusButtons from "@/components/WatchStatusButtons";
import EpisodeCheckbox from "@/components/EpisodeCheckbox";
import Link from "next/link";

const KIND_LABEL: Record<string, string> = {
  MOVIE: "FILM",
  TV: "SÉRIE",
  ANIME: "ANIME",
};

export default async function MediaPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const media = await prisma.mediaItem.findUnique({
    where: { id: params.id },
    include: {
      episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }] },
      watchStatuses: { where: { userId: session.user.id } },
    },
  });

  if (!media) notFound();

  const watchedEpisodeIds = new Set(
    (
      await prisma.watchedEpisode.findMany({
        where: {
          userId: session.user.id,
          episodeId: { in: media.episodes.map((e) => e.id) },
        },
        select: { episodeId: true },
      })
    ).map((w) => w.episodeId)
  );

  const seasons = Array.from(
    new Set(media.episodes.map((e) => e.seasonNumber))
  ).sort((a, b) => a - b);

  const watchedCount = media.episodes.filter((e) =>
    watchedEpisodeIds.has(e.id)
  ).length;

  return (
    <main className="min-h-screen pb-16">
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors inline-block"
        >
          ← Accueil
        </Link>
      </div>

      {media.backdropPath && (
        <div
          className="h-56 bg-cover bg-center relative"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(14,14,20,0) 0%, var(--void, #0E0E14) 92%), url(${backdropUrl(
              media.backdropPath
            )})`,
          }}
        />
      )}

      <div className="px-6 -mt-16 flex gap-4 items-end relative">
        <div className="w-24 h-36 rounded-lg overflow-hidden bg-panel-2 shrink-0 border-4 border-void">
          {media.posterPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl(media.posterPath, "w342") ?? ""}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="pb-1">
         <p className="font-mono text-[11px] text-magenta tracking-wide">
            {KIND_LABEL[media.type]}
            {media.releaseDate ? ` · ${media.releaseDate.getFullYear()}` : ""}
          </p>
          <h1 className="font-display text-xl leading-tight">{media.title}</h1>
        </div>
      </div>

      <div className="px-6 mt-4 flex gap-2 flex-wrap">
        {media.genres.map((g) => (
          <span
            key={g}
            className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-stroke text-slate"
          >
            {g}
          </span>
        ))}
      </div>

      {media.synopsis && (
        <p className="px-6 mt-4 text-slate text-[13px] leading-relaxed">
          {media.synopsis}
        </p>
      )}

      <div className="px-6 mt-5">
        <WatchStatusButtons
          mediaId={media.id}
          initialState={media.watchStatuses[0]?.state ?? null}
        />
      </div>

      {media.episodes.length > 0 && (
        <div className="px-6 mt-8">
          {seasons.map((seasonNumber) => {
            const seasonEpisodes = media.episodes.filter(
              (e) => e.seasonNumber === seasonNumber
            );
            const seasonWatched = seasonEpisodes.filter((e) =>
              watchedEpisodeIds.has(e.id)
            ).length;

            return (
              <div key={seasonNumber} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[11px] text-teal uppercase tracking-wide">
                    Saison {seasonNumber}
                  </p>
                  <p className="font-mono text-[11px] text-slate">
                    {seasonWatched} / {seasonEpisodes.length} vus
                  </p>
                </div>
                <div className="space-y-2">
                  {seasonEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between bg-panel-2 border border-stroke rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-[12.5px]">
                          Épisode {ep.episodeNumber}
                          {ep.title ? ` — ${ep.title}` : ""}
                        </p>
                        {ep.runtime && (
                          <p className="font-mono text-[9.5px] text-slate">
                            {ep.runtime} min
                          </p>
                        )}
                      </div>
                      <EpisodeCheckbox
                        episodeId={ep.id}
                        initialWatched={watchedEpisodeIds.has(ep.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
