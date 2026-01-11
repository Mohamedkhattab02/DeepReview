// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            📚
          </div>
          <h1 className="text-4xl font-black text-white">DeepReview</h1>
        </div>
        <p className="text-gray-400 text-sm">Academic Research Assistant</p>
      </div>

      {/* Content */}
      <main className="w-full">{children}</main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500">
        © 2024 DeepReview. All rights reserved.
      </footer>
    </div>
  );
}