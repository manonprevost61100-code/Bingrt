import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await req.json();
  const score = body.score;
  const review = body.review;
  const userId = session.user.id;
  const mediaItemId = params.id;

  const rating = await prisma.rating.upsert({
    where: { userId_mediaItemId: { userId: userId, mediaItemId: mediaItemId } },
    update: { score: score, review: review },
    create: { userId: userId, mediaItemId: mediaItemId, score: score, review: review },
  });

  return NextResponse.json(rating);
}
