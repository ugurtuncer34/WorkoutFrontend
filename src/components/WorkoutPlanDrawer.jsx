import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STATUS_SYMBOL = {
    Completed: '✓',
    InProgress: '●',
    Planned: '○',
    Skipped: '—'
};

const WorkoutPlanDrawer = ({ plan, currentSessionExerciseId, pendingExerciseId, onClose, onNavigate, onSkip, onRestore, onReopen }) => {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const restoreFocusRef = useRef(document.activeElement);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const restoreFocusElement = restoreFocusRef.current;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            if (restoreFocusElement?.isConnected) restoreFocusElement.focus();
        };
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const confirmSkip = (exercise) => {
        if (window.confirm(`Skip “${exercise.exerciseName}”? You can restore it later.`)) onSkip(exercise);
    };

    return (
        <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/55"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-plan-drawer-title"
            onKeyDown={handleKeyDown}
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
            <motion.div
                ref={dialogRef}
                initial={shouldReduceMotion ? false : { y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                className="max-h-[82dvh] w-full max-w-md overflow-hidden rounded-t-3xl border border-b-0 border-gray-200 bg-gray-50 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            >
                <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">{plan.templateCategorySnapshot || 'Template Session'}</p>
                        <h2 id="workout-plan-drawer-title" className="truncate text-lg font-black text-gray-900 dark:text-white">{plan.templateNameSnapshot || 'Exercise Plan'}</h2>
                    </div>
                    <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close exercise plan" className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-700 dark:text-gray-200">✕</button>
                </div>

                <div className="max-h-[calc(82dvh-76px)] space-y-3 overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                    {(plan.exercises || []).map((exercise) => {
                        const isCurrent = String(exercise.sessionExerciseId) === String(currentSessionExerciseId);
                        const isPending = pendingExerciseId === exercise.sessionExerciseId;
                        return (
                            <div key={exercise.sessionExerciseId} className={`rounded-2xl border p-3 ${isCurrent ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30' : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm font-black ${exercise.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : exercise.status === 'Skipped' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>{STATUS_SYMBOL[exercise.status] || '○'}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="break-words text-sm font-black text-gray-900 dark:text-white">{exercise.exerciseName}{isCurrent ? <span className="ml-2 text-[9px] uppercase tracking-wider text-blue-500">Current</span> : null}</p>
                                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{exercise.status === 'Skipped' ? 'Skipped' : `${exercise.completedSetCount} / ${exercise.plannedSetCount} sets`} · {exercise.status}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    {['Planned', 'InProgress'].includes(exercise.status) && (
                                        <>
                                            <button type="button" onClick={() => onNavigate(exercise)} disabled={isCurrent || isPending} className="app-primary min-h-10 flex-1 rounded-xl bg-blue-600 px-3 text-xs font-black uppercase tracking-wider text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40">{isCurrent ? 'Current' : 'Open'}</button>
                                            <button type="button" onClick={() => confirmSkip(exercise)} disabled={isPending} className="min-h-10 rounded-xl bg-amber-50 px-4 text-xs font-black uppercase text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-300">{isPending ? '...' : 'Skip'}</button>
                                        </>
                                    )}
                                    {exercise.status === 'Completed' && <button type="button" onClick={() => onReopen(exercise)} disabled={isPending} className="min-h-10 w-full rounded-xl bg-blue-50 px-3 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-300">{isPending ? 'Reopening...' : 'Reopen & Edit'}</button>}
                                    {exercise.status === 'Skipped' && <button type="button" onClick={() => onRestore(exercise)} disabled={isPending} className="min-h-10 w-full rounded-xl bg-blue-50 px-3 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-300">{isPending ? 'Restoring...' : 'Restore to Planned'}</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default WorkoutPlanDrawer;
