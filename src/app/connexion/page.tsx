import { signIn } from "@/lib/auth";

export default function ConnexionPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-amber uppercase mb-2">
          Bienvenue sur
        </p>
        <h1 className="font-display text-6xl text-cream uppercase mb-8">
          Bingr<span className="text-magenta">.</span>
        </h1>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="font-mono text-sm bg-cream text-void font-bold px-6 py-3 rounded-full hover:bg-amber transition-colors"
          >
            Se connecter avec GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
