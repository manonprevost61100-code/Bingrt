import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const followerId = session.user.id;
  const followingId = params.userId;

  if (followerId === followingId) {
    return NextResponse.json(
      { error: "Impossible de se suivre soi-meme" },
      { status: 400 }
    );
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: followerId, followingId: followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await prisma.follow.create({ data: { followerId: followerId, followingId: followingId } });
  return NextResponse.json({ following: true });
}
