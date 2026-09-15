import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Marque une notification comme lue (vérifie qu'elle appartient bien à l'utilisateur). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
