import DashboardSidebar from '@/components/DashboardSidebar';
import TestCard from '@/components/TestCard';
import Link from 'next/link';

export default function Tests() {
  const tests = [
    { id: '1', title: 'Mathematics Quiz', duration: 30, questions: 20 },
    { id: '2', title: 'Science Test', duration: 45, questions: 30 },
    { id: '3', title: 'History Exam', duration: 60, questions: 40 },
    { id: '4', title: 'English Grammar', duration: 25, questions: 15 },
    { id: '5', title: 'Physics Challenge', duration: 50, questions: 25 },
    { id: '6', title: 'Chemistry Basics', duration: 40, questions: 20 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Available Tests</h1>
            <Link
              href="/tests/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create New Test
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestCard key={test.id} {...test} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
