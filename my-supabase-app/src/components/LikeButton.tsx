"use client";

import { useTransition } from "react";
import { incrementLikes } from "@/app/actions";

export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => incrementLikes())}
      disabled={isPending}
      className="bg-pink-100 hover:bg-pink-200 text-black p-2 rounded disabled:opacity-50"
    >
      ❤️ {initialLikes} Likes
    </button>
  );
}
