// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { User } from "@/lib/supabase";
import { signOut } from "@/actions/auth";
import { useState } from "react";

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* ✅ changed: removed justify-between so we can control left/middle/right */}
        <div className="flex items-center">
          {/* Logo */}
          <Link
            href={user.role === "student" ? "/student" : "/instructor"}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
              📚
            </div>
            <span className="text-2xl font-black text-gray-900">
              DeepReview
            </span>
          </Link>

          {/* ✅ Desktop Navigation (moved left + added Compare & Chat) */}
          <div className="hidden md:flex items-center gap-6 ml-10 flex-1">
            {user.role === "student" && (
              <>
                <Link
                  href="/dashboard/student"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/student/mylibrary"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  My Library
                </Link>

                <Link
                  href="/dashboard/student/upload"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Upload
                </Link>

                {/* 🆕 NEW */}
                <Link
                  href="/dashboard/student/compare"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Compare
                </Link>

                {/* 🆕 NEW */}
                <Link
                  href="/dashboard/student/chat"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Chat
                </Link>

                 <Link
                  href="/dashboard/student/socraticbot"
                  className="text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  socraticbot
                </Link>
              </>
            )}
          </div>

          {/* User Menu (desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.full_name}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-blue-600 font-bold uppercase">
                    {user.role}
                  </p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg ml-auto"
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

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-200 space-y-2">
            {user.role === "student" && (
              <>
                <Link
                  href="/dashboard/student"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/student/mylibrary"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  My Library
                </Link>

                <Link
                  href="/dashboard/student/upload"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Upload
                </Link>

                {/* 🆕 NEW */}
                <Link
                  href="/dashboard/student/compare"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Compare
                </Link>

                {/* 🆕 NEW */}
                <Link
                  href="/dashboard/student/chat"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  Chat
                </Link>
              </>
            )}

            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
