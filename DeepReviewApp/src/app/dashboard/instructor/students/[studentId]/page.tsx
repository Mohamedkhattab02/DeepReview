// src/app/(dashboard)/instructor/students/[studentId]/page.tsx
import { getStudentProgress, getAllStudents } from "@/actions/instructor";
import StudentDetailView from "@/components/instructor/StudentDetailView";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  // ✅ Await params first
  const { studentId } = await params;

  const [progress, students] = await Promise.all([
    getStudentProgress(studentId),
    getAllStudents(),
  ]);

  const student = students.find((s) => s.id === studentId);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/instructor/students"
          className="text-white hover:text-white dark:text-white dark:hover:text-white text-lg font-semibold bg-red-900 px-6 py-3 rounded-xl transition hover:bg-red-800 shadow-md">
        
          ← Back to Students
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {student.full_name}
        </h1>
        <p className="text-gray-600 mt-1">{student.email}</p>
      </div>

      <StudentDetailView
        student={student}
        sessions={progress}
      />
    </div>
  );
}
