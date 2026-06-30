import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion'; // Added Framer Motion

const Summary = () => {
    const { sessionId } = useParams();
    const [sessionData, setSessionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedExercises, setExpandedExercises] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get(`/workout/sessions/${sessionId}`);
                setSessionData(response.data);
            } catch (error) {
                console.error('Failed to fetch session summary', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, [sessionId]);

    const handleGoHome = () => {
        navigate('/');
    };

    const toggleExercise = (exerciseId) => {
        setExpandedExercises((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(exerciseId)) {
                newSet.delete(exerciseId);
            } else {
                newSet.add(exerciseId);
            }
            return newSet;
        });
    };

    const groupExercisesByTarget = (exercises) => {
        return exercises.reduce((acc, ex) => {
            const target = ex.targetMuscleName || 'Other';
            if (!acc[target]) {
                acc[target] = [];
            }
            acc[target].push(ex);
            return acc;
        }, {});
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full pt-40">
                <p className="text-gray-500 font-semibold animate-pulse">Generating summary...</p>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-40 text-center px-4">
                <p className="text-gray-500">Summary not found. Please return home.</p>
                <button onClick={handleGoHome} className="mt-4 text-blue-600 font-bold">Go Home</button>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="max-w-md w-full mx-auto pt-10 flex-1 flex flex-col">

                {/* Success Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <span className="text-4xl">🏆</span>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h2>
                    <p className="text-gray-500">Great job today.</p>
                </div>

                {/* Stats Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <div className="text-center mb-6">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Volume</p>
                        <p className="text-4xl font-black text-blue-600">{sessionData.totalVolumeKg} <span className="text-xl text-blue-400">kg</span></p>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 text-center">Exercises Performed</h4>

                        {sessionData.exercises.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center">No exercises logged.</p>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupExercisesByTarget(sessionData.exercises)).map(([targetName, exercises]) => (
                                    <div key={targetName} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{targetName}</h5>
                                        <div className="space-y-3">

                                            {exercises.map((ex) => {
                                                const isExpanded = expandedExercises.has(ex.exerciseId);

                                                return (
                                                    <div key={ex.exerciseId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                                        <button
                                                            onClick={() => toggleExercise(ex.exerciseId)}
                                                            className="w-full flex items-center justify-between p-4 outline-none"
                                                        >
                                                            <span className="text-gray-700 font-medium">{ex.exerciseName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-gray-500 text-xs font-bold bg-gray-50 px-2 py-1 rounded">
                                                                    {ex.sets.length} sets
                                                                </span>
                                                                <motion.span
                                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="text-gray-400 text-xs inline-block"
                                                                >
                                                                    ▼
                                                                </motion.span>
                                                            </div>
                                                        </button>

                                                        {/* Animated Accordion Content */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 space-y-2">
                                                                        {ex.sets.map((set) => (
                                                                            <div key={set.id} className="flex justify-between items-center text-sm">
                                                                                <span className="text-gray-500 font-medium">Set {set.setNumber}</span>
                                                                                <div className="text-right">
                                                                                    <span className="text-gray-700 font-medium">{set.reps} reps</span>
                                                                                    <span className="text-gray-400 mx-2">@</span>
                                                                                    <span className="text-gray-900 font-bold">{set.weightKg} kg</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                    </div>
                                                );
                                            })}

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoHome}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl mt-auto outline-none"
                >
                    Back to Home
                </motion.button>

            </div>
        </div>
    );
};

export default Summary;