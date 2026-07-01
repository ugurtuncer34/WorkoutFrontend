import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { motion } from 'framer-motion';

const Logger = () => {
    const { exerciseId } = useParams();
    const navigate = useNavigate();

    const [exercise, setExercise] = useState(null);
    const [step, setStep] = useState('INIT');
    const [selectedReps, setSelectedReps] = useState(null);
    const [setNote, setSetNote] = useState('');
    const [loggedSets, setLoggedSets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sessionId = localStorage.getItem('activeSessionId');

    const repOptions = [4, 6, 8, 10, 12, 15, 20];
    const weightOptions = [5, 8, 10, 12, 16, 20];
    const durationOptions = [30, 45, 60, 90, 120];

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        const fetchExerciseData = async () => {
            try {
                const response = await api.get(`/catalog/exercises/${exerciseId}`);
                setExercise(response.data);

                if (response.data.type === 'DurationOnly') {
                    setStep('DURATION');
                } else {
                    setStep('REPS');
                }
            } catch (error) {
                console.error('Failed to fetch exercise', error);
            }
        };

        fetchExerciseData();
    }, [sessionId, exerciseId, navigate]);

    const handleSaveLog = async (payloadOverride = {}) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const currentSetNumber = loggedSets.length + 1;
        const payload = {
            workoutSessionId: parseInt(sessionId),
            exerciseId: parseInt(exerciseId),
            setNumber: currentSetNumber,
            notes: setNote || null,
            reps: null,
            weightKg: null,
            durationSeconds: null,
            ...payloadOverride
        };

        const optimisticSet = {
            id: null,
            setNumber: currentSetNumber,
            ...payloadOverride,
            notes: setNote || null,
            status: 'saving'
        };

        setLoggedSets((prev) => [...prev, optimisticSet]);

        try {
            const response = await api.post('/workout/logs', payload);
            const newLogId = response.data.data?.logId || response.data?.logId;

            setLoggedSets((prev) =>
                prev.map(s => s.setNumber === currentSetNumber ? { ...s, id: newLogId, status: 'saved' } : s)
            );
        } catch (error) {
            console.error('Failed to log set', error);
            setLoggedSets((prev) => prev.filter(s => s.setNumber !== currentSetNumber));
        } finally {
            setIsSubmitting(false);
            setSetNote('');

            if (exercise.type === 'DurationOnly') setStep('DURATION');
            else setStep('REPS');

            setSelectedReps(null);
        }
    };

    const handleDurationSelect = (seconds) => {
        handleSaveLog({ durationSeconds: seconds });
    };

    const handleRepSelect = (reps) => {
        if (exercise.type === 'RepsOnly') {
            handleSaveLog({ reps: reps });
        } else {
            setSelectedReps(reps);
            setStep('WEIGHT');
        }
    };

    const handleWeightSelect = (weight) => {
        handleSaveLog({ reps: selectedReps, weightKg: weight });
    };

    const handleDeleteSet = async (logId, setNumber) => {
        if (!logId) return;
        setLoggedSets((prev) => prev.filter(s => s.setNumber !== setNumber));
        try {
            await api.delete(`/workout/logs/${logId}`);
        } catch (error) {
            console.error('Failed to delete set', error);
        }
    };

    if (!exercise) return null;

    return (
        <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors overflow-hidden">
            <div className="flex-none px-4 pt-4">
                <div className="max-w-md w-full mx-auto pt-2">
                    <div className="flex items-center mb-6 gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-xl font-bold text-gray-800 dark:text-white transition-colors"
                        >
                            ←
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">{exercise.name}</h2>
                            <p className="text-xs font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-[0.15em]">Set {loggedSets.length + 1}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/30 dark:bg-blue-950/20 p-6 rounded-3xl shadow-sm border-2 border-blue-100/50 dark:border-blue-900/30 mb-6 flex flex-col transition-colors">
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Add notes for this set (optional)..."
                                value={setNote}
                                onChange={(e) => setSetNote(e.target.value)}
                                className="w-full bg-white/60 dark:bg-gray-900/50 border border-blue-200/50 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-blue-300/60 dark:placeholder-blue-700/60 font-medium"
                            />
                        </div>

                        <div>
                            {step === 'DURATION' && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                    <h3 className="text-sm font-black text-purple-600/70 dark:text-purple-400/70 uppercase tracking-[0.15em] mb-4 text-center">Duration (Seconds)</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {durationOptions.map((sec) => (
                                            <button key={`dur-${sec}`} disabled={isSubmitting} onClick={() => handleDurationSelect(sec)} className="bg-purple-100/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-2 border-purple-400/50 dark:border-purple-500/50 font-bold text-xl py-4 rounded-xl active:bg-purple-200 dark:active:bg-purple-900/60 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] disabled:opacity-50">
                                                {sec}s
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'REPS' && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <h3 className="text-sm font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-[0.15em] mb-4 text-center">Reps</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {repOptions.map((rep) => (
                                            <button key={`rep-${rep}`} disabled={isSubmitting} onClick={() => handleRepSelect(rep)} className="bg-blue-100/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50 dark:border-blue-500/50 font-bold text-xl py-4 rounded-xl active:bg-blue-200 dark:active:bg-blue-900/60 transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)] disabled:opacity-50">
                                                {rep}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'WEIGHT' && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => setStep('REPS')} className="text-blue-400/70 hover:text-blue-500 font-bold text-xl px-2 transition-colors">←</button>
                                        <h3 className="text-sm font-black text-green-600/70 dark:text-green-400/70 uppercase tracking-[0.15em]">Weight (kg)</h3>
                                        <div className="w-8"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {weightOptions.map((weight) => (
                                            <button key={`weight-${weight}`} disabled={isSubmitting} onClick={() => handleWeightSelect(weight)} className="bg-green-100/50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-2 border-green-400/50 dark:border-green-500/50 font-bold text-xl py-4 rounded-xl active:bg-green-200 dark:active:bg-green-900/60 transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)] disabled:opacity-50">
                                                {weight}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="max-w-md w-full mx-auto">
                    {loggedSets.length > 0 && (
                        <div className="mb-6 space-y-2">
                            <h4 className="text-[10px] font-black text-blue-500/60 dark:text-blue-400/50 uppercase tracking-[0.2em] mb-3 px-2">Completed Sets</h4>
                            {[...loggedSets].reverse().map((set) => (
                                <div key={set.setNumber} className="bg-white/80 dark:bg-gray-800/80 px-4 py-3 rounded-xl flex flex-col shadow-sm border border-blue-100/50 dark:border-blue-900/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 w-16">Set {set.setNumber}</span>
                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                            {set.durationSeconds ? (
                                                <span className="text-purple-600 dark:text-purple-400 font-bold">{set.durationSeconds}s</span>
                                            ) : (
                                                <>
                                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{set.reps} reps</span>
                                                    {set.weightKg != null && <span className="text-blue-600 dark:text-blue-400 font-black w-12 text-right">{set.weightKg}kg</span>}
                                                </>
                                            )}
                                            {set.status === 'saving' ? (
                                                <span className="text-blue-400 animate-pulse w-8 text-center text-xs font-bold uppercase tracking-wider">Wait</span>
                                            ) : (
                                                <button onClick={() => handleDeleteSet(set.id, set.setNumber)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50/50 dark:bg-red-950/30 text-red-500/70 dark:text-red-400/70 hover:bg-red-100 active:bg-red-200 transition-colors font-bold border border-red-100 dark:border-red-900/30">✕</button>
                                            )}
                                        </div>
                                    </div>
                                    {set.notes && (
                                        <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-2 font-medium bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                                            {set.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-none px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-md w-full mx-auto">
                    <button onClick={() => navigate(-1)} className="w-full bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400/50 dark:border-blue-500/50 font-bold py-4 rounded-xl outline-none transition-all active:bg-blue-100 dark:active:bg-blue-900/60">
                        Complete Exercise
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logger;