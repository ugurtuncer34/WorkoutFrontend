import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';
import AdHocExerciseForm from '../components/AdHocExerciseForm';
import useWorkoutPlan, { WORKOUT_EXERCISE_STATUS } from '../hooks/useWorkoutPlan';
import { clearActiveSession, getActiveSession, getActiveSessionDestination, setTemplateSession } from '../utils/activeSession';

const STATUS_STYLES = {
    Planned: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200',
    InProgress: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    Completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    Skipped: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
};

const targetSummary = (exercise) => {
    const targets = [];
    if (exercise.repMin != null || exercise.repMax != null) {
        const reps = exercise.repMin != null && exercise.repMax != null
            ? `${exercise.repMin}–${exercise.repMax} reps`
            : `${exercise.repMin ?? exercise.repMax} reps`;
        targets.push(reps);
    }
    if (exercise.targetDurationSeconds != null) targets.push(`${exercise.targetDurationSeconds}s target`);
    if (exercise.suggestedWeightKg != null) targets.push(`${Number(exercise.suggestedWeightKg)} kg suggested`);
    return targets;
};

const WorkoutPlan = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    const { plan, loading, error, errorStatus, refetch, updateStatus, addExercise } = useWorkoutPlan(sessionId);
    const [actionError, setActionError] = useState('');
    const [pendingExerciseId, setPendingExerciseId] = useState(null);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showAddExercise, setShowAddExercise] = useState(false);

    const exercises = useMemo(() => plan?.exercises || [], [plan]);
    const isActiveTemplatePlan = Boolean(plan?.isTemplateSession && !plan?.isCompleted);
    const activeSession = getActiveSession();
    const hasSessionConflict = Boolean(activeSession.sessionId && String(activeSession.sessionId) !== String(sessionId));

    useEffect(() => {
        if (!isActiveTemplatePlan) return;
        const activeSession = getActiveSession();
        if (activeSession.sessionId && String(activeSession.sessionId) !== String(sessionId)) return;
        setTemplateSession(sessionId, {
            templateName: plan.templateNameSnapshot,
            templateCategory: plan.templateCategorySnapshot
        });
    }, [isActiveTemplatePlan, plan, sessionId]);

    const loggerPath = (exercise) => `/logger/${exercise.exerciseId}?sessionExerciseId=${exercise.sessionExerciseId}`;

    const mutateStatus = async (exercise, status, afterSuccess) => {
        if (pendingExerciseId) return;
        setPendingExerciseId(exercise.sessionExerciseId);
        setActionError('');
        try {
            const updatedPlan = await updateStatus(exercise.sessionExerciseId, status);
            afterSuccess?.(updatedPlan);
        } catch (requestError) {
            console.error('Failed to update session exercise status', requestError);
            setActionError(getApiErrorMessage(requestError, `Unable to update ${exercise.exerciseName}.`));
        } finally {
            setPendingExerciseId(null);
        }
    };

    const handleSkip = (exercise) => {
        if (!window.confirm(`Skip “${exercise.exerciseName}”? You can restore it later.`)) return;
        mutateStatus(exercise, WORKOUT_EXERCISE_STATUS.Skipped);
    };

    const handleComplete = (exercise) => {
        if (exercise.completedSetCount < 1) {
            setActionError(`Log at least one set for ${exercise.exerciseName} before completing it.`);
            return;
        }
        mutateStatus(exercise, WORKOUT_EXERCISE_STATUS.Completed);
    };

    const handleReopen = (exercise) => {
        mutateStatus(exercise, WORKOUT_EXERCISE_STATUS.InProgress, () => navigate(loggerPath(exercise)));
    };

    const handleFinish = async () => {
        if (isFinishing || isCancelling) return;
        setIsFinishing(true);
        setActionError('');
        try {
            await api.put(`/workout/sessions/${sessionId}/complete`);
            clearActiveSession();
            navigate(`/summary/${sessionId}`);
        } catch (requestError) {
            console.error('Failed to finish template workout', requestError);
            setActionError(getApiErrorMessage(requestError, 'Unable to finish this workout. Your active session is unchanged.'));
            setIsFinishing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel this workout? Logged progress from this session will be lost.')) return;
        setIsCancelling(true);
        setActionError('');
        try {
            await api.delete(`/workout/sessions/${sessionId}/cancel`);
            clearActiveSession();
            navigate('/');
        } catch (requestError) {
            console.error('Failed to cancel template workout', requestError);
            setActionError(getApiErrorMessage(requestError, 'Unable to cancel this workout. Your active session is unchanged.'));
            setIsCancelling(false);
        }
    };

    if (loading && !plan) {
        return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900"><p className="animate-pulse font-semibold text-gray-400">Loading workout plan...</p></div>;
    }

    if (!plan) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mx-auto mt-20 max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center dark:border-red-900/30 dark:bg-gray-800">
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">{errorStatus === 404 ? 'Workout plan not found' : 'Plan unavailable'}</h1>
                    <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error || 'This workout plan could not be loaded.'}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => navigate('/')} className="min-h-12 rounded-xl bg-gray-100 font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">Home</button>
                        <button type="button" onClick={() => refetch().catch(() => {})} className="app-primary min-h-12 rounded-xl bg-blue-600 font-bold text-white">Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isActiveTemplatePlan) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mx-auto mt-20 max-w-md rounded-3xl border border-amber-100 bg-white p-6 text-center dark:border-amber-900/30 dark:bg-gray-800">
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">Workout is not active</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This route only supports active template workouts.</p>
                    <button type="button" onClick={() => navigate('/')} className="app-primary mt-5 min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white">Back to Home</button>
                </div>
            </div>
        );
    }

    if (hasSessionConflict) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mx-auto mt-20 max-w-md rounded-3xl border border-amber-100 bg-white p-6 text-center dark:border-amber-900/30 dark:bg-gray-800">
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">Another workout is active</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Resume the active session before opening a different workout plan.</p>
                    <button type="button" onClick={() => navigate(getActiveSessionDestination())} className="app-primary mt-5 min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white">Resume Active Session</button>
                </div>
            </div>
        );
    }

    const completedCount = plan.completedExerciseCount ?? exercises.filter((exercise) => exercise.status === 'Completed').length;
    const skippedCount = plan.skippedExerciseCount ?? exercises.filter((exercise) => exercise.status === 'Skipped').length;
    const totalCount = plan.totalExerciseCount ?? exercises.length;
    const progressPercent = totalCount ? Math.round(((completedCount + skippedCount) / totalCount) * 100) : 0;

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-4 transition-colors dark:bg-gray-900">
            <main className="mx-auto w-full max-w-md pt-4">
                <header className="mb-5 flex items-start gap-4 pr-12">
                    <button type="button" onClick={() => navigate('/')} aria-label="Back to home" className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">←</button>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">{plan.templateCategorySnapshot || 'Template Workout'}</p>
                        <h1 className="break-words text-2xl font-black tracking-tight text-gray-900 dark:text-white">{plan.templateNameSnapshot || 'Planned Workout'}</h1>
                    </div>
                </header>

                <section className="rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20" aria-label="Workout progress">
                    <div className="flex items-end justify-between gap-4">
                        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600/70 dark:text-blue-400/70">Overall Progress</p><p className="mt-1 text-3xl font-black text-blue-700 dark:text-blue-300">{progressPercent}%</p></div>
                        <div className="text-right text-xs font-bold text-gray-500 dark:text-gray-400"><p>{completedCount} completed</p><p>{skippedCount} skipped · {totalCount} total</p></div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/60"><motion.div initial={false} animate={{ width: `${progressPercent}%` }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }} className="h-full rounded-full bg-blue-600" /></div>
                </section>

                {(error || actionError) && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">
                        <p>{actionError || error}</p>
                        {error && <button type="button" onClick={() => refetch({ silent: true }).catch(() => {})} className="mt-2 underline underline-offset-2">Refresh plan</button>}
                    </div>
                )}

                <section className="mt-6">
                    <div className="mb-4 flex items-end justify-between gap-3 px-1"><div><h2 className="text-lg font-black text-gray-900 dark:text-white">Exercise Plan</h2><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Ordered session flow</p></div><span className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{exercises.length}</span></div>

                    {exercises.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-7 text-center dark:border-gray-700 dark:bg-gray-800"><p className="font-bold text-gray-700 dark:text-gray-200">No exercises in this plan.</p><p className="mt-1 text-sm text-gray-400">Add an ad-hoc exercise to continue.</p></div>
                    ) : (
                        <div className="space-y-4">
                            {exercises.map((exercise) => {
                                const isPending = pendingExerciseId === exercise.sessionExerciseId;
                                const targets = targetSummary(exercise);
                                return (
                                    <article key={exercise.sessionExerciseId} className={`rounded-3xl border-2 bg-white p-5 shadow-sm dark:bg-gray-800 ${exercise.status === 'InProgress' ? 'border-blue-300 dark:border-blue-800' : 'border-gray-100 dark:border-gray-700'}`}>
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{exercise.position}</span>
                                            <div className="min-w-0 flex-1"><h3 className="break-words font-black text-gray-900 dark:text-white">{exercise.exerciseName}</h3><p className="mt-1 text-xs font-bold text-gray-400">{exercise.targetMuscleName || 'Unknown target'} · {exercise.muscleGroupName || 'Unknown group'}</p></div>
                                            <span className={`flex-none rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[exercise.status] || STATUS_STYLES.Planned}`}>{exercise.status}</span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{exercise.completedSetCount} / {exercise.plannedSetCount} sets</span>
                                            {exercise.isOptional && <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black uppercase text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">Optional</span>}
                                            {exercise.isAdHoc && <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">Ad-hoc</span>}
                                        </div>
                                        {targets.length > 0 && <p className="mt-3 text-xs font-bold text-gray-500 dark:text-gray-400">{targets.join(' · ')}</p>}
                                        {exercise.notes && <p className="mt-3 break-words rounded-xl bg-gray-50 p-3 text-sm font-medium text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">{exercise.notes}</p>}

                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            {exercise.status === 'Planned' && <><button type="button" onClick={() => navigate(loggerPath(exercise))} disabled={isPending} className="app-primary min-h-11 rounded-xl bg-blue-600 text-xs font-black uppercase tracking-wider text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">Start Exercise</button><button type="button" onClick={() => handleSkip(exercise)} disabled={isPending} className="min-h-11 rounded-xl bg-amber-50 text-xs font-black uppercase tracking-wider text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-300">{isPending ? 'Updating...' : 'Skip'}</button></>}
                                            {exercise.status === 'InProgress' && <><button type="button" onClick={() => navigate(loggerPath(exercise))} disabled={isPending} className="app-primary min-h-11 rounded-xl bg-blue-600 text-xs font-black uppercase tracking-wider text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">Continue</button><button type="button" onClick={() => handleComplete(exercise)} disabled={isPending || exercise.completedSetCount < 1} title={exercise.completedSetCount < 1 ? 'Log at least one set first' : undefined} className="min-h-11 rounded-xl bg-green-50 text-xs font-black uppercase tracking-wider text-green-700 focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-40 dark:bg-green-950/30 dark:text-green-300">Complete</button><button type="button" onClick={() => handleSkip(exercise)} disabled={isPending} className="col-span-2 min-h-11 rounded-xl bg-amber-50 text-xs font-black uppercase tracking-wider text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-300">{isPending ? 'Updating...' : 'Skip Exercise'}</button></>}
                                            {exercise.status === 'Completed' && <button type="button" onClick={() => handleReopen(exercise)} disabled={isPending} className="col-span-2 min-h-11 rounded-xl bg-blue-50 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-300">{isPending ? 'Reopening...' : 'Reopen / Continue Editing'}</button>}
                                            {exercise.status === 'Skipped' && <button type="button" onClick={() => mutateStatus(exercise, WORKOUT_EXERCISE_STATUS.Planned)} disabled={isPending} className="col-span-2 min-h-11 rounded-xl bg-blue-50 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-300">{isPending ? 'Restoring...' : 'Restore to Planned'}</button>}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="mt-6">
                    {!showAddExercise ? <button type="button" onClick={() => setShowAddExercise(true)} className="min-h-12 w-full rounded-2xl border-2 border-blue-200 bg-white font-bold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-gray-800 dark:text-blue-300">Add Exercise</button> : <AdHocExerciseForm existingExerciseIds={exercises.map((exercise) => exercise.exerciseId)} onSubmit={addExercise} onClose={() => setShowAddExercise(false)} />}
                </section>

                <section className="mt-6 space-y-3 rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 shadow-sm dark:border-blue-900/30 dark:bg-blue-950/20" aria-label="Session actions">
                    <button type="button" onClick={handleFinish} disabled={isFinishing || isCancelling} className="min-h-14 w-full rounded-xl bg-green-100 font-black uppercase tracking-wider text-green-700 focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 dark:bg-green-950/40 dark:text-green-300">{isFinishing ? 'Finishing...' : 'Finish Workout'}</button>
                    <button type="button" onClick={handleCancel} disabled={isFinishing || isCancelling} className="min-h-12 w-full rounded-xl bg-red-50 font-black uppercase tracking-wider text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400">{isCancelling ? 'Cancelling...' : 'Cancel Workout'}</button>
                </section>
            </main>
        </div>
    );
};

export default WorkoutPlan;
