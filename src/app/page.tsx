import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-teal uppercase mb-2">
          Connexion réussie
        </p>
        <h1 className="font-display text-4xl uppercase mb-1">
          Salut {session.user.name?.split(" ")[0] ?? "toi"}
        </h1>
        <p className="text-slate text-sm mb-6">
          L'auth fonctionne. Prochaine étape : l'écran Accueil (lot 3).
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/recherche"
            className="font-mono text-xs bg-amber text-void font-bold px-4 py-2 rounded-full"
          >
            Aller à la recherche
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <button className="font-mono text-xs border border-stroke px-4 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
