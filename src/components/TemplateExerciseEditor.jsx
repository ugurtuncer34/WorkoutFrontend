import React from 'react';

const fieldClass = (hasError) => `w-full rounded-xl border bg-white px-3 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-900 dark:text-gray-200 ${hasError ? 'border-red-400 dark:border-red-700' : 'border-blue-200 dark:border-blue-800/50'}`;
const labelClass = 'mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400';

const NumericField = ({ id, label, value, onChange, min, step = '1', error }) => (
    <div>
        <label htmlFor={id} className={labelClass}>{label}</label>
        <input
            id={id}
            type="number"
            inputMode={step === '1' ? 'numeric' : 'decimal'}
            min={min}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={fieldClass(error)}
        />
        {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
    </div>
);

const TemplateExerciseEditor = ({ exercise, index, total, errors = {}, onChange, onMove, onRemove }) => {
    const isDuration = exercise.exerciseType === 'DurationOnly';
    const hasReps = ['RepsAndWeight', 'RepsWithOptionalWeight', 'RepsOnly'].includes(exercise.exerciseType);
    const hasWeight = ['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise.exerciseType);

    return (
        <article className={`rounded-3xl border-2 bg-white p-5 shadow-sm dark:bg-gray-800 ${errors.general ? 'border-red-300 dark:border-red-900/60' : 'border-gray-100 dark:border-gray-700'}`}>
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="break-words font-black text-gray-900 dark:text-white">{exercise.exerciseName}</h3>
                    <p className="mt-1 break-words text-xs font-bold text-gray-400">
                        {exercise.exerciseType} · {exercise.targetMuscleName || 'Unknown target'} · {exercise.muscleGroupName || 'Unknown group'}
                    </p>
                    {exercise.isOptional && (
                        <span className="mt-2 inline-block rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:bg-amber-950/30 dark:text-amber-300">Optional</span>
                    )}
                </div>
            </div>

            {errors.general && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400" role="alert">
                    {errors.general}
                </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
                <NumericField
                    id={`sets-${exercise.exerciseId}`}
                    label="Target Set Count"
                    value={exercise.targetSetCount}
                    min="1"
                    error={errors.targetSetCount}
                    onChange={(value) => onChange({ targetSetCount: value })}
                />

                <label className="flex min-h-[68px] cursor-pointer items-center gap-3 self-end rounded-xl border border-blue-100 bg-blue-50/40 px-3 text-sm font-bold text-gray-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-gray-200">
                    <input
                        type="checkbox"
                        checked={exercise.isOptional}
                        onChange={(event) => onChange({ isOptional: event.target.checked })}
                        className="h-5 w-5 accent-blue-600"
                    />
                    Is Optional
                </label>

                {hasReps && (
                    <>
                        <NumericField
                            id={`rep-min-${exercise.exerciseId}`}
                            label="Rep Min"
                            value={exercise.repMin}
                            min="1"
                            error={errors.repMin}
                            onChange={(value) => onChange({ repMin: value })}
                        />
                        <NumericField
                            id={`rep-max-${exercise.exerciseId}`}
                            label="Rep Max"
                            value={exercise.repMax}
                            min="1"
                            error={errors.repMax}
                            onChange={(value) => onChange({ repMax: value })}
                        />
                    </>
                )}

                {isDuration && (
                    <div className="col-span-2">
                        <NumericField
                            id={`duration-${exercise.exerciseId}`}
                            label="Target Duration Seconds"
                            value={exercise.targetDurationSeconds}
                            min="1"
                            error={errors.targetDurationSeconds}
                            onChange={(value) => onChange({ targetDurationSeconds: value })}
                        />
                    </div>
                )}

                {hasWeight && (
                    <div className="col-span-2">
                        <NumericField
                            id={`weight-${exercise.exerciseId}`}
                            label={`Suggested Weight Kg${exercise.exerciseType === 'RepsWithOptionalWeight' ? ' (Optional)' : ''}`}
                            value={exercise.suggestedWeightKg}
                            min="0"
                            step="any"
                            error={errors.suggestedWeightKg}
                            onChange={(value) => onChange({ suggestedWeightKg: value })}
                        />
                    </div>
                )}
            </div>

            <div className="mt-4">
                <label htmlFor={`notes-${exercise.exerciseId}`} className={labelClass}>Exercise Notes</label>
                <textarea
                    id={`notes-${exercise.exerciseId}`}
                    value={exercise.notes}
                    onChange={(event) => onChange({ notes: event.target.value })}
                    rows={2}
                    placeholder="Optional notes for this exercise..."
                    className={fieldClass(false)}
                />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="min-h-11 rounded-xl bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-35 dark:bg-gray-700 dark:text-gray-200">↑ Up</button>
                <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="min-h-11 rounded-xl bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-35 dark:bg-gray-700 dark:text-gray-200">↓ Down</button>
                <button
                    type="button"
                    data-remove-exercise
                    onClick={(event) => onRemove(event.currentTarget)}
                    className="min-h-11 rounded-xl bg-red-50 text-xs font-black uppercase tracking-wider text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-red-950/30 dark:text-red-400"
                >
                    Remove
                </button>
            </div>
        </article>
    );
};

export default TemplateExerciseEditor;
