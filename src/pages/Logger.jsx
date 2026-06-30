import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';

const Logger = () => {
    const { exerciseId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState('REPS');
    const [selectedReps, setSelectedReps] = useState(null);
    const [loggedSets, setLoggedSets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sessionId = localStorage.getItem('activeSessionId');

    const repOptions = [5, 6, 8, 10, 12, 15, 20];
    const weightOptions = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 25, 30, 40, 50];

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
        }
    }, [sessionId, navigate]);

    const handleRepSelect = (reps) => {
        setSelectedReps(reps);
        setStep('WEIGHT');
    };

    const handleWeightSelect = async (weight) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const currentSetNumber = loggedSets.length + 1;

        const newSet = {
            id: null,
            setNumber: currentSetNumber,
            reps: selectedReps,
            weightKg: weight,
            status: 'saving'
        };

        setLoggedSets((prev) => [...prev, newSet]);

        try {
            const payload = {
                workoutSessionId: parseInt(sessionId),
                exerciseId: parseInt(exerciseId),
                setNumber: currentSetNumber,
                reps: selectedReps,
                weightKg: weight
            };

            const response = await api.post('/workout/logs', payload);
            const newLogId = response.data.data.logId;

            setLoggedSets((prev) =>
                prev.map(s => s.setNumber === currentSetNumber ? { ...s, id: newLogId, status: 'saved' } : s)
            );

        } catch (error) {
            console.error('Failed to log set', error);
            setLoggedSets((prev) => prev.filter(s => s.setNumber !== currentSetNumber));
            alert('Failed to save set. Please try again.');
        } finally {
            setIsSubmitting(false);
            setStep('REPS');
            setSelectedReps(null);
        }
    };

    const handleDeleteSet = async (logId, setNumber) => {
        if (!logId) return;

        setLoggedSets((prev) => prev.filter(s => s.setNumber !== setNumber));

        try {
            await api.delete(`/workout/logs/${logId}`);
        } catch (error) {
            console.error('Failed to delete set', error);
            alert('Failed to delete set. Please refresh your session.');
        }
    };

    const handleBackToExercises = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col transition-colors">
            <div className="max-w-md w-full mx-auto pt-6 flex-1 flex flex-col">

                <div className="flex items-center mb-8 gap-4">
                    <button
                        onClick={handleBackToExercises}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm active:bg-gray-100 dark:active:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 text-xl font-bold text-gray-800 dark:text-white"
                    >
                        ←
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Your Set</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Set {loggedSets.length + 1}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex-1 transition-colors">
                    {step === 'REPS' ? (
                        <div className="animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">How many reps?</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {repOptions.map((rep) => (
                                    <button
                                        key={`rep-${rep}`}
                                        onClick={() => handleRepSelect(rep)}
                                        className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold text-xl py-4 rounded-2xl active:bg-blue-100 dark:active:bg-blue-900/60 transition-all"
                                    >
                                        {rep}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setStep('REPS')}
                                    className="text-gray-400 dark:text-gray-500 font-bold text-xl active:text-gray-600 px-2"
                                >
                                    ←
                                </button>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Weight (kg)?</h3>
                                <div className="w-8"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {weightOptions.map((weight) => (
                                    <button
                                        key={`weight-${weight}`}
                                        onClick={() => handleWeightSelect(weight)}
                                        disabled={isSubmitting}
                                        className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-bold text-xl py-4 rounded-2xl active:bg-green-100 dark:active:bg-green-900/60 transition-all disabled:opacity-50"
                                    >
                                        {weight}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {loggedSets.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">Completed Sets</h4>
                        <div className="space-y-2">
                            {loggedSets.map((set) => (
                                <div key={set.setNumber} className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm border border-gray-50 dark:border-gray-700 transition-colors">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 w-16">Set {set.setNumber}</span>
                                    <div className="flex items-center gap-4 flex-1 justify-end">
                                        <span className="text-gray-600 dark:text-gray-400">{set.reps} reps</span>
                                        <span className="text-gray-600 dark:text-gray-300 font-bold w-12 text-right">{set.weightKg}kg</span>

                                        {set.status === 'saving' ? (
                                            <span className="text-yellow-500 animate-pulse w-8 text-center">...</span>
                                        ) : (
                                            <button
                                                onClick={() => handleDeleteSet(set.id, set.setNumber)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 active:bg-red-200 transition-colors font-bold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleBackToExercises}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold py-4 rounded-xl active:bg-gray-800 dark:active:bg-gray-200 transition-colors mt-auto"
                >
                    Complete Exercise
                </button>

            </div>
        </div>
    );
};

export default Logger;