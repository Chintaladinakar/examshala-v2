import Link from 'next/link';

interface TestCardProps {
  id: string;
  title: string;
  duration: number;
  questions: number;
}

export default function TestCard({ id, title, duration, questions }: TestCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <div className="space-y-2 mb-4 text-gray-600">
        <p>⏱️ Duration: {duration} minutes</p>
        <p>❓ Questions: {questions}</p>
      </div>
      <Link
        href={`/tests/${id}`}
        className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Start Test
      </Link>
    </div>
  );
}
