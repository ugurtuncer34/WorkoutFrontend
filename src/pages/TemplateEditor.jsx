import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';
import ExercisePicker from '../components/ExercisePicker';
import RemoveExerciseDialog from '../components/RemoveExerciseDialog';
import TemplateExerciseEditor from '../components/TemplateExerciseEditor';

const CATEGORY_OPTIONS = [
    { value: 0, response: 'Push', label: 'Push' },
    { value: 1, response: 'Pull', label: 'Pull' },
    { value: 2, response: 'Lower', label: 'Lower' },
    { value: 3, response: 'FullBody', label: 'Full Body' },
    { value: 4, response: 'Other', label: 'Other' }
];

const CATEGORY_RESPONSE_TO_VALUE = Object.fromEntries(
    CATEGORY_OPTIONS.map((category) => [category.response, String(category.value)])
);

const blankToNumberOrNull = (value) => {
    if (value === '' || value == null) return null;
    return Number(value);
};

const displayNumber = (value) => {
    if (value === '' || value == null) return '';
    return Number(value).toString();
};

const normalizeExercise = (exercise) => {
    const isDuration = exercise.exerciseType === 'DurationOnly';
    const hasWeight = ['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise.exerciseType);

    return {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        exerciseType: exercise.exerciseType,
        iconKey: exercise.iconKey,
        targetMuscleId: exercise.targetMuscleId,
        targetMuscleName: exercise.targetMuscleName,
        muscleGroupId: exercise.muscleGroupId,
        muscleGroupName: exercise.muscleGroupName,
        targetSetCount: displayNumber(exercise.targetSetCount ?? 3),
        repMin: isDuration ? '' : displayNumber(exercise.repMin),
        repMax: isDuration ? '' : displayNumber(exercise.repMax),
        targetDurationSeconds: isDuration ? displayNumber(exercise.targetDurationSeconds) : '',
        suggestedWeightKg: hasWeight ? displayNumber(exercise.suggestedWeightKg) : '',
        notes: exercise.notes || '',
        isOptional: Boolean(exercise.isOptional)
    };
};

const createPickedExercise = (exercise) => normalizeExercise({
    ...exercise,
    targetSetCount: 3,
    repMin: null,
    repMax: null,
    targetDurationSeconds: null,
    suggestedWeightKg: null,
    notes: null,
    isOptional: false
});

const validatePositiveIntegerIfPresent = (value, label) => {
    if (value === '' || value == null) return '';
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) return `${label} must be a positive whole number.`;
    return '';
};

