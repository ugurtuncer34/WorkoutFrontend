import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { api } from '../api/axiosInstance';
import { createWorkoutProgram, getWorkoutProgram, updateWorkoutProgram } from '../api/workoutPrograms';
import { getApiErrorMessage } from '../api/apiError';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { WORKOUT_PROGRAM_STEP_TYPE, getProgramStepName, isRestStep, orderedProgramSteps } from '../utils/workoutProgram';

const createClientKey = () => globalThis.crypto?.randomUUID?.() || `step-${Date.now()}-${Math.random()}`;

const normalizeStep = (step) => ({
    clientKey: step.programStepId ? `program-step-${step.programStepId}` : createClientKey(),
    programStepId: step.programStepId || null,
    stepType: isRestStep(step) ? WORKOUT_PROGRAM_STEP_TYPE.Rest : WORKOUT_PROGRAM_STEP_TYPE.Template,
    workoutTemplateId: step.workoutTemplateId ?? null,
    workoutTemplateName: step.workoutTemplateName || '',
    workoutTemplateCategory: step.workoutTemplateCategory || '',
    workoutTemplateIsArchived: step.workoutTemplateIsArchived ?? null,
    label: step.label || ''
});

const ProgramEditor = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const location = useLocation();
    const shouldReduceMotion = useReducedMotion();
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [steps, setSteps] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [stepToRemove, setStepToRemove] = useState(null);
    const headingRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setIsLoading(true);
        setLoadError('');

        const programRequest = isEditMode
            ? getWorkoutProgram(id, { signal: controller.signal })
            : Promise.resolve(null);
        const templatesRequest = api.get('/workout-templates', { signal: controller.signal });

        Promise.all([programRequest, templatesRequest])
            .then(([program, templateResponse]) => {
                if (!active) return;
                setTemplates(templateResponse.data.data || []);
                if (program) {
                    setName(program.name || '');
                    setNotes(program.notes || '');
                    setSteps(orderedProgramSteps(program.steps).map(normalizeStep));
                    setIsActive(Boolean(program.isActive));
                }
                setIsDirty(false);
            })
            .catch((requestError) => {
                if (requestError.code === 'ERR_CANCELED' || requestError.name === 'CanceledError') return;
                console.error('Failed to load program editor', requestError);
                if (active) setLoadError(getApiErrorMessage(requestError, 'Unable to load the program editor.'));
            })
            .finally(() => { if (active) setIsLoading(false); });

        return () => {
            active = false;
            controller.abort();
        };
    }, [id, isEditMode]);

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
        if (isDirty && !window.confirm('Discard your unsaved program changes?')) return;
        navigate('/programs');
    };

    const addTemplateStep = () => {
        const template = templates.find((item) => item.id === Number(selectedTemplateId));
        if (!template) {
            setErrors((current) => ({ ...current, picker: 'Choose an active workout template.' }));
            return;
        }
        setSteps((current) => [...current, normalizeStep({
            stepType: 'Template',
            workoutTemplateId: template.id,
            workoutTemplateName: template.name,
            workoutTemplateCategory: template.category,
            workoutTemplateIsArchived: false
        })]);
        setSelectedTemplateId('');
        setErrors((current) => ({ ...current, picker: '', steps: '' }));
        markChanged();
    };

    const addRestStep = () => {
        setSteps((current) => [...current, normalizeStep({ stepType: 'Rest', workoutTemplateId: null })]);
        setErrors((current) => ({ ...current, steps: '' }));
        markChanged();
    };

    const updateStep = (clientKey, changes) => {
        setSteps((current) => current.map((step) => step.clientKey === clientKey ? { ...step, ...changes } : step));
        setErrors((current) => ({ ...current, steps: '' }));
        markChanged();
    };

    const moveStep = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= steps.length) return;
        setSteps((current) => {
            const next = [...current];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return next;
        });
        markChanged();
    };

    const removeStep = () => {
        if (!stepToRemove) return;
        setSteps((current) => current.filter((step) => step.clientKey !== stepToRemove.clientKey));
        setStepToRemove(null);
        setErrors((current) => ({ ...current, steps: '' }));
        markChanged();
        headingRef.current?.focus();
    };

    const validate = () => {
        const nextErrors = {};
        const trimmedName = name.trim();
        if (!trimmedName) nextErrors.name = 'Program name is required.';
        else if (trimmedName.length > 100) nextErrors.name = 'Program name must be 100 characters or fewer.';
        if (notes.trim().length > 1000) nextErrors.notes = 'Notes must be 1,000 characters or fewer.';
        if (steps.length === 0) nextErrors.steps = 'Add at least one program step.';
        if (steps.some((step) => step.label.trim().length > 200)) nextErrors.steps = 'Step labels must be 200 characters or fewer.';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const buildPayload = () => ({
        name: name.trim(),
        notes: notes.trim() || null,
        steps: steps.map((step, index) => ({
            position: index + 1,
            stepType: Number(step.stepType),
            workoutTemplateId: step.stepType === WORKOUT_PROGRAM_STEP_TYPE.Rest ? null : Number(step.workoutTemplateId),
            label: step.label.trim() || null
        }))
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setApiError('');
        setSuccessMessage('');
        if (!validate() || isActive) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateWorkoutProgram(id, buildPayload());
                setIsDirty(false);
                setSuccessMessage('Program updated successfully.');
            } else {
                const created = await createWorkoutProgram(buildPayload());
                setIsDirty(false);
                navigate(`/programs/${created.id}/edit`, { replace: true, state: { message: 'Program created successfully.' } });
            }
        } catch (requestError) {
            console.error('Failed to save workout program', requestError);
            setApiError(getApiErrorMessage(requestError, 'Unable to save this program. Your changes are still here.'));
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = (hasError) => `w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-900 dark:text-gray-200 ${hasError ? 'border-red-400 dark:border-red-700' : 'border-blue-200 dark:border-blue-800/50'}`;
    const labelClass = 'mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400';

    if (isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 dark:bg-gray-900"><p className="animate-pulse font-semibold text-gray-400">Loading program...</p></div>;
    if (loadError) return <div className="min-h-[100dvh] bg-gray-50 p-4 dark:bg-gray-900"><div className="mx-auto mt-16 max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center dark:border-red-900/30 dark:bg-gray-800"><p className="font-bold text-red-600 dark:text-red-400">{loadError}</p><button type="button" onClick={() => navigate('/programs')} className="app-primary mt-5 min-h-12 w-full rounded-xl bg-blue-600 font-bold text-white">Back to Programs</button></div></div>;

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-4 transition-colors dark:bg-gray-900">
            <main className="mx-auto w-full max-w-md pt-4">
                <header className="mb-6 flex items-center gap-4 pr-12"><button type="button" onClick={handleBack} aria-label="Back to programs" className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">←</button><div className="min-w-0"><h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{isEditMode ? 'Edit Program' : 'New Program'}</h1><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">Ordered rolling cycle</p></div></header>

                {isActive && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">This program is active. Deactivate it before editing its definition.</div>}
                {apiError && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{apiError}</div>}
                {successMessage && <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-600 dark:border-green-900/30 dark:bg-green-950/30 dark:text-green-400" role="status">{successMessage}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <fieldset disabled={isActive || isSaving} className="disabled:opacity-75">
                        <section className="rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <div><label htmlFor="program-name" className={labelClass}>Name</label><input id="program-name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: '' })); markChanged(); }} maxLength={100} placeholder="e.g. PPL A/B" className={inputClass(errors.name)} aria-invalid={Boolean(errors.name)} />{errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}</div>
                            <div className="mt-4"><label htmlFor="program-notes" className={labelClass}>Notes</label><textarea id="program-notes" value={notes} onChange={(event) => { setNotes(event.target.value); setErrors((current) => ({ ...current, notes: '' })); markChanged(); }} rows={3} maxLength={1000} placeholder="Optional program notes..." className={inputClass(errors.notes)} />{errors.notes && <p className="mt-1 text-xs font-bold text-red-500">{errors.notes}</p>}</div>
                        </section>

                        <section className="mt-5 rounded-3xl border-2 border-blue-100/60 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Add Step</h2><p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-600/60 dark:text-blue-400/60">Templates may be reused</p>
                            {errors.picker && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">{errors.picker}</div>}
                            <label htmlFor="program-template" className={`${labelClass} mt-4`}>Active Template</label>
                            <select id="program-template" value={selectedTemplateId} onChange={(event) => { setSelectedTemplateId(event.target.value); setErrors((current) => ({ ...current, picker: '' })); }} className={inputClass(false)}><option value="">Choose a template...</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.category}</option>)}</select>
                            <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={addTemplateStep} disabled={!selectedTemplateId || isActive || isSaving} className="app-primary min-h-12 rounded-xl bg-blue-600 px-2 text-xs font-black uppercase tracking-wider text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">Add Template Step</button><button type="button" onClick={addRestStep} disabled={isActive || isSaving} className="min-h-12 rounded-xl border-2 border-blue-200 bg-white px-2 text-xs font-black uppercase tracking-wider text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-gray-800 dark:text-blue-300">Add Rest Step</button></div>
                        </section>

                        <section className="mt-7">
                            <div className="mb-4 flex items-end justify-between gap-3 px-1"><div><h2 ref={headingRef} tabIndex="-1" className="text-lg font-black text-gray-900 outline-none dark:text-white">Ordered Steps</h2><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Positions 1–{steps.length || 0}</p></div><span className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{steps.length}</span></div>
                            {errors.steps && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">{errors.steps}</div>}
                            <div className="relative space-y-4"><AnimatePresence initial={false}>{steps.length === 0 ? <motion.div key="empty-program-steps" layout={shouldReduceMotion ? false : 'position'} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeInOut' }} className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">Add a template or Rest step to begin.</motion.div> : steps.map((step, index) => <motion.article key={step.clientKey} layout={shouldReduceMotion ? false : 'position'} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={shouldReduceMotion ? { duration: 0 } : { layout: { duration: 0.2, ease: 'easeOut' }, opacity: { duration: 0.14, ease: 'easeOut' }, height: { duration: 0.18, ease: 'easeOut' }, y: { duration: 0.18, ease: 'easeOut' } }} className="overflow-hidden rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex items-start gap-3"><span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">{step.stepType === WORKOUT_PROGRAM_STEP_TYPE.Rest ? 'Rest Step' : 'Template Step'}</p><h3 className="mt-1 break-words font-black text-gray-900 dark:text-white">{step.stepType === WORKOUT_PROGRAM_STEP_TYPE.Rest ? 'Rest' : step.workoutTemplateName}</h3>{step.stepType === WORKOUT_PROGRAM_STEP_TYPE.Template && <p className="mt-1 text-xs font-bold text-gray-400">{step.workoutTemplateCategory}</p>}</div></div>
                                <div className="mt-4"><label htmlFor={`program-step-label-${step.clientKey}`} className={labelClass}>Optional Label</label><input id={`program-step-label-${step.clientKey}`} value={step.label} onChange={(event) => updateStep(step.clientKey, { label: event.target.value })} maxLength={200} placeholder={step.stepType === WORKOUT_PROGRAM_STEP_TYPE.Rest ? 'Rest' : 'e.g. Heavy Push'} className={inputClass(false)} /></div>
                                <div className="mt-5 grid grid-cols-3 gap-2"><button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0 || isActive || isSaving} className="min-h-11 rounded-xl bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-35 dark:bg-gray-700 dark:text-gray-200">↑ Up</button><button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1 || isActive || isSaving} className="min-h-11 rounded-xl bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-35 dark:bg-gray-700 dark:text-gray-200">↓ Down</button><button type="button" onClick={() => setStepToRemove(step)} disabled={isActive || isSaving} className="min-h-11 rounded-xl bg-red-50 text-xs font-black uppercase tracking-wider text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 dark:bg-red-950/30 dark:text-red-400">Remove</button></div>
                            </motion.article>)}</AnimatePresence></div>
                        </section>
                    </fieldset>

                    <button type="submit" disabled={isSaving || isActive} className="app-primary mt-6 min-h-14 w-full rounded-2xl bg-blue-600 font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50">{isSaving ? 'Saving Program...' : isActive ? 'Deactivate to Edit' : isEditMode ? 'Save Changes' : 'Create Program'}</button>
                </form>
            </main>

            {stepToRemove && <ConfirmationDialog title="Remove Step?" description={`“${getProgramStepName(stepToRemove)}” will be removed from this program. Positions will be regenerated when you save.`} confirmLabel="Remove" tone="danger" onClose={() => setStepToRemove(null)} onConfirm={removeStep} />}
        </div>
    );
};

export default ProgramEditor;
