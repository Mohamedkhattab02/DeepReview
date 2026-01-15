"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 relative transition-colors">
      {/* Theme Toggle - Top Right */}
      <ThemeToggleButton />

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            📚
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">DeepReview</h1>
        </div>
        <p className="text-slate-800 dark:text-white text-xl">Academic Research Assistant</p>
      </div>

      <main className="w-full">{children}</main>

      <footer className="mt-8 text-center text-xs text-slate-500 dark:text-gray-500">
        © 2024 DeepReview. All rights reserved.
      </footer>
    </div>
  );
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-md"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}