'use client';

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
}

export default function QuestionCard({
  questionNumber,
  question,
  options,
  selectedOption,
  onSelectOption,
}: QuestionCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Question {questionNumber}
      </h3>
      <p className="text-gray-700 mb-6">{question}</p>
      <div className="space-y-3">
        {options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selectedOption === index
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <input
              type="radio"
              name={`question-${questionNumber}`}
              checked={selectedOption === index}
              onChange={() => onSelectOption(index)}
              className="mr-3"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
