import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1️⃣ בדיקת משתמש מחובר
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2️⃣ שליפת פרופיל משתמש (רק עמודות נדרשות!)
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    // מצב חריג – Auth קיים אבל אין row בטבלת users
    redirect('/login')
  }

  const isStudent = profile.role === 'student'
  const dashboardBase = isStudent
    ? '/dashboard/student'
    : '/dashboard/instructor'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ===== Top Navbar ===== */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left */}
            <div className="flex items-center space-x-8">
              <Link href={dashboardBase} className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">🤖</span>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Socratic Bot
                </span>
              </Link>

              {isStudent && (
                <div className="hidden md:flex space-x-4">
                  <NavLink href="/dashboard/student">Dashboard</NavLink>
                  <NavLink href="/dashboard/student/mylibrary">My Library</NavLink>
                  <NavLink href="/dashboard/student/upload">Upload</NavLink>
                  <NavLink href="/dashboard/student/compare">Compare</NavLink>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile.full_name}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {profile.role}
              </span>

              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== Main Content ===== */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 Socratic Research Bot. Powered by Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ===== Reusable NavLink =====
function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
    >
      {children}
    </Link>
  )
}
