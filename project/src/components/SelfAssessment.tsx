import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const SelfAssessment: React.FC<Props> = ({ onNext }) => {
  const [assessment, setAssessment] = useState({
    difficulty: 0,
    errors: 0,
    languageSwitching: 0,
    frustration: 0
  });

  const handleSubmit = () => {
    if (assessment.difficulty && assessment.errors && assessment.languageSwitching && assessment.frustration) {
      onNext({ selfAssessment: assessment });
    }
  };

  const labels = {
    difficulty: ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'],
    errors: ['Almost None', 'A Few', 'Normal', 'More Than Usual', 'Many'],
    languageSwitching: ['Smooth', 'Fairly Easy', 'OK', 'Slightly Confusing', 'Very Confusing'],
    frustration: ['Not Frustrated', 'Slightly', 'Normal', 'Quite Frustrated', 'Very Frustrated']
  };

  const isComplete = assessment.difficulty && assessment.errors && assessment.languageSwitching && assessment.frustration;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-5 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">How did you feel during the exercises?</h2>
        
        <div className="space-y-5">
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level:</label>
            <div className="flex justify-between items-center flex-wrap gap-1">
              {labels.difficulty.map((label, index) => (
                <button
                  key={index}
                  onClick={() => setAssessment({...assessment, difficulty: index + 1})}
                  className={`px-3 py-1.5 rounded-lg transition text-xs ${
                    assessment.difficulty === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Errors */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Errors Made:</label>
            <div className="flex justify-between items-center flex-wrap gap-1">
              {labels.errors.map((label, index) => (
                <button
                  key={index}
                  onClick={() => setAssessment({...assessment, errors: index + 1})}
                  className={`px-3 py-1.5 rounded-lg transition text-xs ${
                    assessment.errors === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Switching */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language Switching:</label>
            <div className="flex justify-between items-center flex-wrap gap-1">
              {labels.languageSwitching.map((label, index) => (
                <button
                  key={index}
                  onClick={() => setAssessment({...assessment, languageSwitching: index + 1})}
                  className={`px-3 py-1.5 rounded-lg transition text-xs ${
                    assessment.languageSwitching === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Frustration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Frustration:</label>
            <div className="flex justify-between items-center flex-wrap gap-1">
              {labels.frustration.map((label, index) => (
                <button
                  key={index}
                  onClick={() => setAssessment({...assessment, frustration: index + 1})}
                  className={`px-3 py-1.5 rounded-lg transition text-xs ${
                    assessment.frustration === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!isComplete && (
            <p className="text-xs text-orange-600 text-center">Please select an option for each category</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfAssessment;
