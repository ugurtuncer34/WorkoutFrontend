import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/apiError';
import { getActiveSession, getActiveSessionDestination, setProgramSession } from '../utils/activeSession';
import { getProgramStepName, getProgramStepSecondary, isRestStep } from '../utils/workoutProgram';

const ActiveProgramCard = ({ activeProgram, loading, error, refetch, startNext, completeRest }) => {
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    const [isStarting, setIsStarting] = useState(false);
    const [isCompletingRest, setIsCompletingRest] = useState(false);
    const [actionError, setActionError] = useState('');

    if (loading && !activeProgram) {
        return <div className="mb-4 rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-6 text-center dark:border-blue-900/30 dark:bg-blue-950/20"><p className="animate-pulse text-sm font-bold text-blue-500/70">Loading active program...</p></div>;
    }

    if (!activeProgram) {
        if (!error) return null;
        return <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert"><p>{error}</p><button type="button" onClick={() => refetch().catch(() => {})} className="mt-2 underline underline-offset-2">Try again</button></div>;
    }

    const step = activeProgram.currentStep;
    const rest = isRestStep(step);
    const stepName = getProgramStepName(step);
    const secondary = getProgramStepSecondary(step);
    const templateBlocked = !rest && (step.workoutTemplateIsArchived === true || !step.workoutTemplateId);
    const activeSession = getActiveSession();
    const hasOtherLocalSession = Boolean(activeSession.sessionId && activeSession.mode !== 'program');

    const handleStart = async () => {
        if (isStarting || templateBlocked) return;
        if (activeSession.sessionId) {
            navigate(getActiveSessionDestination());
            return;
        }
        setIsStarting(true);
        setActionError('');
        try {
            const plan = await startNext();
            setProgramSession(plan.workoutSessionId, {
                templateName: plan.templateNameSnapshot,
                templateCategory: plan.templateCategorySnapshot,
                programName: plan.programNameSnapshot || activeProgram.programName,
                programStepLabel: plan.programStepLabelSnapshot || step.label,
                programCycle: plan.programCycleNumberSnapshot ?? activeProgram.cycleNumber
            });
            navigate(`/workout-plan/${plan.workoutSessionId}`);
        } catch (requestError) {
            console.error('Failed to start next program workout', requestError);
            setActionError(getApiErrorMessage(requestError, 'Unable to start the next program workout.'));
        } finally {
            setIsStarting(false);
        }
    };

    const handleCompleteRest = async () => {
        if (isCompletingRest) return;
        setIsCompletingRest(true);
        setActionError('');
        try {
            await completeRest(step.programStepId);
        } catch (requestError) {
            console.error('Failed to complete program rest step', requestError);
            setActionError(getApiErrorMessage(requestError, 'Unable to complete this Rest step.'));
        } finally {
            setIsCompletingRest(false);
        }
    };

    return (
        <section className="mb-4 overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-900/60 dark:from-blue-950/35 dark:to-indigo-950/25" aria-label="Active workout program">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step.programStepId} initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/70">{rest ? 'Rest Day' : 'Next Workout'}</p>
                    <h2 className="mt-2 break-words text-lg font-black text-gray-700 dark:text-gray-200">{activeProgram.programName}</h2>
                    {!rest && <h3 className="mt-1 break-words text-3xl font-black tracking-tight text-gray-950 dark:text-white">{stepName}</h3>}
                    {secondary && <p className="mt-1 break-words text-xs font-bold text-gray-500 dark:text-gray-400">{secondary}</p>}
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-blue-600/70 dark:text-blue-400/70">Cycle {activeProgram.cycleNumber} · Step {step.position} of {activeProgram.totalStepCount}</p>

                    {templateBlocked && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">This current step’s workout template is {step.workoutTemplateIsArchived ? 'archived' : 'unavailable'}. Program tracking is paused at this exact step. Restore the template from Templates or edit the program after deactivating it.</div>}
                    {hasOtherLocalSession && !rest && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">Finish or cancel your current {activeSession.mode === 'template' ? 'template workout' : 'Quick Session'} before starting this program workout.</div>}
                    {(actionError || error) && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{actionError || error}</div>}

                    {rest ? <button type="button" onClick={handleCompleteRest} disabled={isCompletingRest} className="app-primary mt-5 min-h-14 w-full rounded-xl bg-blue-600 px-3 text-sm font-black uppercase tracking-[0.14em] text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">{isCompletingRest ? 'Completing Rest...' : 'Complete Rest'}</button> : <button type="button" onClick={handleStart} disabled={isStarting || templateBlocked} className="app-primary mt-5 min-h-14 w-full rounded-xl bg-blue-600 px-3 text-sm font-black uppercase tracking-[0.12em] text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">{isStarting ? 'Starting...' : activeSession.sessionId ? 'Resume Active Session' : activeProgram.incompleteWorkoutSessionId ? `Resume ${stepName}` : `Start ${stepName}`}</button>}
                    <div className={`mt-3 grid gap-3 ${templateBlocked ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <button type="button" onClick={() => navigate('/programs')} className="min-h-11 rounded-xl border border-blue-200 bg-white/60 px-2 text-sm font-bold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-gray-900/30 dark:text-blue-300">View Program</button>
                        {templateBlocked && <button type="button" onClick={() => navigate('/templates')} className="min-h-11 rounded-xl border border-amber-200 bg-amber-50 px-2 text-sm font-bold text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">Open Templates</button>}
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    );
};

export default ActiveProgramCard;
