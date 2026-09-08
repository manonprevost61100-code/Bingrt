import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { posterUrl } from "@/lib/tmdb";
import Link from "next/link";

const KIND_LABEL: Record<string, string> = {
  MOVIE: "FILM",
  TV: "SÉRIE",
  ANIME: "ANIME",
};

const KIND_COLOR: Record<string, string> = {
  MOVIE: "#F5A544",
  TV: "#3FBFA6",
  ANIME: "#FF4E86",
};

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  // ----- En cours : séries/animes marqués WATCHING, avec progression réelle -----
  const watching = await prisma.watchStatus.findMany({
    where: { userId, state: "WATCHING" },
    include: { mediaItem: { include: { episodes: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const watchedEpisodeIds = new Set(
    (
      await prisma.watchedEpisode.findMany({
        where: { userId },
        select: { episodeId: true },
      })
    ).map((w) => w.episodeId)
  );

  const inProgress = watching.map((w) => {
    const total = w.mediaItem.episodes.length;
    const watched = w.mediaItem.episodes.filter((e) =>
      watchedEpisodeIds.has(e.id)
    ).length;
    const percent = total > 0 ? Math.round((watched / total) * 100) : 0;
    const nextUnwatched = [...w.mediaItem.episodes]
      .sort((a, b) =>
        a.seasonNumber !== b.seasonNumber
          ? a.seasonNumber - b.seasonNumber
          : a.episodeNumber - b.episodeNumber
      )
      .find((e) => !watchedEpisodeIds.has(e.id));

    return {
      mediaItem: w.mediaItem,
      percent,
      currentLabel: nextUnwatched
        ? `S${nextUnwatched.seasonNumber} · E${String(nextUnwatched.episodeNumber).padStart(2, "0")}`
        : "Terminé",
    };
  });

  // ----- À venir cette semaine : épisodes des médias suivis, diffusés sous 7 jours -----
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = await prisma.episode.findMany({
    where: {
      airDate: { gte: now, lte: in7Days },
      mediaItem: { watchStatuses: { some: { userId } } },
    },
    include: { mediaItem: true },
    orderBy: { airDate: "asc" },
    take: 6,
  });

  // ----- Activité récente (perso pour l'instant — le flux d'amis arrive avec le lot Social) -----
  const recentActivity = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <main className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[11px] text-slate">
            Salut {session.user.name?.split(" ")[0] ?? "toi"}
          </p>
          <h1 className="font-display text-3xl uppercase">Ton Bingr</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/social"
            className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors"
          >
            👥
          </Link>
          <Link
            href="/profil"
            className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors"
          >
            👤
          </Link>
          <Link
            href="/calendrier"
            className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors"
          >
            📅
          </Link>
          <Link
            href="/recherche"
            className="font-mono text-xs bg-amber text-void font-bold px-4 py-2 rounded-full"
          >
            + Ajouter
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <button className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors">
              ⏻
            </button>
          </form>
        </div>
      </div>

      {/* ----- En cours ----- */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[11px] text-amber uppercase tracking-wide">
            En cours
          </p>
          <p className="font-mono text-[11px] text-slate">
            {inProgress.length} {inProgress.length > 1 ? "titres" : "titre"}
          </p>
        </div>

        {inProgress.length === 0 ? (
          <p className="text-slate text-sm">
            Rien en cours pour l'instant —{" "}
            <Link href="/recherche" className="text-amber underline">
              cherche quelque chose à regarder
            </Link>
            .
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {inProgress.map(({ mediaItem, percent, currentLabel }) => (
              <Link
                key={mediaItem.id}
                href={`/media/${mediaItem.id}`}
                className="w-32 shrink-0"
              >
                <div className="rounded-lg overflow-hidden bg-panel-2 aspect-[2/3] mb-2 relative">
                  {mediaItem.posterPath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={posterUrl(mediaItem.posterPath, "w342") ?? ""}
                      alt={mediaItem.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span
                    className="absolute top-2 left-2 font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/60"
                    style={{ color: KIND_COLOR[mediaItem.type] }}
                  >
                    {KIND_LABEL[mediaItem.type]}
                  </span>
                </div>
                <p className="font-bold text-[12.5px] leading-tight mb-1">
                  {mediaItem.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate">
                    {currentLabel}
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold"
                    style={{ color: KIND_COLOR[mediaItem.type] }}
                  >
                    {percent}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ----- À venir cette semaine ----- */}
      <section className="mb-10">
        <p className="font-mono text-[11px] text-teal uppercase tracking-wide mb-3">
          À venir cette semaine
        </p>

        {upcoming.length === 0 ? (
          <p className="text-slate text-sm">
            Aucune sortie prévue cette semaine parmi tes titres suivis.
          </p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ep) => (
              <Link
                key={ep.id}
                href={`/media/${ep.mediaItemId}`}
                className="flex items-center justify-between bg-panel-2 border border-stroke rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-bold text-[12.5px]">{ep.mediaItem.title}</p>
                  <p className="font-mono text-[10px] text-slate">
                    S{ep.seasonNumber}E{String(ep.episodeNumber).padStart(2, "0")}
                    {ep.title ? ` — ${ep.title}` : ""}
                  </p>
                </div>
                <p className="font-mono text-[11px] text-slate">
                  {ep.airDate?.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ----- Activité récente ----- */}
      <section>
        <p className="font-mono text-[11px] text-magenta uppercase tracking-wide mb-3">
          Ton activité récente
        </p>

        {recentActivity.length === 0 ? (
          <p className="text-slate text-sm">
            Ton activité apparaîtra ici au fil de tes visionnages.
          </p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((a) => (
              <p key={a.id} className="text-[12.5px] text-slate py-1.5">
                {a.type === "watched_episode" && "Épisode marqué comme vu"}
                {a.type === "completed_show" && "Titre marqué comme terminé"}
                {a.type === "status_updated" && "Statut de visionnage mis à jour"}
                <span className="font-mono text-[10px] text-stroke ml-2">
                  {a.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </p>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
