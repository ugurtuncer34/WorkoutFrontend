import React, { useState } from 'react';
import { getApiErrorMessage } from '../api/apiError';
import ExercisePicker from './ExercisePicker';

const fieldClass = (hasError = false) => `w-full rounded-xl border bg-white px-3 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-900 dark:text-gray-200 ${hasError ? 'border-red-400 dark:border-red-700' : 'border-blue-200 dark:border-blue-800/50'}`;
const labelClass = 'mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400';

const blankToNumberOrNull = (value) => value === '' ? null : Number(value);

const AdHocExerciseForm = ({ existingExerciseIds, onSubmit, onClose }) => {
    const [exercise, setExercise] = useState(null);
    const [plannedSetCount, setPlannedSetCount] = useState('3');
    const [repMin, setRepMin] = useState('');
    const [repMax, setRepMax] = useState('');
    const [targetDurationSeconds, setTargetDurationSeconds] = useState('');
    const [suggestedWeightKg, setSuggestedWeightKg] = useState('');
    const [notes, setNotes] = useState('');
    const [isOptional, setIsOptional] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isDuration = exercise?.exerciseType === 'DurationOnly';
    const hasReps = ['RepsAndWeight', 'RepsWithOptionalWeight', 'RepsOnly'].includes(exercise?.exerciseType);
    const hasWeight = ['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise?.exerciseType);

    const validate = () => {
        const nextErrors = {};
        const setCount = Number(plannedSetCount);
        if (!Number.isInteger(setCount) || setCount < 1) nextErrors.plannedSetCount = 'Use a whole number of at least 1.';

        if (hasReps) {
            if (repMin !== '' && (!Number.isInteger(Number(repMin)) || Number(repMin) < 1)) nextErrors.repMin = 'Use a positive whole number.';
            if (repMax !== '' && (!Number.isInteger(Number(repMax)) || Number(repMax) < 1)) nextErrors.repMax = 'Use a positive whole number.';
            if (!nextErrors.repMin && !nextErrors.repMax && repMin !== '' && repMax !== '' && Number(repMin) > Number(repMax)) {
                nextErrors.repMax = 'Rep max must be at least rep min.';
            }
        }

        if (isDuration && targetDurationSeconds !== '' && (!Number.isInteger(Number(targetDurationSeconds)) || Number(targetDurationSeconds) < 1)) {
            nextErrors.targetDurationSeconds = 'Use a positive whole number.';
        }

        if (hasWeight && suggestedWeightKg !== '' && (!Number.isFinite(Number(suggestedWeightKg)) || Number(suggestedWeightKg) < 0)) {
            nextErrors.suggestedWeightKg = 'Weight cannot be negative.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!exercise || !validate() || isSaving) return;

        setIsSaving(true);
        setApiError('');
        try {
            await onSubmit({
                exerciseId: exercise.exerciseId,
                position: null,
                plannedSetCount: Number(plannedSetCount),
                repMin: hasReps ? blankToNumberOrNull(repMin) : null,
                repMax: hasReps ? blankToNumberOrNull(repMax) : null,
                targetDurationSeconds: isDuration ? blankToNumberOrNull(targetDurationSeconds) : null,
                suggestedWeightKg: hasWeight ? blankToNumberOrNull(suggestedWeightKg) : null,
                notes: notes.trim() || null,
                isOptional
            });
            onClose();
        } catch (error) {
            console.error('Failed to add ad-hoc session exercise', error);
            setApiError(getApiErrorMessage(error, 'Unable to add this exercise. Your settings are still here.'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!exercise) {
        return (
            <div className="space-y-3">
                <ExercisePicker
                    existingExerciseIds={existingExerciseIds}
                    onAdd={setExercise}
                    actionLabel="Choose Exercise"
                    duplicateLabel="this session"
                />
                <button type="button" onClick={onClose} className="min-h-11 w-full rounded-xl bg-gray-100 text-sm font-bold text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-800 dark:text-gray-300">
                    Close
                </button>
            </div>
        );
    }

    const numberField = (id, label, value, setValue, error, options = {}) => (
        <div>
            <label htmlFor={id} className={labelClass}>{label}</label>
            <input
                id={id}
                type="number"
                inputMode={options.step === 'any' ? 'decimal' : 'numeric'}
                min={options.min || '1'}
                step={options.step || '1'}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className={fieldClass(error)}
                aria-invalid={Boolean(error)}
            />
            {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20" noValidate>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">Ad-hoc exercise</p>
                    <h2 className="mt-1 break-words text-lg font-black text-gray-900 dark:text-white">{exercise.exerciseName}</h2>
                    <p className="mt-1 text-xs font-bold text-gray-400">{exercise.targetMuscleName} · {exercise.muscleGroupName}</p>
                </div>
                <button type="button" onClick={() => setExercise(null)} className="flex-none rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-800 dark:text-blue-300">Change</button>
            </div>

            {apiError && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{apiError}</div>}

            <div className="mt-5 grid grid-cols-2 gap-3">
                {numberField('adhoc-set-count', 'Planned Set Count', plannedSetCount, setPlannedSetCount, errors.plannedSetCount)}
                <label className="flex min-h-[68px] cursor-pointer items-center gap-3 self-end rounded-xl border border-blue-100 bg-white/60 px-3 text-sm font-bold text-gray-700 dark:border-blue-900/40 dark:bg-gray-900/50 dark:text-gray-200">
                    <input type="checkbox" checked={isOptional} onChange={(event) => setIsOptional(event.target.checked)} className="h-5 w-5 accent-blue-600" />
                    Is Optional
                </label>

                {hasReps && <>
                    {numberField('adhoc-rep-min', 'Rep Min', repMin, setRepMin, errors.repMin)}
                    {numberField('adhoc-rep-max', 'Rep Max', repMax, setRepMax, errors.repMax)}
                </>}

                {isDuration && <div className="col-span-2">{numberField('adhoc-duration', 'Target Duration Seconds', targetDurationSeconds, setTargetDurationSeconds, errors.targetDurationSeconds)}</div>}
                {hasWeight && <div className="col-span-2">{numberField('adhoc-weight', `Suggested Weight Kg${exercise.exerciseType === 'RepsWithOptionalWeight' ? ' (Optional)' : ''}`, suggestedWeightKg, setSuggestedWeightKg, errors.suggestedWeightKg, { min: '0', step: 'any' })}</div>}
            </div>

            <div className="mt-4">
                <label htmlFor="adhoc-notes" className={labelClass}>Exercise Notes</label>
                <textarea id="adhoc-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Optional notes for this exercise..." className={fieldClass()} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={onClose} disabled={isSaving} className="min-h-12 rounded-xl bg-gray-100 font-bold text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={isSaving} className="app-primary min-h-12 rounded-xl bg-blue-600 font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">{isSaving ? 'Adding...' : 'Add Exercise'}</button>
            </div>
        </form>
    );
};

export default AdHocExerciseForm;
