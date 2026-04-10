'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';

export default function TestAttempt({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(5).fill(null));

  const mockTest = {
    id: params.id,
    title: 'Mathematics Quiz',
    duration: 30,
    questions: [
      {
        text: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
      },
      {
        text: 'What is the square root of 16?',
        options: ['2', '3', '4', '5'],
      },
      {
        text: 'What is 10 × 5?',
        options: ['40', '45', '50', '55'],
      },
      {
        text: 'What is 100 ÷ 4?',
        options: ['20', '25', '30', '35'],
      },
      {
        text: 'What is 15 - 7?',
        options: ['6', '7', '8', '9'],
      },
    ],
  };

  const handleSelectOption = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < mockTest.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Test submitted:', answers);
    alert('Test submitted successfully!');
    router.push('/results');
  };

  const handleTimeUp = () => {
    alert('Time is up! Submitting test...');
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{mockTest.title}</h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {mockTest.questions.length}
              </p>
            </div>
            <Timer duration={mockTest.duration} onTimeUp={handleTimeUp} />
          </div>
        </div>

        <QuestionCard
          questionNumber={currentQuestion + 1}
          question={mockTest.questions[currentQuestion].text}
          options={mockTest.questions[currentQuestion].options}
          selectedOption={answers[currentQuestion]}
          onSelectOption={handleSelectOption}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestion === mockTest.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">Question Progress:</p>
          <div className="flex gap-2 flex-wrap">
            {mockTest.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-semibold ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== null
                    ? 'bg-green-200 text-green-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
