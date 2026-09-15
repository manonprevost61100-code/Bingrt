"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  read: boolean;
  createdAt: string;
  episode: {
    seasonNumber: number;
    episodeNumber: number;
    title: string | null;
    mediaItemId: string;
    mediaItem: { title: string };
  };
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative font-mono text-xs border border-stroke px-3 py-2 rounded-full text-slate hover:text-cream hover:border-cream transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-magenta text-void text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-panel-2 border border-stroke rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-slate text-sm p-4">Aucune notification.</p>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={`/media/${n.episode.mediaItemId}`}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`block px-4 py-3 border-b border-stroke last:border-b-0 hover:bg-black/20 transition-colors ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="font-bold text-[12.5px]">
                  {n.episode.mediaItem.title}
                </p>
                <p className="font-mono text-[10px] text-slate">
                  S{n.episode.seasonNumber}E
                  {String(n.episode.episodeNumber).padStart(2, "0")}
                  {n.episode.title ? ` — ${n.episode.title}` : ""} est
                  disponible
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
