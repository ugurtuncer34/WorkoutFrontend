import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import IconCard from '../components/IconCard';

const Catalog = () => {
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const navigate = useNavigate();

    const sessionId = localStorage.getItem('activeSessionId');

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        const fetchCatalog = async () => {
            try {
                const response = await api.get('/catalog/muscle-groups');
                setMuscleGroups(response.data);
            } catch (error) {
                console.error('Failed to fetch catalog', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCatalog();
    }, [sessionId, navigate]);

    const handleGroupClick = (groupId) => {
        navigate(`/exercises/${groupId}`);
    };

    const handleCompleteSession = async () => {
        if (isCompleting || !sessionId) return;
        setIsCompleting(true);

        try {
            await api.put(`/workout/sessions/${sessionId}/complete`);
            localStorage.removeItem('activeSessionId');
            navigate(`/summary/${sessionId}`);
        } catch (error) {
            console.error('Failed to complete session', error);
            alert('Failed to complete session. Please try again.');
            setIsCompleting(false);
        }
    };

    const handleCancelSession = async () => {
        if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
            setIsCancelling(true);
            try {
                await api.delete(`/workout/sessions/${sessionId}/cancel`);
                localStorage.removeItem('activeSessionId');
                navigate('/');
            } catch (error) {
                console.error('Failed to cancel session', error);
                alert('Failed to cancel session.');
                setIsCancelling(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
                <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse">Loading catalog...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col transition-colors">
            <div className="max-w-md w-full mx-auto pt-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Muscle Group</h2>

                <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                    {muscleGroups.map((group) => (
                        <IconCard
                            key={group.id}
                            name={group.name}
                            iconKey={group.iconKey}
                            onClick={() => handleGroupClick(group.id)}
                        />
                    ))}
                </div>

                <div className="mt-8 space-y-3">
                    <button
                        onClick={handleCompleteSession}
                        disabled={isCompleting || isCancelling}
                        className="w-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 font-bold py-4 rounded-xl active:bg-green-100 dark:active:bg-green-900/30 transition-colors disabled:opacity-50 border border-green-200 dark:border-green-900/30"
                    >
                        {isCompleting ? 'Completing...' : 'Finish Workout'}
                    </button>

                    <button
                        onClick={handleCancelSession}
                        disabled={isCompleting || isCancelling}
                        className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl active:bg-red-100 dark:active:bg-red-900/30 transition-colors disabled:opacity-50 border border-red-100 dark:border-red-900/30"
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel Session'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Catalog;