// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { signOut } from "@/actions/auth";
import { User } from "@/lib/supabase";

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ next-themes
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Logo */}
          <Link
            href={user.role === "student" ? "/dashboard/student/mylibrary" : "/dashboard/instructor"}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
              📚
            </div>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              DeepReview
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 ml-10 flex-1">
            {user.role === "student" && (
              <>
                <Link
                  href="/dashboard/student"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/student/mylibrary"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  My Library
                </Link>

                <Link
                  href="/dashboard/student/upload"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  Upload
                </Link>

                <Link
                  href="/dashboard/student/compare"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  Compare
                </Link>

                <Link
                  href="/dashboard/student/chat"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  Chat
                </Link>

                <Link
                  href="/dashboard/student/socraticbot"
                  className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white font-medium transition"
                >
                  SocraticBot
                </Link>
              </>
            )}
          </div>

          {/* Right side (desktop): Theme + User menu */}
          <div className="hidden md:flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* User Menu Button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                {user.full_name}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {user.email}
                  </p>
                  <p className="text-xs text-blue-600 font-bold uppercase">
                    {user.role}
                  </p>
                </div>

                <Link
                  href="/dashboard/student/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  My Profile
                </Link>

                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg ml-auto"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
            {/* Theme toggle mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 w-full"
            >
              {mounted && theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {user.role === "student" && (
              <>
                <Link
                  href="/dashboard/student"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/student/mylibrary"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  My Library
                </Link>

                <Link
                  href="/dashboard/student/upload"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Upload
                </Link>

                <Link
                  href="/dashboard/student/compare"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Compare
                </Link>

                <Link
                  href="/dashboard/student/chat"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Chat
                </Link>

                <Link
                  href="/dashboard/student/socraticbot"
                  className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  SocraticBot
                </Link>
              </>
            )}

            <Link
              href="/dashboard/student/profile"
              className="block px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              My Profile
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
