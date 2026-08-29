"use client";

import { useState, useTransition } from "react";

const STATES = [
  { value: "PLAN_TO_WATCH", label: "À voir" },
  { value: "WATCHING", label: "En cours" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "DROPPED", label: "Abandonné" },
] as const;

export default function WatchStatusButtons({
  mediaId,
  initialState,
}: {
  mediaId: string;
  initialState: string | null;
}) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  async function updateState(value: string) {
    setState(value);
    startTransition(async () => {
      await fetch(`/api/media/${mediaId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: value }),
      });
    });
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {STATES.map((s) => (
        <button
          key={s.value}
          onClick={() => updateState(s.value)}
          disabled={isPending}
          className={`font-mono text-xs px-3 py-2 rounded-full border transition-colors ${
            state === s.value
              ? "bg-amber text-void border-amber font-bold"
              : "border-stroke text-slate hover:text-cream"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
