"use client";

import { useState } from "react";
import FollowButton from "@/components/FollowButton";

type UserResult = {
  id: string;
  name: string | null;
  image: string | null;
  isFollowing: boolean;
};

export default function SocialSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        "/api/users/search?q=" + encodeURIComponent(value)
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        value={query}
        onChange={function (e) {
          handleSearch(e.target.value);
        }}
        placeholder="Chercher un pseudo..."
        className="w-full bg-transparent border border-stroke rounded-xl px-4 py-3 text-sm text-cream placeholder:text-slate focus:outline-none focus:border-amber"
      />

      {loading && (
        <p className="text-slate text-sm font-mono mt-2">Recherche...</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map(function (u) {
            return (
              <div key={u.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full bg-panel-2 shrink-0" />
                <p className="font-bold text-[13px] flex-1">{u.name}</p>
                <FollowButton userId={u.id} initialFollowing={u.isFollowing} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
