import React, { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
}

const PurchaseDecision: React.FC<Props> = ({ onNext }) => {
  const [rankedPriorities, setRankedPriorities] = useState<string[]>([]);
  const [purchase, setPurchase] = useState({
    whereToBuy: [] as string[],
    priceRange: ''
  });
  const [otherProblem, setOtherProblem] = useState('');

  const priorityOptions = [
    { id: 'savingTime', label: 'Saving 10+ minutes per day' },
    { id: 'reducingErrors', label: 'Reducing errors by 50%' },
    { id: 'lessFrustration', label: 'Less frustration' },
    { id: 'lookProfessional', label: 'Looking professional' },
    { id: 'typingSpeed', label: 'Typing speed' }
  ];

  const purchaseOptions = [
    'Manufacturer website',
    'Online marketplaces (Amazon/eBay)',
    'Physical store',
    'Large electronics store',
    'Other'
  ];

  const handlePriorityClick = (id: string) => {
    if (rankedPriorities.includes(id)) return;
    if (rankedPriorities.length < priorityOptions.length) {
      setRankedPriorities(prev => [...prev, id]);
    }
  };

  const resetPriorities = () => {
    setRankedPriorities([]);
  };

  const togglePurchaseOption = (option: string) => {
    setPurchase(prev => {
      const current = [...prev.whereToBuy];
      const index = current.indexOf(option);
      if (index > -1) {
        current.splice(index, 1);
      } else if (current.length < 2) {
        current.push(option);
      } else {
        current[1] = option; // Replace the second option
      }
      return { ...prev, whereToBuy: current };
    });
  };

  const handleSubmit = () => {
    const isFormValid = rankedPriorities.length === priorityOptions.length &&
                        purchase.whereToBuy.length > 0 &&
                        purchase.priceRange;

    if (isFormValid) {
      const prioritiesData = rankedPriorities.reduce((acc, id, index) => {
        acc[id] = index + 1;
        return acc;
      }, {} as {[key: string]: number});
      
      const purchaseDecisionData = {
        purchaseDecision: {
          priorities: prioritiesData,
          whereToBuy: purchase.whereToBuy,
          priceRange: purchase.priceRange,
          otherProblem: otherProblem
        }
      };
      onNext(purchaseDecisionData);
    }
  };

  const isPrioritiesSet = rankedPriorities.length === priorityOptions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Purchase Decision</h2>
        
        <div className="space-y-8">
          {/* Priority Ranking */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Rank by importance:
                </h3>
                <p className="text-sm text-gray-600">Click items in order of importance (1st click = #1)</p>
              </div>
              <button onClick={resetPriorities} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Reset Ranking</button>
            </div>
            <div className="space-y-3">
              {priorityOptions.map((option) => {
                const rank = rankedPriorities.indexOf(option.id) + 1;
                const isRanked = rank > 0;
                return (
                  <button 
                    key={option.id}
                    onClick={() => handlePriorityClick(option.id)}
                    className={`w-full p-4 rounded-lg text-left transition flex items-center space-x-4 ${
                      isRanked ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    disabled={isRanked}
                  >
                    {isRanked && (
                      <span className="w-8 h-8 flex-shrink-0 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {rank}
                      </span>
                    )}
                    <span className="flex-1">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {!isPrioritiesSet && (
              <p className="text-sm text-orange-600 mt-2">Please rank all {priorityOptions.length - rankedPriorities.length} remaining items</p>
            )}
          </div>

          {/* Where to Buy */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Where would you purchase?</h3>
            <p className="text-sm text-gray-600 mb-4">Select up to 2 options</p>
            <div className="grid grid-cols-2 gap-3">
              {purchaseOptions.map(option => {
                const isSelected = purchase.whereToBuy.includes(option);
                return (
                  <button key={option} onClick={() => togglePurchaseOption(option)} className={`p-3 rounded-lg transition ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">How much would you pay?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Up to $80', '$80-120', '$120-150', '$150-200', 'Over $200'].map(option => (
                <button key={option} onClick={() => setPurchase({...purchase, priceRange: option})} className={`p-3 rounded-lg transition ${purchase.priceRange === option ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Open Feedback */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Anything else that frustrates you? (Optional)</h3>
            <textarea value={otherProblem} onChange={(e) => setOtherProblem(e.target.value.slice(0, 500))} placeholder="Share any other challenges..." className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" rows={3} maxLength={500} />
          </div>

          <button onClick={handleSubmit} disabled={!isPrioritiesSet || !purchase.whereToBuy.length || !purchase.priceRange} className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            Complete Survey
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDecision;