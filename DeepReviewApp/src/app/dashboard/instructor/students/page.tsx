// src/app/(dashboard)/instructor/students/page.tsx
import { getAllStudents } from "@/actions/instructor";
import StudentList from "@/components/instructor/StudentList";

export default async function StudentsPage() {
  const students = await getAllStudents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Students</h1>
        <p className="text-gray-600 mt-2">
          View and monitor all student progress
        </p>
      </div>

      <StudentList students={students} />
    </div>
  );
}
