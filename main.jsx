import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dna, Coffee, PlusCircle, Trash2 } from 'lucide-react';

// --- Pre-defined Drink Data ---
const popularDrinks = {
  'Select a drink...': 0,
  'Starbucks - Pike Place Roast (Grande, 16oz)': 310,
  'Starbucks - Blonde Roast (Grande, 16oz)': 360,
  'Starbucks - Cold Brew (Grande, 16oz)': 205,
  'Starbucks - Iced Coffee (Grande, 16oz)': 165,
  'Starbucks - Espresso Shot': 75,
  'Dunkin\' - Original Blend (Medium, 14oz)': 210,
  'Dunkin\' - Cold Brew (Medium, 24oz)': 260,
  'Dunkin\' - Espresso Shot': 98,
  'Monster Energy (16oz)': 160,
  'Red Bull (8.4oz)': 80,
  'Diet Coke (12oz)': 46,
  'Black Tea (8oz)': 47,
  'Green Tea (8oz)': 28,
};

// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [selectedDrink, setSelectedDrink] = useState('Select a drink...');
  const [customAmount, setCustomAmount] = useState('');
  const [chartData, setChartData] = useState([]);
  const [liveCaffeineLevel, setLiveCaffeineLevel] = useState(0);
  const [halfLife] = useState(5); // Average half-life in hours

  // --- Core Logic: Calculate Caffeine Level ---
  const calculateCaffeineAtTime = (targetTime, history, hf) => {
    return history.reduce((total, intake) => {
      const timeElapsedHours = (targetTime.getTime() - new Date(intake.time).getTime()) / (1000 * 60 * 60);
      if (timeElapsedHours < 0) return total;

      const remainingCaffeine = intake.amount * Math.pow(0.5, timeElapsedHours / hf);
      return total + remainingCaffeine;
    }, 0);
  };

  // --- Effect for Live Ticker ---
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      const currentLevel = calculateCaffeineAtTime(new Date(), intakeHistory, halfLife);
      setLiveCaffeineLevel(currentLevel);
    }, 1000); // Update every second

    return () => clearInterval(tickerInterval);
  }, [intakeHistory, halfLife]);


  // --- Effect to Update Chart Data ---
  useEffect(() => {
    if (intakeHistory.length === 0) {
      setChartData([]);
      return;
    }

    const generateChartData = () => {
      const data = [];
      const now = new Date();
      const startTime = intakeHistory.length > 0 ? new Date(intakeHistory[0].time) : now;
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      // More precise curve: calculate every 5 minutes
      for (let t = new Date(startTime.getTime()); t <= endTime; t.setMinutes(t.getMinutes() + 5)) {
        // Show data from up to 1 hour before the first drink
        if (t < new Date(startTime.getTime() - 1 * 60 * 60 * 1000)) continue;
        
        const caffeineLevel = calculateCaffeineAtTime(t, intakeHistory, halfLife);
        data.push({
          time: new Date(t).getTime(),
          'Caffeine (mg)': parseFloat(caffeineLevel.toFixed(2)),
        });
      }
      setChartData(data);
    };

    generateChartData();
    // No need for an interval here as the graph only needs to regenerate when intake changes.
    // The live ticker handles the real-time view.

  }, [intakeHistory, halfLife]);

  // --- Event Handlers ---
  const handleAddIntake = () => {
    const amount = customAmount ? parseFloat(customAmount) : popularDrinks[selectedDrink] || 0;
    if (amount > 0) {
      const newIntake = {
        id: Date.now(),
        time: new Date().toISOString(),
        amount: amount,
        name: customAmount ? 'Custom' : selectedDrink.split(' - ')[1] || selectedDrink,
      };
      const sortedHistory = [...intakeHistory, newIntake].sort((a, b) => new Date(a.time) - new Date(b.time));
      setIntakeHistory(sortedHistory);
      setCustomAmount('');
      setSelectedDrink('Select a drink...');
    }
  };
  
  const handleRemoveIntake = (id) => {
      setIntakeHistory(intakeHistory.filter(intake => intake.id !== id));
  }

  const handleDrinkChange = (e) => {
    setSelectedDrink(e.target.value);
    setCustomAmount('');
  };
  
  const handleCustomAmountChange = (e) => {
      setCustomAmount(e.target.value);
      setSelectedDrink('Select a drink...');
  }

  // --- UI Rendering ---
  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-tight">Caffeine Tracker</h1>
          <p className="text-slate-400 mt-2 text-lg">Visualize your caffeine levels over time.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Controls & Info */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Intake Form */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-2xl font-semibold mb-4 flex items-center"><Coffee className="mr-3 text-cyan-400"/>Add Intake</h2>
              <div className="space-y-4">
                <select 
                  value={selectedDrink}
                  onChange={handleDrinkChange}
                  className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  {Object.entries(popularDrinks).map(([name, amount]) => (
                    <option key={name} value={name}>{name}{amount > 0 ? ` (${amount}mg)` : ''}</option>
                  ))}
                </select>
                
                <div className="flex items-center">
                  <hr className="flex-grow border-slate-600"/>
                  <span className="px-2 text-slate-400">OR</span>
                  <hr className="flex-grow border-slate-600"/>
                </div>

                <input 
                  type="number"
                  placeholder="Enter custom mg"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button 
                  onClick={handleAddIntake}
                  disabled={!customAmount && popularDrinks[selectedDrink] === 0}
                  className="w-full flex items-center justify-center p-3 bg-cyan-600 hover:bg-cyan-500 rounded-md font-bold text-white transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="mr-2"/> Add
                </button>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">Current Status</h3>
                <p className="text-3xl font-bold tabular-nums">{liveCaffeineLevel.toFixed(3)} mg</p>
                <p className="text-slate-400">Estimated in your system right now.</p>
                <div className="mt-4 text-sm flex items-start">
                    <Dna size={20} className="mr-3 mt-1 text-cyan-400 flex-shrink-0"/>
                    <p className="text-slate-400">Calculations are based on an average caffeine half-life of <span className="font-bold text-white">{halfLife} hours</span>. This can vary based on genetics, age, and liver health.</p>
                </div>
            </div>

            {/* Intake History */}
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Intake History</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {intakeHistory.length > 0 ? intakeHistory.map(intake => (
                        <div key={intake.id} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                            <div>
                                <p className="font-semibold">{intake.name}</p>
                                <p className="text-sm text-slate-400">{new Date(intake.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {intake.amount} mg</p>
                            </div>
                            <button onClick={() => handleRemoveIntake(intake.id)} className="text-red-500 hover:text-red-400 p-1">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    )).reverse() : <p className="text-slate-400">No drinks added yet.</p>}
                </div>
            </div>

          </div>
          
          {/* Right Column: Chart */}
          <div className="lg:col-span-2 bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700 min-h-[500px]">
            <h2 className="text-2xl font-semibold mb-4 text-center">Caffeine Decay Curve</h2>
            {intakeHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    stroke="#94a3b8"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" label={{ value: 'Caffeine (mg)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#cbd5e1' }}
                    formatter={(value, name, props) => [`${value} mg`, 'Caffeine Level']}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                  />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="Caffeine (mg)" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Coffee size={48} className="mb-4"/>
                  <p className="text-xl">Your chart will appear here.</p>
                  <p>Add a drink to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
