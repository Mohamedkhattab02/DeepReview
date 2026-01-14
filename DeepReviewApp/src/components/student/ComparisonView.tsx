//component /student/ComparisonView.tsx
"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, X, BookOpen, Users, Calendar, FileText, Tag, Sparkles } from "lucide-react";

interface Article {
  id: string;
  title: string;
  authors?: string[];
  publication_year?: string;
  pages?: string;
  abstract?: string;
  main_topics?: string[];
  keywords?: string[];
}

interface ComparisonViewProps {
  articles: Article[];
}

export default function ComparisonView({ articles }: ComparisonViewProps) {
  const [selectedArticle1, setSelectedArticle1] = useState<string>("");
  const [selectedArticle2, setSelectedArticle2] = useState<string>("");

  const article1 = articles.find((a) => a.id === selectedArticle1);
  const article2 = articles.find((a) => a.id === selectedArticle2);

  const getTopicsComparison = () => {
    if (!article1 || !article2) return null;

    const topics1 = article1.main_topics || [];
    const topics2 = article2.main_topics || [];

    const shared = topics1.filter((t) => topics2.includes(t));
    const unique1 = topics1.filter((t) => !topics2.includes(t));
    const unique2 = topics2.filter((t) => !topics1.includes(t));

    return { shared, unique1, unique2 };
  };

  const getKeywordsComparison = () => {
    if (!article1 || !article2) return null;

    const keywords1 = article1.keywords || [];
    const keywords2 = article2.keywords || [];

    const shared = keywords1.filter((k) => keywords2.includes(k));
    const unique1 = keywords1.filter((k) => !keywords2.includes(k));
    const unique2 = keywords2.filter((k) => !keywords1.includes(k));

    return { shared, unique1, unique2 };
  };

  const getSimilarityScore = () => {
    if (!article1 || !article2) return 0;

    const topics = getTopicsComparison();
    const keywords = getKeywordsComparison();

    if (!topics || !keywords) return 0;

    const totalTopics = new Set([
      ...(article1.main_topics || []),
      ...(article2.main_topics || []),
    ]).size;

    const totalKeywords = new Set([
      ...(article1.keywords || []),
      ...(article2.keywords || []),
    ]).size;

    const topicScore = totalTopics > 0 ? (topics.shared.length / totalTopics) * 100 : 0;
    const keywordScore = totalKeywords > 0 ? (keywords.shared.length / totalKeywords) * 100 : 0;

    return Math.round((topicScore + keywordScore) / 2);
  };

  const topicsComp = getTopicsComparison();
  const keywordsComp = getKeywordsComparison();
  const similarityScore = getSimilarityScore();

  const getSimilarityColor = (score: number) => {
    if (score >= 70) return "from-emerald-500 to-teal-500";
    if (score >= 40) return "from-amber-500 to-orange-500";
    return "from-rose-500 to-pink-500";
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 70) return "High Similarity";
    if (score >= 40) return "Moderate Similarity";
    return "Low Similarity";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <ArrowLeftRight className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Article Comparison
          </h1>
          <p className="text-gray-600">Compare research articles side by side</p>
        </div>

        {/* Selection Cards */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          {articles.length < 2 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Articles to Compare</h3>
              <p className="text-gray-500">Upload and analyze at least two articles to begin comparison</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Article 1 Selector */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm shadow-md">
                    1
                  </div>
                  First Article
                </label>
                <select
                  value={selectedArticle1}
                  onChange={(e) => setSelectedArticle1(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white hover:border-blue-300 text-gray-700"
                >
                  <option value="">Choose an article...</option>
                  {articles.map((article) => (
                    <option
                      key={article.id}
                      value={article.id}
                      disabled={article.id === selectedArticle2}
                    >
                      {article.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Article 2 Selector */}
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-md">
                    2
                  </div>
                  Second Article
                </label>
                <select
                  value={selectedArticle2}
                  onChange={(e) => setSelectedArticle2(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-indigo-300 text-gray-700"
                >
                  <option value="">Choose an article...</option>
                  {articles.map((article) => (
                    <option
                      key={article.id}
                      value={article.id}
                      disabled={article.id === selectedArticle1}
                    >
                      {article.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Results */}
        {article1 && article2 && (
          <div className="space-y-8">
            {/* Similarity Score Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Similarity Analysis</h2>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{getSimilarityLabel(similarityScore)}</span>
                      <span className="text-sm font-bold text-gray-700">{similarityScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${getSimilarityColor(similarityScore)} h-4 rounded-full transition-all duration-1000 ease-out shadow-md`}
                        style={{ width: `${similarityScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`text-5xl font-bold bg-gradient-to-r ${getSimilarityColor(similarityScore)} bg-clip-text text-transparent`}>
                    {similarityScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Details Comparison */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-gray-600" />
                  Article Details
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {/* Title */}
                <div className="grid md:grid-cols-3 gap-6 p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Title
                  </div>
                  <div className="text-gray-700 font-medium">{article1.title}</div>
                  <div className="text-gray-700 font-medium">{article2.title}</div>
                </div>

                {/* Authors */}
                <div className="grid md:grid-cols-3 gap-6 p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Authors
                  </div>
                  <div className="text-gray-600">
                    {article1.authors?.join(", ") || "Not specified"}
                  </div>
                  <div className="text-gray-600">
                    {article2.authors?.join(", ") || "Not specified"}
                  </div>
                </div>

                {/* Year & Pages */}
                <div className="grid md:grid-cols-3 gap-6 p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Year & Pages
                  </div>
                  <div className="text-gray-600">
                    {article1.publication_year || "—"} • {article1.pages || "—"} pages
                  </div>
                  <div className="text-gray-600">
                    {article2.publication_year || "—"} • {article2.pages || "—"} pages
                  </div>
                </div>

                {/* Abstract */}
                <div className="grid md:grid-cols-3 gap-6 p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Abstract
                  </div>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {article1.abstract || "Not available"}
                  </div>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {article2.abstract || "Not available"}
                  </div>
                </div>
              </div>
            </div>

            {/* Topics Comparison */}
            {topicsComp && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Tag className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Main Topics</h2>
                </div>

                {topicsComp.shared.length > 0 && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-bold text-emerald-800">
                        Shared Topics ({topicsComp.shared.length})
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topicsComp.shared.map((topic, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-sm font-medium shadow-sm border border-emerald-200 hover:shadow-md transition-shadow"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Unique to Article 1 */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs">1</div>
                      Unique Topics ({topicsComp.unique1.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topicsComp.unique1.length > 0 ? (
                        topicsComp.unique1.map((topic, i) => (
                          <span
                            key={i}
                            className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-medium shadow-sm border border-blue-200"
                          >
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-blue-600 text-sm italic">No unique topics</span>
                      )}
                    </div>
                  </div>

                  {/* Unique to Article 2 */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center text-white text-xs">2</div>
                      Unique Topics ({topicsComp.unique2.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topicsComp.unique2.length > 0 ? (
                        topicsComp.unique2.map((topic, i) => (
                          <span
                            key={i}
                            className="px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-medium shadow-sm border border-purple-200"
                          >
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-purple-600 text-sm italic">No unique topics</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords Comparison */}
            {keywordsComp && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Keywords</h2>
                </div>

                {keywordsComp.shared.length > 0 && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-bold text-emerald-800">
                        Shared Keywords ({keywordsComp.shared.length})
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywordsComp.shared.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-sm font-medium shadow-sm border border-emerald-200 hover:shadow-md transition-shadow"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Unique to Article 1 */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs">1</div>
                      Unique Keywords ({keywordsComp.unique1.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywordsComp.unique1.length > 0 ? (
                        keywordsComp.unique1.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-medium shadow-sm border border-blue-200"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-blue-600 text-sm italic">No unique keywords</span>
                      )}
                    </div>
                  </div>

                  {/* Unique to Article 2 */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center text-white text-xs">2</div>
                      Unique Keywords ({keywordsComp.unique2.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywordsComp.unique2.length > 0 ? (
                        keywordsComp.unique2.map((keyword, i) => (
                          <span
                            key={i}
                            className="px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-medium shadow-sm border border-purple-200"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-purple-600 text-sm italic">No unique keywords</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}