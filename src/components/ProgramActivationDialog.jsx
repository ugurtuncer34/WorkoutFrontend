import React, { useEffect, useRef, useState } from 'react';
import { getProgramStepName, orderedProgramSteps } from '../utils/workoutProgram';

const ProgramActivationDialog = ({ program, activeProgram, isActivating, error, onClose, onActivate }) => {
    const steps = orderedProgramSteps(program.steps);
    const [startingStepId, setStartingStepId] = useState(() => String(steps[0]?.programStepId || ''));
    const dialogRef = useRef(null);
    const selectRef = useRef(null);

    useEffect(() => {
        const previousFocus = document.activeElement;
        selectRef.current?.focus();
        return () => previousFocus?.isConnected && previousFocus.focus();
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isActivating) {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])');
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

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="activate-program-title" onKeyDown={handleKeyDown} onMouseDown={(event) => { if (event.target === event.currentTarget && !isActivating) onClose(); }}>
            <div ref={dialogRef} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Start Program</p>
                <h2 id="activate-program-title" className="mt-1 break-words text-2xl font-black text-gray-900 dark:text-white">{program.name}</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Choose the exact step where rolling program tracking should begin.</p>

                {activeProgram && activeProgram.programId !== program.id && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                        This will replace the active program “{activeProgram.programName}”. Its definition and workout history are preserved.
                    </div>
                )}
                {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{error}</div>}

                <label htmlFor="starting-program-step" className="mt-5 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Starting from</label>
                <select ref={selectRef} id="starting-program-step" value={startingStepId} onChange={(event) => setStartingStepId(event.target.value)} disabled={isActivating} className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 dark:border-blue-800/50 dark:bg-gray-900 dark:text-gray-200">
                    {steps.map((step) => <option key={step.programStepId} value={step.programStepId}>{step.position}. {getProgramStepName(step)}</option>)}
                </select>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={isActivating} className="min-h-12 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">Cancel</button>
                    <button type="button" onClick={() => onActivate(Number(startingStepId))} disabled={isActivating || !startingStepId} className="app-primary min-h-12 rounded-xl bg-blue-600 font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">{isActivating ? 'Starting...' : 'Start Program'}</button>
                </div>
            </div>
        </div>
    );
};

export default ProgramActivationDialog;
