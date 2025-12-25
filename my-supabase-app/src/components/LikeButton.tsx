"use client";

import { useState, useTransition } from "react";
import { incrementLikes } from "@/app/actions";

export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    setLikes((prev) => prev + 1); // 🔥 optimistic update
    startTransition(() => incrementLikes());
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className="bg-pink-100 hover:bg-pink-200 text-black p-2 rounded"
    >
      ❤️ {likes} Likes
    </button>
  );
}
