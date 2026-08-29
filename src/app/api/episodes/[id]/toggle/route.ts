import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = session.user.id;
  const episodeId = params.id;

  const existing = await prisma.watchedEpisode.findUnique({
    where: { userId_episodeId: { userId, episodeId } },
  });

  if (existing) {
    await prisma.watchedEpisode.delete({ where: { id: existing.id } });
    return NextResponse.json({ watched: false });
  }

  await prisma.watchedEpisode.create({ data: { userId, episodeId } });

  await prisma.activity.create({
    data: {
      userId,
      type: "watched_episode",
      payload: { episodeId },
    },
  });

  return NextResponse.json({ watched: true });
}
