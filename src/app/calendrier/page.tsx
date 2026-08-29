import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

const KIND_COLOR: Record<string, string> = {
  MOVIE: "#F5A544",
  TV: "#3FBFA6",
  ANIME: "#FF4E86",
};

function monthBounds(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { first, last };
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  const now = new Date();
  const [year, month] = searchParams.m
    ? searchParams.m.split("-").map(Number)
    : [now.getFullYear(), now.getMonth()];

  const { first, last } = monthBounds(year, month);
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  // Épisodes du mois affiché, pour les titres suivis
  const monthEpisodes = await prisma.episode.findMany({
    where: {
      airDate: { gte: first, lte: last },
      mediaItem: { watchStatuses: { some: { userId } } },
    },
    include: { mediaItem: true },
    orderBy: { airDate: "asc" },
  });

  const episodesByDay = new Map<number, typeof monthEpisodes>();
  for (const ep of monthEpisodes) {
    const day = ep.airDate!.getDate();
    if (!episodesByDay.has(day)) episodesByDay.set(day, []);
    episodesByDay.get(day)!.push(ep);
  }

  // Grille : décalage pour commencer un lundi
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lundi
  const daysInMonth = last.getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();
  const todayDate = now.getDate();

  // Liste chronologique complète des sorties à venir (60 prochains jours, toutes confondues)
  const upcomingList = await prisma.episode.findMany({
    where: {
      airDate: { gte: now },
      mediaItem: { watchStatuses: { some: { userId } } },
    },
    include: { mediaItem: true },
    orderBy: { airDate: "asc" },
    take: 10,
  });

  return (
    <main className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors"
          >
            ← Accueil
          </Link>
          <h1 className="font-display text-3xl uppercase">Calendrier</h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-amber">
          <Link
            href={`/calendrier?m=${prevMonth.getFullYear()}-${prevMonth.getMonth()}`}
            className="text-slate hover:text-cream"
          >
            ←
          </Link>
          <span>
            {MOIS[month].toUpperCase()} {year}
          </span>
          <Link
            href={`/calendrier?m=${nextMonth.getFullYear()}-${nextMonth.getMonth()}`}
            className="text-slate hover:text-cream"
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-10">
        {JOURS.map((j, i) => (
          <div
            key={i}
            className="text-center font-mono text-[10px] text-slate"
          >
            {j}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dayEpisodes = episodesByDay.get(day) ?? [];
          const isToday = isCurrentMonth && day === todayDate;
          const hasRelease = dayEpisodes.length > 0;
          const dominantColor = hasRelease
            ? KIND_COLOR[dayEpisodes[0].mediaItem.type]
            : undefined;

          return (
            <div
              key={day}
              className="aspect-square flex items-center justify-center rounded-lg font-mono text-[11px]"
              style={
                isToday
                  ? { background: "#F5A544", color: "#0E0E14", fontWeight: 700 }
                  : hasRelease
                  ? { border: `1px solid ${dominantColor}`, color: dominantColor }
                  : { color: "#9391A3" }
              }
            >
              {day}
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[11px] text-slate uppercase tracking-wide mb-3">
        Prochaines sorties
      </p>

      {upcomingList.length === 0 ? (
        <p className="text-slate text-sm">
          Aucune sortie prévue pour tes titres suivis dans les prochains jours.
        </p>
      ) : (
        <div className="space-y-2">
          {upcomingList.map((ep) => (
            <Link
              key={ep.id}
              href={`/media/${ep.mediaItemId}`}
              className="flex items-center gap-3 bg-panel-2 border border-stroke rounded-xl px-4 py-3"
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: KIND_COLOR[ep.mediaItem.type] }}
              />
              <div className="flex-1">
                <p className="font-bold text-[12.5px]">{ep.mediaItem.title}</p>
                <p className="font-mono text-[10px] text-slate">
                  S{ep.seasonNumber}E{String(ep.episodeNumber).padStart(2, "0")}
                  {ep.title ? ` — ${ep.title}` : ""}
                </p>
              </div>
              <p
                className="font-mono text-[11px]"
                style={{ color: KIND_COLOR[ep.mediaItem.type] }}
              >
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
    </main>
  );
}