const TemplateEditor = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const location = useLocation();
    const shouldReduceMotion = useReducedMotion();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('4');
    const [notes, setNotes] = useState('');
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const [errors, setErrors] = useState({ exercises: {} });
    const [isDirty, setIsDirty] = useState(false);
    const [exerciseToRemove, setExerciseToRemove] = useState(null);
    const orderedListRef = useRef(null);
    const orderedListHeadingRef = useRef(null);
    const removalFocusIndexRef = useRef(null);

    const fetchTemplate = useCallback(async () => {
        if (!isEditMode) return;
        setIsLoading(true);
        setLoadError('');
        try {
            const response = await api.get(`/workout-templates/${id}`);
            const template = response.data.data;
            setName(template.name || '');
            setCategory(CATEGORY_RESPONSE_TO_VALUE[template.category] ?? '4');
            setNotes(template.notes || '');
            setExercises(
                [...(template.exercises || [])]
                    .sort((a, b) => a.position - b.position)
                    .map(normalizeExercise)
            );
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to fetch workout template', error);
            setLoadError(getApiErrorMessage(error, 'Unable to load this template.'));
        } finally {
            setIsLoading(false);
        }
    }, [id, isEditMode]);

    useEffect(() => {
        fetchTemplate();
    }, [fetchTemplate]);

    useEffect(() => {
        const warnBeforeUnload = (event) => {
            if (!isDirty || isSaving) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeUnload);
        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [isDirty, isSaving]);

    const markChanged = () => {
        setIsDirty(true);
        setSuccessMessage('');
    };

    const handleBack = () => {
        if (isDirty && !window.confirm('Discard your unsaved template changes?')) return;
        navigate('/templates');
    };

    const handleAddExercise = (exercise) => {
        setExercises((current) => [...current, createPickedExercise(exercise)]);
        setErrors((current) => ({ ...current, exerciseList: '', duplicate: '' }));
        markChanged();
    };

    const handleExerciseChange = (index, changes) => {
        setExercises((current) => current.map((exercise, exerciseIndex) => (
            exerciseIndex === index ? { ...exercise, ...changes } : exercise
        )));
        setErrors((current) => {
            const nextExerciseErrors = { ...current.exercises };
            delete nextExerciseErrors[index];
            return { ...current, exercises: nextExerciseErrors };
        });
        markChanged();
    };

    const handleMove = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= exercises.length) return;
        setExercises((current) => {
            const next = [...current];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return next;
        });
        setErrors((current) => ({ ...current, exercises: {} }));
        markChanged();
    };

    const handleRemove = (index) => {
        setExercises((current) => current.filter((_, exerciseIndex) => exerciseIndex !== index));
        setErrors((current) => ({ ...current, exercises: {} }));
        markChanged();
    };

    const handleRemoveRequest = (exercise, triggerElement) => {
        setExerciseToRemove({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            triggerElement
        });
    };

    const handleRemoveConfirm = () => {
        const exerciseIndex = exercises.findIndex(
            (exercise) => exercise.exerciseId === exerciseToRemove.exerciseId
        );
        setExerciseToRemove(null);

        if (exerciseIndex === -1) return;
        removalFocusIndexRef.current = exerciseIndex;
        handleRemove(exerciseIndex);
    };

    const handleRemovalExitComplete = () => {
        if (removalFocusIndexRef.current == null) return;

        const removeButtons = orderedListRef.current?.querySelectorAll('[data-remove-exercise]') || [];
        const focusIndex = Math.min(removalFocusIndexRef.current, removeButtons.length - 1);
        const focusTarget = removeButtons[focusIndex] || orderedListHeadingRef.current;
        focusTarget?.focus();
        removalFocusIndexRef.current = null;
    };

    const validate = () => {
        const nextErrors = { exercises: {} };
        const trimmedName = name.trim();

        if (!trimmedName) nextErrors.name = 'Template name is required.';
        else if (trimmedName.length > 100) nextErrors.name = 'Template name must be 100 characters or fewer.';

        if (exercises.length === 0) nextErrors.exerciseList = 'Add at least one exercise.';

        const seenIds = new Set();
        exercises.forEach((exercise, index) => {
            const exerciseErrors = {};
            if (seenIds.has(exercise.exerciseId)) {
                exerciseErrors.general = 'This exercise appears more than once. Remove the duplicate.';
                nextErrors.duplicate = 'A template cannot contain duplicate exercises.';
            }
            seenIds.add(exercise.exerciseId);

            const targetSetCount = Number(exercise.targetSetCount);
            if (!Number.isInteger(targetSetCount) || targetSetCount < 1) {
                exerciseErrors.targetSetCount = 'Set count must be a whole number of at least 1.';
            }

            if (exercise.exerciseType !== 'DurationOnly') {
                const repMinError = validatePositiveIntegerIfPresent(exercise.repMin, 'Rep min');
                const repMaxError = validatePositiveIntegerIfPresent(exercise.repMax, 'Rep max');
                if (repMinError) exerciseErrors.repMin = repMinError;
                if (repMaxError) exerciseErrors.repMax = repMaxError;
                if (!repMinError && !repMaxError && exercise.repMin !== '' && exercise.repMax !== '' && Number(exercise.repMin) > Number(exercise.repMax)) {
                    exerciseErrors.repMax = 'Rep max must be greater than or equal to rep min.';
                }
            }

            if (exercise.exerciseType === 'DurationOnly') {
                const durationError = validatePositiveIntegerIfPresent(exercise.targetDurationSeconds, 'Duration');
                if (durationError) exerciseErrors.targetDurationSeconds = durationError;
            }

            if (['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise.exerciseType) && exercise.suggestedWeightKg !== '') {
                const weight = Number(exercise.suggestedWeightKg);
                if (!Number.isFinite(weight) || weight < 0) {
                    exerciseErrors.suggestedWeightKg = 'Suggested weight cannot be negative.';
                }
            }

            if (Object.keys(exerciseErrors).length) nextErrors.exercises[index] = exerciseErrors;
        });

        setErrors(nextErrors);
        return !nextErrors.name && !nextErrors.exerciseList && !nextErrors.duplicate && Object.keys(nextErrors.exercises).length === 0;
    };

    const buildPayload = () => ({
        name: name.trim(),
        category: Number(category),
        notes: notes.trim() || null,
        exercises: exercises.map((exercise, index) => {
            const isDuration = exercise.exerciseType === 'DurationOnly';
            const hasWeight = ['RepsAndWeight', 'RepsWithOptionalWeight'].includes(exercise.exerciseType);
            return {
                exerciseId: exercise.exerciseId,
                position: index + 1,
                targetSetCount: Number(exercise.targetSetCount),
                repMin: isDuration ? null : blankToNumberOrNull(exercise.repMin),
                repMax: isDuration ? null : blankToNumberOrNull(exercise.repMax),
                targetDurationSeconds: isDuration ? blankToNumberOrNull(exercise.targetDurationSeconds) : null,
                suggestedWeightKg: hasWeight ? blankToNumberOrNull(exercise.suggestedWeightKg) : null,
                notes: exercise.notes.trim() || null,
                isOptional: exercise.isOptional
            };
        })
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setApiError('');
        setSuccessMessage('');
        if (!validate()) return;

        setIsSaving(true);
        try {
            if (isEditMode) {
                await api.put(`/workout-templates/${id}`, buildPayload());
                setIsDirty(false);
                setSuccessMessage('Template updated successfully.');
            } else {
                const response = await api.post('/workout-templates', buildPayload());
                setIsDirty(false);
                navigate(`/templates/${response.data.data.id}/edit`, {
                    replace: true,
                    state: { message: 'Template created successfully.' }
                });
            }
        } catch (error) {
            console.error('Failed to save workout template', error);
            setApiError(getApiErrorMessage(error, 'Unable to save this template. Your changes are still here.'));
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = (hasError) => `w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-900 dark:text-gray-200 ${hasError ? 'border-red-400 dark:border-red-700' : 'border-blue-200 dark:border-blue-800/50'}`;
    const labelClass = 'mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400';

    if (isLoading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900">
                <p className="animate-pulse font-semibold text-gray-400">Loading template...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mx-auto mt-16 max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center dark:border-red-900/30 dark:bg-gray-800">
                    <p className="font-bold text-red-600 dark:text-red-400">{loadError}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button type="button" onClick={handleBack} className="min-h-12 rounded-xl bg-gray-100 font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200">Back</button>
                        <button type="button" onClick={fetchTemplate} className="min-h-12 rounded-xl bg-blue-600 font-bold text-white">Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-4 transition-colors dark:bg-gray-900">
            <main className="mx-auto w-full max-w-md pt-4">
                <header className="mb-6 flex items-center gap-4 pr-12">
                    <button type="button" onClick={handleBack} aria-label="Back to templates" className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">←</button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            {isEditMode ? 'Edit Template' : 'New Template'}
                        </h1>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">Complete workout definition</p>
                    </div>
                </header>

                {apiError && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{apiError}</div>}
                {successMessage && <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-600 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-400" role="status">{successMessage}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <section className="rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="template-name" className={labelClass}>Name</label>
                                <input
                                    id="template-name"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setErrors((current) => ({ ...current, name: '' }));
                                        markChanged();
                                    }}
                                    maxLength={100}
                                    placeholder="e.g. Pull A"
                                    className={inputClass(errors.name)}
                                    aria-invalid={Boolean(errors.name)}
                                />
                                <div className="mt-1 flex justify-between gap-3">
                                    {errors.name ? <p className="text-xs font-bold text-red-500">{errors.name}</p> : <span />}
                                    <span className="flex-none text-[10px] font-bold text-gray-400">{name.length}/100</span>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="template-category" className={labelClass}>Category</label>
                                <select id="template-category" value={category} onChange={(event) => { setCategory(event.target.value); markChanged(); }} className={inputClass(false)}>
                                    {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                                <p className="mt-1 text-[10px] font-medium text-gray-400">Organizational only; it is never inferred from exercises.</p>
                            </div>

                            <div>
                                <label htmlFor="template-notes" className={labelClass}>Notes</label>
                                <textarea id="template-notes" value={notes} onChange={(event) => { setNotes(event.target.value); markChanged(); }} rows={3} placeholder="Optional template notes..." className={inputClass(false)} />
                            </div>
                        </div>
                    </section>

                    <div className="mt-5">
                        <ExercisePicker existingExerciseIds={exercises.map((exercise) => exercise.exerciseId)} onAdd={handleAddExercise} />
                    </div>

                    <section className="mt-7">
                        <div className="mb-4 flex items-end justify-between gap-3 px-1">
                            <div>
                                <h2 ref={orderedListHeadingRef} tabIndex="-1" className="text-lg font-black text-gray-900 outline-none dark:text-white">Ordered Exercises</h2>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Positions 1–{exercises.length || 0}</p>
                            </div>
                            <span className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{exercises.length}</span>
                        </div>

                        {(errors.exerciseList || errors.duplicate) && (
                            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">
                                {errors.exerciseList || errors.duplicate}
                            </div>
                        )}

                        <div ref={orderedListRef} className="relative space-y-4">
                            <AnimatePresence initial={false} mode="popLayout" onExitComplete={handleRemovalExitComplete}>
                                {exercises.length === 0 ? (
                                    <motion.div
                                        key="empty-exercise-list"
                                        layout={shouldReduceMotion ? false : 'position'}
                                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeInOut' }}
                                        className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        Use the picker above to add the first exercise.
                                    </motion.div>
                                ) : (
                                    exercises.map((exercise, index) => (
                                        <motion.div
                                            key={exercise.exerciseId}
                                            layout={shouldReduceMotion ? false : 'position'}
                                            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
                                            transition={shouldReduceMotion ? { duration: 0 } : {
                                                    layout: { duration: 0.22, ease: 'easeInOut' },
                                                    opacity: { duration: 0.18 },
                                                    scale: { duration: 0.18 },
                                                    y: { duration: 0.18 }
                                                }}
                                            className="w-full"
                                        >
                                            <TemplateExerciseEditor
                                                exercise={exercise}
                                                index={index}
                                                total={exercises.length}
                                                errors={errors.exercises?.[index]}
                                                onChange={(changes) => handleExerciseChange(index, changes)}
                                                onMove={(direction) => handleMove(index, direction)}
                                                onRemove={(triggerElement) => handleRemoveRequest(exercise, triggerElement)}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    <button type="submit" disabled={isSaving} className="mt-6 min-h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">
                        {isSaving ? 'Saving Template...' : (isEditMode ? 'Save Changes' : 'Create Template')}
                    </button>
                </form>
            </main>

            {exerciseToRemove && (
                <RemoveExerciseDialog
                    exerciseName={exerciseToRemove.exerciseName}
                    returnFocusElement={exerciseToRemove.triggerElement}
                    onClose={() => setExerciseToRemove(null)}
                    onConfirm={handleRemoveConfirm}
                />
            )}
        </div>
    );
};

export default TemplateEditor;
