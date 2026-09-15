import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route appelée quotidiennement par un Vercel Cron Job.
 * Crée une notification pour chaque utilisateur suivant un titre dont
 * un épisode sort aujourd'hui. Idempotent grâce à la contrainte unique
 * (userId, episodeId) : ne recrée jamais de doublon.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const episodesToday = await prisma.episode.findMany({
    where: { airDate: { gte: startOfDay, lte: endOfDay } },
    include: {
      mediaItem: {
        include: { watchStatuses: { select: { userId: true } } },
      },
    },
  });

  let created = 0;
  for (const episode of episodesToday) {
    for (const status of episode.mediaItem.watchStatuses) {
      const result = await prisma.notification.upsert({
        where: {
          userId_episodeId: { userId: status.userId, episodeId: episode.id },
        },
        update: {},
        create: { userId: status.userId, episodeId: episode.id },
      });
      created++;
    }
  }

  return NextResponse.json({ ok: true, episodesToday: episodesToday.length, created });
}
