import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      name: { contains: query, mode: "insensitive" },
    },
    select: { id: true, name: true, image: true },
    take: 10,
  });

  const followingIds = new Set(
    (
      await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })
    ).map(function (f) {
      return f.followingId;
    })
  );

  const results = users.map(function (u) {
    return Object.assign({}, u, { isFollowing: followingIds.has(u.id) });
  });

  return NextResponse.json({ results: results });
}
