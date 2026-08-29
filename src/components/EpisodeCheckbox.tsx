"use client";

import { useState, useTransition } from "react";

export default function EpisodeCheckbox({
  episodeId,
  initialWatched,
}: {
  episodeId: string;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useState(initialWatched);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setWatched((w) => !w);
    startTransition(async () => {
      await fetch(`/api/episodes/${episodeId}/toggle`, { method: "POST" });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-colors ${
        watched
          ? "bg-teal border-teal text-void"
          : "border-stroke text-transparent"
      }`}
    >
      ✓
    </button>
  );
}
