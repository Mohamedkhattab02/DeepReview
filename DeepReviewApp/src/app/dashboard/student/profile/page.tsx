// app/dashboard/student/profile/page.tsx
/**
 * Student profile page.
 * Requires authentication, then loads the full user record from the database.
 * Displays account info and renders ProfileForm for editing personal details.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ProfileForm from "@/components/student/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  // שליפת נתוני המשתמש המלאים
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">my profile</h1>
          <p className="text-gray-600 mt-2">Manage your account details and preferences</p>
        </div>

        {/* Profile Card */}
<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

  <div className="px-6 pt-8 pb-6">
    <div className="mb-6 flex items-center gap-6">

      {/* Avatar */}
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-500 text-4xl font-bold text-white shadow-lg">
        {userData?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
      </div>

      {/* Name + Role */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {userData?.full_name}
        </h2>
        <p className="capitalize text-gray-600 dark:text-slate-300">
          {userData?.role}
        </p>
      </div>

    </div>

            {/* Profile Info */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{userData?.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="text-gray-900 font-medium capitalize">{userData?.role}</p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created Date</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(userData?.created_at || "").toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Edit Profile Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Personal Details</h3>
                <ProfileForm user={userData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}