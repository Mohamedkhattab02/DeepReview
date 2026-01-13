"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SignupSuccessToast() {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("signup") === "success") {
      setOpen(true);

      // remove query param after showing once
      const url = new URL(window.location.href);
      url.searchParams.delete("signup");
      router.replace(url.pathname + url.search, { scroll: false });

      // auto close after 2.5s
      const t = setTimeout(() => setOpen(false), 2500);
      return () => clearTimeout(t);
    }
  }, [params, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* centered box */}
      <div className="relative w-[92%] max-w-md rounded-2xl border border-green-500/40 bg-slate-950 px-6 py-5 shadow-2xl animate-[popIn_180ms_ease-out]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
            <span className="text-green-400 text-xl">✓</span>
          </div>

          <div className="flex-1">
            <p className="text-white font-bold text-lg">Account created successfully!</p>
            <p className="text-slate-300 text-sm mt-1">
              You can now log in and start using DeepReview.
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold py-2 transition"
        >
          OK
        </button>

        {/* keyframes (Tailwind arbitrary animation name uses global CSS; we can inline via style tag) */}
        <style jsx>{`
          @keyframes popIn {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
