import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import SocialSearch from "./SocialSearch";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const userId = session.user.id;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, name: true, image: true } } },
  });

  const followingIds = following.map(function (f) {
    return f.followingId;
  });

  const friendsActivity = await prisma.activity.findMany({
    where: { userId: { in: followingIds } },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <main className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto">
      <Link
        href="/"
        className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors inline-block mb-6"
      >
        {"← Accueil"}
      </Link>

      <h1 className="font-display text-3xl uppercase mb-6">Social</h1>

      <SocialSearch />

      <div className="mt-8 mb-10">
        <p className="font-mono text-[11px] text-amber uppercase tracking-wide mb-3">
          Tes amis suivis
        </p>
        {following.length === 0 ? (
          <p className="text-slate text-sm">
            Tu ne suis personne pour l'instant. Cherche un pseudo ci-dessus
            pour commencer.
          </p>
        ) : (
          <div className="space-y-1">
            {following.map(function (f) {
              return (
                <div
                  key={f.followingId}
                  className="flex items-center gap-3 py-2"
                >
                  <div
                    className="w-9 h-9 rounded-full shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF4E86, #F5A544)" }}
                  />
                  <p className="font-bold text-[13px] flex-1">
                    {f.following.name}
                  </p>
                  <FollowButton userId={f.followingId} initialFollowing={true} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="font-mono text-[11px] text-magenta uppercase tracking-wide mb-3">
          Feed
        </p>
        {friendsActivity.length === 0 ? (
          <p className="text-slate text-sm">
            Suis des amis pour voir leur activite apparaitre ici.
          </p>
        ) : (
          <div className="space-y-1">
            {friendsActivity.map(function (a) {
              let label = "a mis a jour son activite";
              if (a.type === "watched_episode") label = "a regarde un episode";
              if (a.type === "completed_show") label = "a termine un titre";
              if (a.type === "status_updated") label = "a mis a jour son statut de visionnage";

              return (
                <div
                  key={a.id}
                  className="ticket flex items-center gap-3 bg-panel-2 border border-stroke rounded-xl px-4 py-3"
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF4E86, #F5A544)" }}
                  />
                  <p className="text-[12.5px] flex-1">
                    <span className="font-bold">{a.user.name}</span>{" "}
                    <span className="text-slate">{label}</span>
                  </p>
                  <p className="font-mono text-[9px] text-stroke">
                    {a.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
