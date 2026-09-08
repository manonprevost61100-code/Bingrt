"use client";

import { useState, useTransition } from "react";

export default function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setFollowing(function (f) {
      return !f;
    });
    startTransition(async function () {
      await fetch("/api/follow/" + userId + "/toggle", { method: "POST" });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={
        following
          ? "font-mono text-[10px] px-3 py-1.5 rounded-full border border-stroke text-slate"
          : "font-mono text-[10px] px-3 py-1.5 rounded-full bg-amber text-void font-bold"
      }
    >
      {following ? "Suivi" : "Suivre"}
    </button>
  );
}
