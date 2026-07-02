import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import WorkoutHeatmap from '../components/WorkoutHeatmap';

const Home = () => {
    const [isStarting, setIsStarting] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const navigate = useNavigate();

    const activeSessionId = localStorage.getItem('activeSessionId');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/workout/sessions');
                const completedSessions = response.data.filter(session => session.isCompleted);
                setHistory(completedSessions);
            } catch (error) {
                console.error('Failed to fetch workout history', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const handleStartSession = async () => {
        if (isStarting) return;
        setIsStarting(true);
        try {
            const response = await api.post('/workout/sessions', { notes: 'Session started from PWA' });
            localStorage.setItem('activeSessionId', response.data.data.sessionId);
            navigate('/catalog');
        } catch (error) {
            alert('Failed to start session.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        const isConfirmed = window.confirm("Are you sure you want to permanently delete this workout session? This action cannot be undone.");
        if (!isConfirmed) return;

        try {
            await api.delete(`/workout/sessions/${sessionId}`);
            setHistory(prev => prev.filter(session => session.id !== sessionId));
        } catch (error) {
            console.error('Failed to delete session', error);
            alert('Failed to delete workout session.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeSessionId');
        navigate('/login');
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const getUniqueMuscleGroups = (exercises) => {
        const groups = {};
        exercises.forEach(ex => {
            if (ex.muscleGroupName && !groups[ex.muscleGroupName]) {
                groups[ex.muscleGroupName] = { name: ex.muscleGroupName, iconKey: ex.muscleGroupIconKey };
            }
        });
        return Object.values(groups);
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden transition-colors">

            {/* Fixed Top Section */}
            <div className="flex-none p-4 pb-0 max-w-md w-full mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 text-center mt-6 mb-4 relative">
                    
                    {/* Logout Butonu (Sol Üst) */}
                    <button 
                        onClick={handleLogout} 
                        className="absolute top-5 left-5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                    >
                        Logout
                    </button>

                    {/* Manage Catalog Butonu (Sağ Üst) */}
                    <button 
                        onClick={() => navigate('/manage-catalog')} 
                        className="absolute top-5 right-5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                    >
                        Catalog +
                    </button>

                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2 tracking-tight mt-4">
                        Workout Tracker
                    </h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 tracking-[0.2em] uppercase opacity-80">
                        Zero Friction Environment
                    </p>

                    <button
                        onClick={activeSessionId ? () => navigate('/catalog') : handleStartSession}
                        disabled={isStarting}
                        className={`w-full font-bold py-4 rounded-xl transition-all ${activeSessionId
                            ? 'bg-orange-100/50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-2 border-orange-400/50'
                            : 'bg-blue-100/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50'}`}
                    >
                        {isStarting ? 'Starting...' : (activeSessionId ? 'Resume Active Session' : 'Start Session')}
                    </button>
                </div>

                {!isLoadingHistory && history.length > 0 && (
                    <div className="mb-4">
                        <WorkoutHeatmap history={history} />
                    </div>
                )}
            </div>

            {/* Scrollable History Section */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 max-w-md w-full mx-auto">
                <h3 className="text-sm font-black text-gray-600 dark:text-gray-200 mb-4 px-2 uppercase tracking-[0.15em]">
                    Recent Workouts
                </h3>

                {isLoadingHistory ? (
                    <div className="text-center py-10"><p className="text-gray-400 animate-pulse font-medium">Loading history...</p></div>
                ) : history.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center transition-colors">
                        <p className="text-gray-400">No workouts yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((session) => (
                            <div
                                key={session.id}
                                className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex items-center justify-between"
                            >
                                <div onClick={() => navigate(`/summary/${session.id}`)} className="flex-1 cursor-pointer active:opacity-60 transition-opacity">
                                    <p className="font-bold text-gray-600 dark:text-gray-200 mb-1">{formatDate(session.date)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {getUniqueMuscleGroups(session.exercises).map((mg, idx) => (
                                            <img key={idx} src={`/assets/icons/${mg.iconKey}.svg`} alt={mg.name} className="w-8 h-8 opacity-70 dark:invert" />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div onClick={() => navigate(`/summary/${session.id}`)} className="text-right cursor-pointer active:opacity-60 transition-opacity">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume</p>
                                        <p className="font-black text-blue-600 dark:text-blue-400">{session.totalVolumeKg} <span className="text-xs font-medium">kg</span></p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="w-10 h-10 flex-none flex items-center justify-center rounded-xl bg-red-50/50 dark:bg-red-950/30 text-red-500/70 dark:text-red-400/70 hover:bg-red-100 active:bg-red-200 transition-colors font-bold border border-red-100 dark:border-red-900/30"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;