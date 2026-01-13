// src/app/(dashboard)/instructor/students/[studentId]/page.tsx
import { getStudentProgress, getAllStudents } from "@/actions/instructor";
import StudentProgress from "@/components/instructor/StudentProgress";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: { studentId: string };
}) {
  const [progress, students] = await Promise.all([
    getStudentProgress(params.studentId),
    getAllStudents(),
  ]);

  const student = students.find((s) => s.id === params.studentId);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/instructor/students"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Students
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {student.full_name}
        </h1>
        <p className="text-gray-600 mt-1">{student.email}</p>
      </div>

      <StudentProgress
        sessions={progress}
        studentName={student.full_name}
      />
    </div>
  );
}