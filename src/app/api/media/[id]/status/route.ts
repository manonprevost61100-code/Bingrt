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

  const { state } = await req.json(); // WATCHING | COMPLETED | PLAN_TO_WATCH | DROPPED

  const status = await prisma.watchStatus.upsert({
    where: {
      userId_mediaItemId: { userId: session.user.id, mediaItemId: params.id },
    },
    update: {
      state,
      completedAt: state === "COMPLETED" ? new Date() : undefined,
    },
    create: {
      userId: session.user.id,
      mediaItemId: params.id,
      state,
      startedAt: state === "WATCHING" ? new Date() : undefined,
    },
  });

  await prisma.activity.create({
    data: {
      userId: session.user.id,
      type: state === "COMPLETED" ? "completed_show" : "status_updated",
      payload: { mediaItemId: params.id, state },
    },
  });

  return NextResponse.json(status);
}
