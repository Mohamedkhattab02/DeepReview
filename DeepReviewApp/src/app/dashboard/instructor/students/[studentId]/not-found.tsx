// src/app/(dashboard)/instructor/students/[studentId]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="text-6xl">👤</div>
      <h2 className="text-2xl font-bold text-gray-900">Student Not Found</h2>
      <p className="text-gray-600">
        The student you're looking for doesn't exist.
      </p>
      <Link
        href="/dashboard/instructor/students"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Back to Students
      </Link>
    </div>
  );
}