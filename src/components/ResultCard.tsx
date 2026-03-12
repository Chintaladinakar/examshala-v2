interface ResultCardProps {
  testName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  attemptDate: string;
}

export default function ResultCard({
  testName,
  score,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  attemptDate,
}: ResultCardProps) {
  const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">{testName}</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-600 font-semibold">Score</p>
          <p className="text-2xl font-bold text-green-700">{score}/{totalQuestions}</p>
          <p className="text-sm text-green-600">{percentage}%</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-600 font-semibold">Correct</p>
          <p className="text-2xl font-bold text-blue-700">{correctAnswers}</p>
        </div>
      </div>
      <div className="space-y-2 text-gray-600">
        <p>❌ Wrong Answers: {wrongAnswers}</p>
        <p>📅 Attempted: {attemptDate}</p>
      </div>
    </div>
  );
}
