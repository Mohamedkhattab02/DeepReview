// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen  from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
              📚
            </div>
            <span className="text-2xl font-black text-white">DeepReview</span>
          </div>

          {/* Auth Links */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-gray-300 hover:text-white transition font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition font-bold shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-8">
            <span className="animate-pulse">✨</span>
            Powered by Gemini AI
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            Master Academic
            <br />
            <span className=" from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Research Papers
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Use Socratic AI to deeply understand research papers, engage in
            meaningful discussions, and develop critical thinking skills.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
          
            <Link
              href="#features"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition border border-slate-700"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-24">
          {/* Feature 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Socratic Dialogue
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Engage in guided conversations that help you discover insights
              through thoughtful questioning.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Smart Analysis
            </h3>
            <p className="text-gray-400 leading-relaxed">
              AI-powered insights extract key findings, methodology, and themes
              from any research paper.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-pink-500/50 transition">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Progress Tracking
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Monitor your learning journey with detailed analytics and
              personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}