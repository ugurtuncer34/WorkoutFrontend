import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/workout/sessions', { 
        notes: 'Session started from PWA' 
      });
      
      const sessionId = response.data.data.sessionId;
      localStorage.setItem('activeSessionId', sessionId);
      
      navigate('/catalog');
    } catch (error) {
      console.error('Session creation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Tracker</h1>
        <p className="text-gray-500 mb-10">Zero Friction Environment</p>
        
        <button 
          onClick={handleStartSession}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl active:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Starting...' : 'Start Session'}
        </button>
      </div>
    </div>
  );
};

export default Home;