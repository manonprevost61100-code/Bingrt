"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";

type SearchResult = {
  tmdbId: number;
  kind: "MOVIE" | "TV" | "ANIME";
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  overview: string;
};

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  MOVIE: "FILM",
  TV: "SÉRIE",
  ANIME: "ANIME",
};

const KIND_COLOR: Record<SearchResult["kind"], string> = {
  MOVIE: "text-amber",
  TV: "text-teal",
  ANIME: "text-magenta",
};

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<"ALL" | SearchResult["kind"]>("ALL");
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(result: SearchResult) {
    setImportingId(result.tmdbId);
    try {
      const res = await fetch("/api/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: result.tmdbId,
          mediaType: result.kind === "MOVIE" ? "movie" : "tv",
        }),
      });
      const data = await res.json();
      if (data.id) {
        startTransition(() => router.push(`/media/${data.id}`));
      }
    } finally {
      setImportingId(null);
    }
  }

  const filtered = results.filter((r) => filter === "ALL" || r.kind === filter);

  return (
    <main className="min-h-screen px-6 py-8 pb-16 max-w-2xl mx-auto">
      <Link
        href="/"
        className="font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors inline-block mb-4"
      >
        ← Accueil
      </Link>
      <h1 className="font-display text-3xl uppercase mb-4">Recherche</h1>

      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Un titre, un genre…"
        className="w-full bg-transparent border border-stroke rounded-xl px-4 py-3 text-sm text-cream placeholder:text-slate mb-4 focus:outline-none focus:border-amber"
      />

      <div className="flex gap-2 mb-6">
        {(["ALL", "TV", "MOVIE", "ANIME"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === k
                ? "bg-cream text-void border-cream font-bold"
                : "border-stroke text-slate hover:text-cream"
            }`}
          >
            {k === "ALL" ? "Tout" : k === "TV" ? "Séries" : k === "MOVIE" ? "Films" : "Animes"}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate text-sm font-mono">Recherche…</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <button
            key={`${r.kind}-${r.tmdbId}`}
            onClick={() => handleSelect(r)}
            disabled={importingId === r.tmdbId || isPending}
            className="text-left group disabled:opacity-50"
          >
            <div className="relative rounded-lg overflow-hidden bg-panel-2 aspect-[2/3] mb-2">
              {r.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl(r.posterPath, "w342") ?? ""}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate text-xs">
                  Pas d'image
                </div>
              )}
              <span
                className={`absolute top-2 left-2 font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm ${KIND_COLOR[r.kind]}`}
              >
                {KIND_LABEL[r.kind]}
              </span>
              {importingId === r.tmdbId && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-cream">Import…</span>
                </div>
              )}
            </div>
            <p className="font-bold text-xs leading-tight">{r.title}</p>
          </button>
        ))}
      </div>

      {!loading && query.length >= 2 && filtered.length === 0 && (
        <p className="text-slate text-sm font-mono mt-4">Aucun résultat.</p>
      )}
    </main>
  );
}
