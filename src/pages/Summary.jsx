import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

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
                <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse">Generating summary...</p>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-40 text-center px-4">
                <p className="text-gray-500 dark:text-gray-400">Summary not found. Please return home.</p>
                <button onClick={handleGoHome} className="mt-4 text-blue-600 dark:text-blue-400 font-bold">Go Home</button>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="max-w-md w-full mx-auto pt-10 flex-1 flex flex-col">

                {/* Success Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(37,99,235,0.2)] dark:shadow-[0_0_25px_rgba(59,130,246,0.15)]"
                    >
                        <span className="text-5xl">🏆</span>
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-200 mb-2 tracking-tight">
                        Workout Complete!
                    </h2>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em] opacity-80">
                        Great job today.
                    </p>
                </div>

                {/* Stats Card */}
                <div className="bg-blue-50/30 dark:bg-blue-950/20 p-6 rounded-3xl shadow-sm border-2 border-blue-100/50 dark:border-blue-900/30 mb-6 transition-colors">
                    <div className="text-center mb-6">
                        <p className="text-sm font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-[0.15em] mb-1">Total Volume</p>
                        <p className="text-5xl font-black text-blue-600 dark:text-blue-300 tracking-tight">
                            {sessionData.totalVolumeKg} <span className="text-xl text-blue-400 dark:text-blue-500 font-bold">kg</span>
                        </p>
                    </div>

                    <div className="border-t border-blue-200/50 dark:border-blue-800/30 pt-6 transition-colors">
                        <h4 className="text-sm font-black text-blue-600/70 dark:text-blue-400/70 mb-4 text-center uppercase tracking-[0.15em]">
                            Exercises Performed
                        </h4>

                        {sessionData.exercises.length === 0 ? (
                            <p className="text-blue-400/60 dark:text-blue-500/50 text-sm text-center font-medium">No exercises logged.</p>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupExercisesByTarget(sessionData.exercises)).map(([targetName, exercises]) => (
                                    <div key={targetName} className="bg-white/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 transition-colors">
                                        <h5 className="text-[10px] font-black text-blue-500/60 dark:text-blue-400/50 uppercase tracking-[0.2em] mb-3">
                                            {targetName}
                                        </h5>
                                        <div className="space-y-3">
                                            {exercises.map((ex) => {
                                                const isExpanded = expandedExercises.has(ex.exerciseId);
                                                return (
                                                    <div key={ex.exerciseId} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 overflow-hidden transition-all">
                                                        <button
                                                            onClick={() => toggleExercise(ex.exerciseId)}
                                                            className="w-full flex items-center justify-between p-4 outline-none active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors"
                                                        >
                                                            <span className="text-gray-700 dark:text-gray-200 font-bold">{ex.exerciseName}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                                    {ex.sets.length} sets
                                                                </span>
                                                                <motion.span
                                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="text-blue-400 text-xs inline-block"
                                                                >
                                                                    ▼
                                                                </motion.span>
                                                            </div>
                                                        </button>

                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/10 border-t border-blue-100 dark:border-blue-900/30 space-y-2 transition-colors">
                                                                        {ex.sets.map((set) => (
                                                                            <div key={set.id} className="flex flex-col py-2 border-b border-blue-100/30 dark:border-blue-900/30 last:border-0 transition-colors">
                                                                                <div className="flex justify-between items-center text-sm font-medium">
                                                                                    <span className="text-blue-400/80">Set {set.setNumber}</span>
                                                                                    <div className="text-right">
                                                                                        {set.durationSeconds ? (
                                                                                            <span className="text-purple-500 dark:text-purple-400 font-bold">{set.durationSeconds}s</span>
                                                                                        ) : (
                                                                                            <>
                                                                                                <span className="text-gray-600 dark:text-gray-300">{set.reps} reps</span>
                                                                                                {set.weightKg != null && (
                                                                                                    <>
                                                                                                        <span className="text-blue-300 mx-2">@</span>
                                                                                                        <span className="text-gray-900 dark:text-white font-black">{set.weightKg} kg</span>
                                                                                                    </>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {set.notes && (
                                                                                    <p className="text-xs text-blue-500/70 dark:text-blue-400/60 mt-1 italic">
                                                                                        "{set.notes}"
                                                                                    </p>
                                                                                )}
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
                    className="w-full bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50 dark:border-blue-500/50 font-bold py-4 rounded-xl mt-auto shadow-[0_0_15px_rgba(37,99,235,0.15)] outline-none transition-all active:bg-blue-100 dark:active:bg-blue-900/60"
                >
                    Back to Home
                </motion.button>

            </div>
        </div>
    );
};

export default Summary;