// app/(dashboard)/student/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserProfileData } from "@/actions/profile";
import StatsOverview from "@/components/student/StatsOverview";
import ArticleProgressList from "@/components/student/ArticleProgressList";
import ProgressCharts from "@/components/student/ProgressCharts";
import PersonalInsights from "@/components/student/PersonalInsights";
import {  StudentProgress } from "@/types/StudentProgress";
import { Article } from "@/types/article";
import { User } from "@supabase/supabase-js/dist/index.cjs";

interface ProfileData {
  user: User;
  articles: Article[];
  progressRecords: StudentProgress[];
  totalMessages: number;
  totalSocraticQuestions: number;
  messagesPerArticle: Record<string, number>;
  socraticQuestionsPerArticle: Record<string, number>;
}

export default function StudentProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'articles' | 'progress'>('overview');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const data = await getUserProfileData();
      setProfileData(data);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">טוען את הפרופיל שלך...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">שגיאה בטעינת הפרופיל</p>
      </div>
    );
  }

  const { user, articles, progressRecords, totalMessages, totalSocraticQuestions } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header - Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 h-32" />
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              <div className="bg-white rounded-full p-2 shadow-xl">
                <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {(user.user_metadata?.full_name || user.email || '?').charAt(0)}
                  </div>
              </div>
              <div className="mr-6 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.user_metadata?.full_name || user.email}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  🎓 חבר מאז {new Date(user.created_at).toLocaleDateString('he-IL', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-6 py-3 font-semibold transition-all ${
                  selectedTab === 'overview'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                📊 סקירה כללית
              </button>
              <button
                onClick={() => setSelectedTab('articles')}
                className={`px-6 py-3 font-semibold transition-all ${
                  selectedTab === 'articles'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                📚 מאמרים
              </button>
              <button
                onClick={() => setSelectedTab('progress')}
                className={`px-6 py-3 font-semibold transition-all ${
                  selectedTab === 'progress'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                📈 התקדמות מפורטת
              </button>
            </div>
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <StatsOverview 
              articles={articles}
              progressRecords={progressRecords}
              totalMessages={totalMessages}
              totalSocraticQuestions={totalSocraticQuestions}
            />
            <PersonalInsights 
              progressRecords={progressRecords}
            />
          </div>
        )}

        {selectedTab === 'articles' && (
          <ArticleProgressList 
            articles={articles}
            progressRecords={progressRecords}
            messagesPerArticle={profileData.messagesPerArticle}
            socraticQuestionsPerArticle={profileData.socraticQuestionsPerArticle}
          />
        )}

        {selectedTab === 'progress' && (
          <ProgressCharts 
            progressRecords={progressRecords}
            articles={articles}
          />
        )}
      </div>
    </div>
  );
}