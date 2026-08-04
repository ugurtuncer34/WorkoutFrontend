import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';
import LastPerformanceCard from '../components/LastPerformanceCard';
import WorkoutPlanDrawer from '../components/WorkoutPlanDrawer';
import useWorkoutPlan, { WORKOUT_EXERCISE_STATUS } from '../hooks/useWorkoutPlan';
import { getActiveSession } from '../utils/activeSession';

const Logger = () => {
    const { exerciseId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { sessionId, mode: activeSessionMode } = getActiveSession();
    const sessionExerciseParam = searchParams.get('sessionExerciseId');
    const parsedSessionExerciseId = Number(sessionExerciseParam);
    const hasValidSessionExerciseId = sessionExerciseParam != null && Number.isInteger(parsedSessionExerciseId) && parsedSessionExerciseId > 0;
    const isTemplateSession = activeSessionMode === 'template' || sessionExerciseParam != null;
    const sessionExerciseId = hasValidSessionExerciseId ? parsedSessionExerciseId : null;

    const [exercise, setExercise] = useState(null);
    const [isLoadingExercise, setIsLoadingExercise] = useState(true);
    const [step, setStep] = useState('INIT');
    const [selectedReps, setSelectedReps] = useState(null);
    const [setNote, setSetNote] = useState('');
    const [loggedSets, setLoggedSets] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loggerError, setLoggerError] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [pendingExerciseId, setPendingExerciseId] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const initializedPlanSetsRef = useRef('');

    const { plan, loading: isLoadingPlan, error: planError, refetch, updateStatus } = useWorkoutPlan(
        sessionId,
        { enabled: isTemplateSession && hasValidSessionExerciseId }
    );

    const currentPlanExercise = useMemo(() => plan?.exercises?.find(
        (item) => String(item.sessionExerciseId) === String(sessionExerciseId)
    ) || null, [plan, sessionExerciseId]);

    const orderedExercises = plan?.exercises || [];
    const currentPosition = currentPlanExercise
        ? orderedExercises.findIndex((item) => item.sessionExerciseId === currentPlanExercise.sessionExerciseId) + 1
        : 0;
    const canLogTemplateSet = Boolean(currentPlanExercise && ['Planned', 'InProgress'].includes(currentPlanExercise.status));
    const nextDisplayedSetNumber = isTemplateSession
        ? loggedSets.reduce((highest, set) => Math.max(highest, Number(set.setNumber) || 0), 0) + 1
        : loggedSets.length + 1;

    const repOptions = [4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20];
    const weightOptions = [5, 8, 10, 12, 16, 20];
    const durationOptions = [30, 35, 40, 45, 50, 55, 60, 90, 120];

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        let active = true;
        setIsLoadingExercise(true);
        setExercise(null);
        setLoggedSets([]);
        setLoggerError('');
        initializedPlanSetsRef.current = '';

        api.get(`/catalog/exercises/${exerciseId}`)
            .then((response) => {
                if (!active) return;
                setExercise(response.data);
                setStep(response.data.type === 'DurationOnly' ? 'DURATION' : 'REPS');
            })
            .catch((error) => {
                console.error('Failed to fetch exercise', error);
                if (active) setLoggerError(getApiErrorMessage(error, 'Unable to load this exercise.'));
            })
            .finally(() => {
                if (active) setIsLoadingExercise(false);
            });

        return () => { active = false; };
    }, [sessionId, exerciseId, navigate, sessionExerciseId]);

    useEffect(() => {
        if (!isTemplateSession || !currentPlanExercise) return;
        const initializationKey = `${sessionId}:${currentPlanExercise.sessionExerciseId}`;
        if (initializedPlanSetsRef.current === initializationKey) return;

        setLoggedSets([...(currentPlanExercise.sets || [])]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => ({
                ...set,
                id: set.id ?? set.logId,
                status: 'saved'
            })));
        initializedPlanSetsRef.current = initializationKey;
    }, [currentPlanExercise, isTemplateSession, sessionId]);

    const nextAvailableExercise = (updatedPlan, currentExercise) => {
        const exercises = updatedPlan?.exercises || [];
        return exercises.find((item) => (
            item.position > currentExercise.position && ['Planned', 'InProgress'].includes(item.status)
        ));
    };

    const navigateToPlanExercise = (planExercise, options) => {
        navigate(`/logger/${planExercise.exerciseId}?sessionExerciseId=${planExercise.sessionExerciseId}`, options);
    };

    const planSetsFor = (updatedPlan) => updatedPlan?.exercises?.find(
        (item) => String(item.sessionExerciseId) === String(sessionExerciseId)
    )?.sets || [];

    const replaceLoggedSetsFromPlan = (updatedPlan) => {
        const planSets = planSetsFor(updatedPlan);
        setLoggedSets([...planSets]
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => ({ ...set, id: set.id ?? set.logId, status: 'saved' })));
    };

    const handleSaveLog = async (payloadOverride = {}) => {
        if (isSubmitting || !exercise) return;
        if (isTemplateSession && !canLogTemplateSet) {
            setLoggerError(currentPlanExercise?.status === 'Skipped'
                ? 'Restore this skipped exercise before logging another set.'
                : 'Reopen this completed exercise before logging another set.');
            return;
        }

        setIsSubmitting(true);
        setLoggerError('');
        const currentSetNumber = isTemplateSession
            ? loggedSets.reduce((highest, set) => Math.max(highest, Number(set.setNumber) || 0), 0) + 1
            : loggedSets.length + 1;
        const payload = {
            workoutSessionId: parseInt(sessionId),
            exerciseId: parseInt(exerciseId),
            ...(isTemplateSession ? { workoutSessionExerciseId: sessionExerciseId } : {}),
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
        setLoggedSets((previous) => [...previous, optimisticSet]);

        try {
            const response = await api.post('/workout/logs', payload);
            const newLogId = response.data.data?.logId || response.data?.logId;
            setLoggedSets((previous) => previous.map((set) => (
                set.setNumber === currentSetNumber ? { ...set, id: newLogId, status: 'saved' } : set
            )));
            if (isTemplateSession) {
                const updatedPlan = await refetch({ silent: true }).catch(() => null);
                const linkedSet = planSetsFor(updatedPlan).find((set) => set.setNumber === currentSetNumber);
                const linkedLogId = newLogId || linkedSet?.id || linkedSet?.logId;
                if (linkedLogId) {
                    setLoggedSets((previous) => previous.map((set) => (
                        set.setNumber === currentSetNumber ? { ...set, id: linkedLogId, status: 'saved' } : set
                    )));
                }
            }
        } catch (error) {
            console.error('Failed to log set', error);
            setLoggedSets((previous) => previous.filter((set) => set.setNumber !== currentSetNumber));
            setLoggerError(getApiErrorMessage(error, 'Unable to save this set. You can keep logging when the connection recovers.'));
        } finally {
            setIsSubmitting(false);
            setSetNote('');
            setStep(exercise.type === 'DurationOnly' ? 'DURATION' : 'REPS');
            setSelectedReps(null);
        }
    };

    const handleRepSelect = (reps) => {
        if (exercise.type === 'RepsOnly') {
            handleSaveLog({ reps });
        } else if (['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise.type)) {
            setSelectedReps(reps);
            setStep('WEIGHT');
        }
    };

    const handleDeleteSet = async (logId, setNumber) => {
        if (!logId) return;
        setLoggedSets((previous) => previous.filter((set) => set.setNumber !== setNumber));
        setLoggerError('');
        try {
            await api.delete(`/workout/logs/${logId}`);
            if (isTemplateSession) {
                const updatedPlan = await refetch({ silent: true }).catch(() => null);
                if (updatedPlan) replaceLoggedSetsFromPlan(updatedPlan);
            }
        } catch (error) {
            console.error('Failed to delete set', error);
            setLoggerError(getApiErrorMessage(error, 'Unable to delete that set. Refresh the plan to verify its state.'));
            if (isTemplateSession) {
                const updatedPlan = await refetch({ silent: true }).catch(() => null);
                if (updatedPlan) replaceLoggedSetsFromPlan(updatedPlan);
            }
        }
    };

    const mutateDrawerStatus = async (planExercise, status, onSuccess) => {
        if (pendingExerciseId) return;
        setPendingExerciseId(planExercise.sessionExerciseId);
        setLoggerError('');
        try {
            const updatedPlan = await updateStatus(planExercise.sessionExerciseId, status);
            onSuccess?.(updatedPlan);
        } catch (error) {
            console.error('Failed to update exercise from plan drawer', error);
            setLoggerError(getApiErrorMessage(error, `Unable to update ${planExercise.exerciseName}.`));
        } finally {
            setPendingExerciseId(null);
        }
    };

    const handleDrawerSkip = (planExercise) => {
        mutateDrawerStatus(planExercise, WORKOUT_EXERCISE_STATUS.Skipped, (updatedPlan) => {
            if (planExercise.sessionExerciseId !== sessionExerciseId) return;
            setIsDrawerOpen(false);
            const nextExercise = nextAvailableExercise(updatedPlan, planExercise);
            if (nextExercise) navigateToPlanExercise(nextExercise, { replace: true });
            else navigate(`/workout-plan/${sessionId}`, { replace: true });
        });
    };

    const handleDrawerRestore = (planExercise) => {
        mutateDrawerStatus(planExercise, WORKOUT_EXERCISE_STATUS.Planned);
    };

    const handleDrawerReopen = (planExercise) => {
        mutateDrawerStatus(planExercise, WORKOUT_EXERCISE_STATUS.InProgress, () => {
            setIsDrawerOpen(false);
            if (planExercise.sessionExerciseId !== sessionExerciseId) navigateToPlanExercise(planExercise);
        });
    };

    const handleCompleteExercise = async () => {
        if (!isTemplateSession) {
            navigate(-1);
            return;
        }

        const linkedSetCount = loggedSets.filter((set) => set.status === 'saved').length;
        if (!currentPlanExercise || currentPlanExercise.status !== 'InProgress' || linkedSetCount < 1) {
            setLoggerError('Log at least one linked set before completing this exercise.');
            return;
        }

        setIsCompleting(true);
        setLoggerError('');
        try {
            const updatedPlan = await updateStatus(sessionExerciseId, WORKOUT_EXERCISE_STATUS.Completed);
            const nextExercise = nextAvailableExercise(updatedPlan, currentPlanExercise);
            if (nextExercise) navigateToPlanExercise(nextExercise, { replace: true });
            else navigate(`/workout-plan/${sessionId}`, { replace: true });
        } catch (error) {
            console.error('Failed to complete template exercise', error);
            setLoggerError(getApiErrorMessage(error, 'Unable to complete this exercise. Your logged sets are unchanged.'));
            setIsCompleting(false);
        }
    };

    if (!sessionId) return null;

    if (isTemplateSession && !hasValidSessionExerciseId) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
                <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center dark:border-red-900/30 dark:bg-gray-800">
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">Exercise plan link is invalid</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Open this exercise from the active workout plan.</p>
                    <button type="button" onClick={() => navigate(`/workout-plan/${sessionId}`)} className="app-primary mt-5 min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white">Return to Plan</button>
                </div>
            </div>
        );
    }

    if (isLoadingExercise || (isTemplateSession && isLoadingPlan && !plan)) {
        return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900"><p className="animate-pulse font-semibold text-gray-400">Loading exercise...</p></div>;
    }

    if (!exercise) {
        return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 p-4 dark:bg-gray-900"><div className="max-w-md text-center"><p className="font-bold text-red-500">{loggerError || 'Exercise unavailable.'}</p><button type="button" onClick={() => navigate(isTemplateSession ? `/workout-plan/${sessionId}` : '/catalog')} className="mt-4 font-bold text-blue-600 dark:text-blue-400">Go Back</button></div></div>;
    }

    const templateContextMissing = isTemplateSession && (!plan || !currentPlanExercise || String(currentPlanExercise.exerciseId) !== String(exerciseId));
    const loggingDisabled = isSubmitting || isCompleting || templateContextMissing || (isTemplateSession && !canLogTemplateSet);

    return (
        <div className="flex h-[100dvh] flex-col overflow-x-hidden overflow-y-auto bg-gray-50 transition-colors dark:bg-gray-900">
            <div className="flex-none px-4 pt-4">
                <div className="mx-auto w-full max-w-md pt-2">
                    <div className="mb-5 flex items-start gap-4 pr-12">
                        <button type="button" onClick={() => navigate(isTemplateSession ? `/workout-plan/${sessionId}` : -1)} aria-label={isTemplateSession ? 'Back to workout plan' : 'Back'} className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">←</button>
                        <div className="min-w-0 flex-1">
                            <h1 className="break-words text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{exercise.name}</h1>
                            <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">Set {nextDisplayedSetNumber}</p>
                        </div>
                    </div>

                    {isTemplateSession && plan && currentPlanExercise && (
                        <button type="button" onClick={() => setIsDrawerOpen(true)} aria-haspopup="dialog" className="mb-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 px-4 text-left focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-blue-950/30">
                            <span className="min-w-0"><span className="block truncate text-xs font-black uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">{plan.templateNameSnapshot} · {currentPosition} / {orderedExercises.length}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-blue-500/70">Open exercise plan</span></span>
                            <span aria-hidden="true" className="text-xl text-blue-500">☰</span>
                        </button>
                    )}

                    {(loggerError || planError || templateContextMissing) && (
                        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">
                            <p>{loggerError || (templateContextMissing ? 'This exercise is not part of the active plan. Return to the plan and choose it again.' : planError)}</p>
                            {planError && <button type="button" onClick={() => refetch({ silent: true }).catch(() => {})} className="mt-2 underline underline-offset-2">Refresh plan</button>}
                        </div>
                    )}

                    {isTemplateSession && currentPlanExercise?.status === 'Skipped' && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">This exercise is skipped. Restore it from the exercise plan before logging sets.</div>}
                    {isTemplateSession && currentPlanExercise?.status === 'Completed' && <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">This exercise is completed. Reopen it from the exercise plan to continue editing.</div>}

                    <LastPerformanceCard exerciseId={exerciseId} sessionId={sessionId} />

                    <div className="mb-6 flex flex-col rounded-3xl border-2 border-blue-100/50 bg-blue-50/30 p-6 shadow-sm transition-colors dark:border-blue-900/30 dark:bg-blue-950/20">
                        <div className="mb-6">
                            <label htmlFor="set-note" className="sr-only">Set notes</label>
                            <input id="set-note" type="text" placeholder="Add notes for this set (optional)..." value={setNote} onChange={(event) => setSetNote(event.target.value)} disabled={loggingDisabled} className="w-full rounded-xl border border-blue-200/50 bg-white/60 px-4 py-3 text-sm font-medium text-gray-800 transition-all placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 dark:border-blue-800/50 dark:bg-gray-900/50 dark:text-gray-200 dark:placeholder-blue-700/60" />
                        </div>

                        {step === 'DURATION' && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}><h2 className="mb-4 text-center text-sm font-black uppercase tracking-[0.15em] text-purple-600/70 dark:text-purple-400/70">Duration (Seconds)</h2><div className="grid grid-cols-3 gap-3">{durationOptions.map((seconds) => <button type="button" key={`dur-${seconds}`} disabled={loggingDisabled} onClick={() => handleSaveLog({ durationSeconds: seconds })} className="rounded-xl border-2 border-purple-400/50 bg-purple-100/50 py-4 text-xl font-bold text-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all active:bg-purple-200 disabled:opacity-50 dark:border-purple-500/50 dark:bg-purple-950/40 dark:text-purple-300 dark:active:bg-purple-900/60">{seconds}s</button>)}</div></motion.div>}

                        {step === 'REPS' && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}><h2 className="mb-4 text-center text-sm font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">Reps</h2><div className="grid grid-cols-3 gap-3">{repOptions.map((reps) => <button type="button" key={`rep-${reps}`} disabled={loggingDisabled} onClick={() => handleRepSelect(reps)} className="rounded-xl border-2 border-blue-400/50 bg-blue-100/50 py-4 text-xl font-bold text-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.15)] transition-all active:bg-blue-200 disabled:opacity-50 dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-300 dark:active:bg-blue-900/60">{reps}</button>)}</div></motion.div>}

                        {step === 'WEIGHT' && <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}><div className="mb-4 flex items-center justify-between"><button type="button" onClick={() => setStep('REPS')} className="px-2 text-xl font-bold text-blue-400/70 transition-colors hover:text-blue-500">←</button><h2 className="text-sm font-black uppercase tracking-[0.15em] text-green-600/70 dark:text-green-400/70">Weight (kg)</h2><div className="w-8" /></div>{exercise.type === 'RepsWithOptionalWeight' && <button type="button" disabled={loggingDisabled} onClick={() => handleSaveLog({ reps: selectedReps, weightKg: null })} className="mb-3 w-full rounded-xl border-2 border-blue-400/50 bg-blue-100/50 py-4 text-lg font-bold text-blue-700 disabled:opacity-50 dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-300">Bodyweight</button>}<div className="grid grid-cols-3 gap-3">{weightOptions.map((weight) => <button type="button" key={`weight-${weight}`} disabled={loggingDisabled} onClick={() => handleSaveLog({ reps: selectedReps, weightKg: weight })} className="rounded-xl border-2 border-green-400/50 bg-green-100/50 py-4 text-xl font-bold text-green-700 shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all active:bg-green-200 disabled:opacity-50 dark:border-green-500/50 dark:bg-green-950/40 dark:text-green-300 dark:active:bg-green-900/60">{weight}</button>)}</div></motion.div>}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="mx-auto w-full max-w-md">
                    {loggedSets.length > 0 && <div className="mb-6 space-y-2"><h2 className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 dark:text-blue-400/50">Completed Sets</h2>{[...loggedSets].reverse().map((set) => <div key={set.id ?? set.setNumber} className="flex flex-col rounded-xl border border-blue-100/50 bg-white/80 px-4 py-3 shadow-sm transition-colors dark:border-blue-900/30 dark:bg-gray-800/80"><div className="flex items-center justify-between"><span className="w-16 font-bold text-gray-800 dark:text-gray-200">Set {set.setNumber}</span><div className="flex flex-1 items-center justify-end gap-4">{set.durationSeconds ? <span className="font-bold text-purple-600 dark:text-purple-400">{set.durationSeconds}s</span> : <><span className="font-medium text-gray-600 dark:text-gray-400">{set.reps} reps</span>{set.weightKg != null ? <span className="w-12 text-right font-black text-blue-600 dark:text-blue-400">{set.weightKg}kg</span> : <span className="w-12 text-right text-xs font-black text-blue-500/70 dark:text-blue-400/70">BW</span>}</>}{set.status === 'saving' ? <span className="w-8 animate-pulse text-center text-xs font-bold uppercase tracking-wider text-blue-400">Wait</span> : <button type="button" onClick={() => handleDeleteSet(set.id, set.setNumber)} aria-label={`Delete set ${set.setNumber}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50/50 font-bold text-red-500/70 transition-colors hover:bg-red-100 active:bg-red-200 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400/70">✕</button>}</div></div>{set.notes && <p className="mt-2 rounded-lg border border-blue-100/50 bg-blue-50/50 p-2 text-xs font-medium text-blue-600/80 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300/80">{set.notes}</p>}</div>)}</div>}
                </div>
            </div>

            <div className="flex-none border-t border-gray-100 bg-gray-50 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] dark:border-gray-800 dark:bg-gray-900">
                <div className="mx-auto w-full max-w-md">
                    <button type="button" onClick={handleCompleteExercise} disabled={isCompleting || (isTemplateSession && (!currentPlanExercise || currentPlanExercise.status !== 'InProgress' || loggedSets.filter((set) => set.status === 'saved').length < 1))} className="w-full rounded-xl border-2 border-blue-400/50 bg-blue-50/50 py-4 font-bold text-blue-700 outline-none transition-all active:bg-blue-100 disabled:opacity-40 dark:border-blue-500/50 dark:bg-blue-950/30 dark:text-blue-300 dark:active:bg-blue-900/60">{isCompleting ? 'Completing...' : 'Complete Exercise'}</button>
                </div>
            </div>

            <AnimatePresence>
                {isDrawerOpen && plan && <WorkoutPlanDrawer plan={plan} currentSessionExerciseId={sessionExerciseId} pendingExerciseId={pendingExerciseId} onClose={() => setIsDrawerOpen(false)} onNavigate={(planExercise) => { setIsDrawerOpen(false); navigateToPlanExercise(planExercise); }} onSkip={handleDrawerSkip} onRestore={handleDrawerRestore} onReopen={handleDrawerReopen} />}
            </AnimatePresence>
        </div>
    );
};

export default Logger;
