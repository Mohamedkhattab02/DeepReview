// app/page.tsx
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Moon, Sun, BookOpen, Brain, TrendingUp, MessageCircle, BarChart3, Target, CheckCircle, Sparkles } from "lucide-react";
import SignupSuccessToast from "@/components/auth/SignupSuccessToast";

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">

    {/* ✅ SUCCESS MESSAGE */}
    <SignupSuccessToast />

    {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
              📚
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DeepReview
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">
              About
            </a>
            <a href="#features" className="text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">
              How It Works
            </a>
            <a href="#testimonials" className="text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">
              Testimonials
            </a>
          </div>

          {/* Auth & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <Link
              href="/auth/login"
              className="px-5 py-2 text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 rounded-2xl font-bold text-l bg-gradient-to-r from-blue-600 to-purple-600 text-white !opacity-100 dark:!opacity-100 dark:!text-white dark:![filter:brightness(1.2)] transition shadow-xl"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Powered by Gemini AI
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
            Master Academic
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Research Papers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Use Socratic AI to deeply understand research papers, engage in
            meaningful discussions, and develop critical thinking skills through intelligent dialogue.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-10 py-5 rounded-2xl font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white !opacity-100 dark:!opacity-100 dark:!text-white dark:![filter:brightness(1.2)] transition shadow-xl"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-lg transition border-2 border-slate-200 dark:border-slate-700"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Why DeepReview Works */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-20 bg-white dark:bg-slate-900/50 rounded-3xl my-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Why DeepReview Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our platform combines Socratic learning, AI-powered analysis, and personalized progress tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Socratic Dialogue
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Engage in guided conversations that help you discover insights
              through thoughtful questioning. The AI adapts to your level.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-8 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Smart Analysis
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              AI-powered insights extract key findings, methodology, and themes
              from any research paper automatically.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-2 border-pink-200 dark:border-pink-800 rounded-2xl p-8 hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Progress Tracking
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Monitor your learning journey with detailed analytics and
              personalized recommendations for improvement.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Simple steps to start mastering research papers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-black text-white">1</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Upload Your Paper
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Upload any PDF research paper. Our AI will analyze it and extract key concepts, methodology, and findings.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-black text-white">2</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Engage in Dialogue
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              Chat with AI or start a Socratic session with 5 adaptive questions that deepen your understanding.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl font-black text-white">3</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Track Your Progress
            </h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              View detailed analytics, scores, strengths, and personalized recommendations for each paper.
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="max-w-7xl mx-auto px-6 py-20 bg-gradient-to-br from-blue-900 to-purple-900 dark:from-blue-950 dark:to-purple-950 rounded-3xl my-20 text-white">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              About DeepReview
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed mb-6">
              DeepReview helps students and researchers master academic papers through AI-powered Socratic dialogue and intelligent analysis.
            </p>
            <p className="text-lg text-blue-100 leading-relaxed mb-8">
              Education should be accessible, engaging, and effective. Our platform delivers all three through cutting-edge AI technology.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-blue-100">AI-powered Socratic learning</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-blue-100">Detailed progress analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-blue-100">Personalized recommendations</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-black text-white mb-2">5000+</div>
              <div className="text-blue-200">Papers Analyzed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-black text-white mb-2">1000+</div>
              <div className="text-blue-200">Active Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-black text-white mb-2">92%</div>
              <div className="text-blue-200">Satisfaction Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-black text-white mb-2">24/7</div>
              <div className="text-blue-200">AI Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            What Our Students Say
          </h2>
          <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hear from students who mastered research papers with DeepReview
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-blue-500 dark:hover:border-blue-500 transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                D
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">David Cohen</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">Computer Science PhD</div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed italic">
              "The Socratic method helped me understand complex AI papers I struggled with for months. Game changer!"
            </p>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">⭐</span>
              ))}
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-purple-500 dark:hover:border-purple-500 transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Sarah Johnson</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">Biology Researcher</div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed italic">
              "The progress tracking showed exactly where I needed to improve. My comprehension scores went from 70 to 95!"
            </p>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">⭐</span>
              ))}
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-pink-500 dark:hover:border-pink-500 transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Michael Rodriguez</div>
                <div className="text-sm text-slate-600 dark:text-gray-400">Engineering Student</div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed italic">
              "Finally, an AI tool that actually helps me learn instead of just giving me answers. Brilliant approach!"
            </p>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">⭐</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Master Research Papers?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students using DeepReview to deeply understand academic research.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-xl"
          >
            Get Started Free Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm">
                  📚
                </div>
                <span className="font-bold text-slate-900 dark:text-white">DeepReview</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                Master academic research papers with AI-powered Socratic learning.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                <li><a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400">How It Works</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                <li><a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400">About</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 text-center text-sm text-slate-600 dark:text-gray-400">
            <p>© 2026 DeepReview. All rights reserved. Powered by Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}