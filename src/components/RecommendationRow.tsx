"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { posterUrl } from "@/lib/tmdb";

type Recommendation = {
  tmdbId: number;
  kind: "MOVIE" | "TV" | "ANIME";
  title: string;
  posterPath: string | null;
};

const KIND_COLOR: Record<Recommendation["kind"], string> = {
  MOVIE: "#F5A544",
  TV: "#3FBFA6",
  ANIME: "#FF4E86",
};

export default function RecommendationRow() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/media/recommendations")
      .then((res) => res.json())
      .then((data) => setRecs(data.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleImport(rec: Recommendation) {
    setImportingId(rec.tmdbId);
    try {
      const res = await fetch("/api/media/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: rec.tmdbId,
          mediaType: rec.kind === "MOVIE" ? "movie" : "tv",
        }),
      });
      const data = await res.json();
      if (data.id) router.push(`/media/${data.id}`);
    } finally {
      setImportingId(null);
    }
  }

    if (loading) return null;

  return (
    <section className="mb-10">
      <p className="font-mono text-[11px] text-amber uppercase tracking-wide mb-3">
        Pour toi
      </p>

      {recs.length === 0 ? (
        <p className="text-slate text-sm">
          Note un titre que tu as regardé (7/10 ou plus) pour débloquer des
          recommandations personnalisées.
        </p>
      ) : (
      <div className="flex gap-3 overflow-x-auto pb-2">
        
        {recs.map((rec) => (
          <button
            key={`${rec.kind}-${rec.tmdbId}`}
            onClick={() => handleImport(rec)}
            disabled={importingId === rec.tmdbId}
            className="w-32 shrink-0 text-left disabled:opacity-50"
          >
            <div className="rounded-lg overflow-hidden bg-panel-2 aspect-[2/3] mb-2 relative">
              {rec.posterPath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl(rec.posterPath, "w342") ?? ""}
                  alt={rec.title}
                  className="w-full h-full object-cover"
                />
              )}
              {importingId === rec.tmdbId && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-cream">
                    Import…
                  </span>
                </div>
              )}
            </div>
            <p className="font-bold text-[12.5px] leading-tight">
              {rec.title}
            </p>
          </button>
                ))}
      </div>
      )}
    </section>
  );
}