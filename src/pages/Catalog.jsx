import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import IconCard from '../components/IconCard';

const Catalog = () => {
    const [muscleGroups, setMuscleGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
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

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
    };

    const handleTargetMuscleClick = (targetMuscleId) => {
        navigate(`/exercises/${targetMuscleId}`);
    };

    const handleBack = () => {
        setSelectedGroup(null);
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
                {!selectedGroup ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Muscle Group</h2>

                        <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                            {muscleGroups.map((group) => (
                                <IconCard
                                    key={group.id}
                                    name={group.name}
                                    iconKey={group.iconKey}
                                    onClick={() => handleGroupClick(group)}
                                />
                            ))}
                        </div>

                        <div className="mt-8 space-y-3">
                            <button
                                onClick={handleCompleteSession}
                                disabled={isCompleting || isCancelling}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl active:bg-green-700 transition-colors disabled:opacity-50"
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
                    </>
                ) : (
                    <>
                        <div className="flex items-center mb-6 gap-4">
                            <button
                                onClick={handleBack}
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm active:bg-gray-100 dark:active:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 text-xl font-bold text-gray-800 dark:text-white"
                            >
                                ←
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedGroup.name}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 content-start">
                            {selectedGroup.targetMuscles.map((target) => (
                                <IconCard
                                    key={target.id}
                                    name={target.name}
                                    iconKey={target.iconKey}
                                    onClick={() => handleTargetMuscleClick(target.id)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Catalog;