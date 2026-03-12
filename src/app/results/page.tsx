import DashboardSidebar from '@/components/DashboardSidebar';
import ResultCard from '@/components/ResultCard';

export default function Results() {
  const results = [
    {
      testName: 'Mathematics Quiz',
      score: 18,
      totalQuestions: 20,
      correctAnswers: 18,
      wrongAnswers: 2,
      attemptDate: 'March 10, 2026',
    },
    {
      testName: 'Science Test',
      score: 25,
      totalQuestions: 30,
      correctAnswers: 25,
      wrongAnswers: 5,
      attemptDate: 'March 8, 2026',
    },
    {
      testName: 'History Exam',
      score: 32,
      totalQuestions: 40,
      correctAnswers: 32,
      wrongAnswers: 8,
      attemptDate: 'March 5, 2026',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Test Results</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <ResultCard key={index} {...result} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
