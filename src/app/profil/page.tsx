import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BADGES } from "@/lib/badges";
import BadgeRing from "@/components/BadgeRing";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  const watchedEpisodes = await prisma.watchedEpisode.findMany({
    where: { userId },
    include: { episode: { include: { mediaItem: true } } },
  });

  const totalMinutes = watchedEpisodes.reduce(
    (sum, w) => sum + (w.episode.runtime ?? 24),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);

  const completedCount = await prisma.watchStatus.count({
    where: { userId, state: "COMPLETED" },
  });

  const genreCounts = new Map<string, number>();
  for (const w of watchedEpisodes) {
    for (const genre of w.episode.mediaItem.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const totalGenreTags = [...genreCounts.values()].reduce((a, b) => a + b, 0);
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({
      genre,
      percent: totalGenreTags > 0 ? Math.round((count / totalGenreTags) * 100) : 0,
    }));

  const GENRE_COLORS = ["#FF4E86", "#F5A544", "#3FBFA6", "#9391A3", "#F4EFE6"];

  const completedAnimeCount = await prisma.watchStatus.count({
    where: { userId, state: "COMPLETED", mediaItem: { type: "ANIME" } },
  });

  const episodesByDay = new Map<string, number>();
  for (const w of watchedEpisodes) {
    const day = w.watchedAt.toISOString().slice(0, 10);
    episodesByDay.set(day, (episodesByDay.get(day) ?? 0) + 1);
  }
  const maxEpisodesWatchedInOneDay = Math.max(0, ...episodesByDay.values());

  const badgeStats = {
    completedCount,
    completedAnimeCount,
    totalEpisodesWatched: watchedEpisodes.length,
    distinctGenresWatched: genreCounts.size,
    maxEpisodesWatchedInOneDay,
  };

  const badgesWithProgress = BADGES.map((b) => ({
    ...b,
    percent: b.progress(badgeStats),
  }));

  return (
    <main className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto">
      <Link
        href="/"
        className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors inline-block mb-6"
      >
        ← Accueil
      </Link>
      <Link
        href="/wrapped"
        className="font-mono text-xs bg-magenta text-void font-bold px-3 py-2 rounded-full inline-block mb-6 ml-2"
      >
        ✨ Voir mon Wrapped
      </Link>

      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #FF4E86, #F5A544)" }}
        />
        <h1 className="font-display text-2xl uppercase">
          {session.user.name ?? "Toi"}
        </h1>
        <p className="font-mono text-[11px] text-slate">
          membre depuis{" "}
          {(dbUser?.createdAt ?? new Date()).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: `${totalHours}h`, label: "Temps total" },
          { value: watchedEpisodes.length, label: "Épisodes" },
          { value: completedCount, label: "Terminés" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="bg-panel-2 border border-stroke rounded-xl text-center py-4"
          >
            <p className="font-display text-2xl text-amber">{value}</p>
            <p className="font-mono text-[9px] text-slate mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="font-mono text-[11px] text-magenta uppercase tracking-wide mb-3">
          Badges
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {badgesWithProgress.map((b) => (
            <div key={b.code} className="text-center shrink-0 w-16">
              <BadgeRing percent={b.percent} color={b.color} />
              <p className="font-mono text-[8.5px] text-slate mt-1.5 leading-tight">
                {b.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[11px] text-teal uppercase tracking-wide mb-3">
          Genres préférés
        </p>
        {topGenres.length === 0 ? (
          <p className="text-slate text-sm">
            Regarde quelques épisodes pour voir apparaître tes genres préférés
            ici.
          </p>
        ) : (
          topGenres.map(({ genre, percent }, i) => (
            <div key={genre} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold">{genre}</span>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: GENRE_COLORS[i % GENRE_COLORS.length] }}
                >
                  {percent}%
                </span>
              </div>
              <div className="h-1.5 bg-panel-2 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${percent}%`,
                    background: GENRE_COLORS[i % GENRE_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/connexion" });
        }}
        className="mt-10 text-center"
      >
        <button className="font-mono text-xs border border-stroke px-4 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
