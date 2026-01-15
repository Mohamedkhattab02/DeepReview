// components/student/Profileform.tsx
"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/myprofile";
import { User } from "@/lib/supabase";

interface ProfileFormProps {
  user: User | null;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await updateProfile({ fullName });
      
      if (result.success) {
        setMessage({ type: "success", text: "The profile has been updated successfully!" });
      } else {
        setMessage({ type: "error", text: result.error || "Error updating profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (

    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
         full Name
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          placeholder="Enter your full name"
          required
        />
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p>{message.text}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-purple-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
             saving changes
            </>
          )}
        </button>

        {/* Back Button */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-300 transition"
          >
            Back
          </button>

      </div>
    </form>

  );
}