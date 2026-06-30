import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Workout Tracker</h1>
        <p className="text-gray-500">Zero Friction Environment</p>
        
        <button className="mt-8 w-full bg-blue-600 text-white font-semibold py-4 rounded-xl active:bg-blue-700 transition-colors">
          Start Session
        </button>
      </div>
    </div>
  );
}

export default App;