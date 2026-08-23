import React from 'react';
import { getProgramStepName, orderedProgramSteps } from '../utils/workoutProgram';

const ProgramCard = ({ program, activeProgram, pendingAction, onActivate, onEdit, onArchiveToggle, onDeactivate }) => {
    const steps = orderedProgramSteps(program.steps);
    const isActive = program.isActive || activeProgram?.programId === program.id;
    const currentStepId = isActive ? activeProgram?.currentStep?.programStepId : null;
    const isPending = Boolean(pendingAction);

    return (
        <article className={`rounded-3xl border bg-white p-5 shadow-sm dark:bg-gray-800 ${isActive ? 'border-blue-300 dark:border-blue-800' : 'border-gray-100 dark:border-gray-700'}`}>
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-xl font-black text-gray-900 dark:text-white">{program.name}</h2>
                        {isActive && <span className="rounded-lg bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">Active</span>}
                        {program.isArchived && <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-300">Archived</span>}
                    </div>
                    {program.notes && <p className="mt-2 line-clamp-2 break-words text-sm text-gray-500 dark:text-gray-400">{program.notes}</p>}
                </div>
                <span className="flex-none rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
            </div>

            <ol className="mt-4 space-y-1.5 border-l-2 border-blue-100 pl-4 dark:border-blue-900/50">
                {steps.slice(0, 8).map((step) => {
                    const isCurrent = step.programStepId === currentStepId;
                    return <li key={step.programStepId} className={`flex min-w-0 gap-2 text-sm font-medium ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}><span className="w-4 flex-none font-black">{isCurrent ? '→' : step.position}</span><span className={`break-words ${isCurrent ? 'font-black' : ''}`}>{getProgramStepName(step)}</span></li>;
                })}
                {steps.length > 8 && <li className="text-xs font-bold text-gray-400">+{steps.length - 8} more</li>}
            </ol>

            {isActive && activeProgram?.currentStep && <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-blue-500">Cycle {activeProgram.cycleNumber} · Step {activeProgram.currentStep.position} of {activeProgram.totalStepCount}</p>}

            {!program.isArchived && !isActive && <button type="button" onClick={onActivate} disabled={isPending} className="app-primary mt-5 min-h-12 w-full rounded-xl bg-blue-600 text-sm font-black uppercase tracking-[0.14em] text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">Activate</button>}
            {isActive && <button type="button" onClick={onDeactivate} disabled={isPending} className="mt-5 min-h-12 w-full rounded-xl bg-amber-50 text-sm font-black uppercase tracking-[0.14em] text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-300">{pendingAction || 'Deactivate'}</button>}

            <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={onEdit} disabled={isPending || isActive} title={isActive ? 'Deactivate to edit' : undefined} className="min-h-11 rounded-xl bg-blue-50 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:bg-blue-950/40 dark:text-blue-300">{isActive ? 'Deactivate to edit' : 'Edit'}</button>
                <button type="button" onClick={onArchiveToggle} disabled={isPending || isActive} title={isActive ? 'Deactivate before archiving' : undefined} className="min-h-11 rounded-xl bg-gray-100 px-2 text-xs font-black uppercase tracking-wider text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200">{pendingAction || (program.isArchived ? 'Unarchive' : 'Archive')}</button>
            </div>
        </article>
    );
};

export default ProgramCard;
