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
            const response = await api.post('/workout/sessions', {
                notes: 'Session started from PWA'
            });

            const sessionId = response.data.data.sessionId;
            localStorage.setItem('activeSessionId', sessionId);

            navigate('/catalog');
        } catch (error) {
            console.error('Session creation failed', error);
            alert('Failed to start session.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleHistoryCardClick = (sessionId) => {
        navigate(`/summary/${sessionId}`);
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getUniqueMuscleGroups = (exercises) => {
        const groups = {};
        exercises.forEach(ex => {
            if (ex.muscleGroupName && !groups[ex.muscleGroupName]) {
                groups[ex.muscleGroupName] = {
                    name: ex.muscleGroupName,
                    iconKey: ex.muscleGroupIconKey
                };
            }
        });
        return Object.values(groups);
    };

    return (
        // dark:bg-gray-900 added to root
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4 transition-colors">

            {/* dark:bg-gray-800 added to header card */}
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-8 text-center mt-6 mb-8 transition-colors">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2 tracking-tight">
                    Workout Tracker
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 tracking-[0.2em] uppercase opacity-80">
                    Zero Friction Environment
                </p>

                {activeSessionId ? (
                    <button
                        onClick={() => navigate('/catalog')}
                        className="w-full bg-orange-100/50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-2 border-orange-400/50 dark:border-orange-500/50 font-bold py-4 rounded-xl active:bg-orange-200 dark:active:bg-orange-900/60 transition-all shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                    >
                        Resume Active Session
                    </button>
                ) : (
                    <button
                        onClick={handleStartSession}
                        disabled={isStarting}
                        className="w-full bg-blue-100/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50 dark:border-blue-500/50 font-bold py-4 rounded-xl active:bg-blue-200 dark:active:bg-blue-900/60 transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)] disabled:opacity-50"
                    >
                        {isStarting ? 'Starting...' : 'Start Session'}
                    </button>
                )}
            </div>

            <div className="w-full max-w-md flex-1">

                {!isLoadingHistory && history.length > 0 && (
                    <WorkoutHeatmap history={history} />
                )}

                <h3 className="text-sm font-black text-gray-600 dark:text-gray-200 mb-4 px-2 uppercase tracking-[0.15em]">
                    Recent Workouts
                </h3>

                {isLoadingHistory ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400 font-semibold animate-pulse">Loading history...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center transition-colors">
                        <p className="text-gray-500 dark:text-gray-400">No completed workouts yet.</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Start a session to build your history!</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-8">
                        {history.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => handleHistoryCardClick(session.id)}
                                className="w-full bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-left active:scale-95 transition-all flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-bold text-gray-600 dark:text-gray-200 mb-1">{formatDate(session.date)}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        {getUniqueMuscleGroups(session.exercises).map((mg, idx) => (
                                            mg.iconKey ? (
                                                <div key={idx} className="flex flex-col items-center">
                                                    {/* dark:invert added so black SVGs become white in dark mode */}
                                                    <img
                                                        src={`/assets/icons/${mg.iconKey}.svg`}
                                                        alt={mg.name}
                                                        className="w-8 h-8 object-contain opacity-70 dark:invert"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-0.5" style={{ display: 'none' }}>
                                                        {mg.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span key={idx} className="text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                    {mg.name}
                                                </span>
                                            )
                                        ))}
                                        {session.exercises.length === 0 && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">No exercises</span>
                                        )}
                                    </div>

                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Volume</p>
                                    <p className="font-black text-blue-600 dark:text-blue-400">{session.totalVolumeKg} <span className="text-xs font-medium">kg</span></p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;