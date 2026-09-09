"use client";

import { useState, useTransition } from "react";

export default function RatingInput({
  mediaId,
  initialScore,
  initialReview,
}: {
  mediaId: string;
  initialScore: number | null;
  initialReview: string | null;
}) {
  const [score, setScore] = useState(initialScore || 0);
  const [review, setReview] = useState(initialReview || "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStarClick(value: number) {
    setScore(value);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async function () {
      await fetch("/api/media/" + mediaId + "/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: score, review: review }),
      });
      setSaved(true);
    });
  }

  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="bg-panel-2 border border-stroke rounded-xl p-4">
      <p className="font-mono text-[11px] text-slate uppercase tracking-wide mb-3">
        Ta note
      </p>
      <div className="flex gap-1 mb-3 flex-wrap">
        {stars.map(function (n) {
          const filled = n <= score;
          return (
            <button
              key={n}
              onClick={function () {
                handleStarClick(n);
              }}
              className="text-lg"
              style={{ color: filled ? "#F5A544" : "#2B2B38" }}
            >
              {"\u2605"}
            </button>
          );
        })}
        {score > 0 && (
          <span className="font-mono text-[11px] text-amber ml-2 self-center">
            {score}/10
          </span>
        )}
      </div>
      <textarea
        value={review}
        onChange={function (e) {
          setReview(e.target.value);
          setSaved(false);
        }}
        placeholder="Ton avis (optionnel)..."
        rows={2}
        className="w-full bg-transparent border border-stroke rounded-lg px-3 py-2 text-[12.5px] text-cream placeholder:text-slate focus:outline-none focus:border-amber resize-none"
      />
      <button
        onClick={handleSave}
        disabled={isPending || score === 0}
        className="mt-3 font-mono text-xs bg-amber text-void font-bold px-4 py-2 rounded-full disabled:opacity-40"
      >
        {saved ? "Enregistre" : isPending ? "..." : "Enregistrer"}
      </button>
    </div>
  );
}
