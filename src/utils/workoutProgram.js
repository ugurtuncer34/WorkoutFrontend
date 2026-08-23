export const WORKOUT_PROGRAM_STEP_TYPE = {
    Template: 0,
    Rest: 1
};

export const orderedProgramSteps = (steps = []) => [...steps].sort((a, b) => (
    a.position - b.position || (a.programStepId || 0) - (b.programStepId || 0)
));

export const isRestStep = (step) => step?.stepType === 'Rest' || step?.stepType === WORKOUT_PROGRAM_STEP_TYPE.Rest;

export const getProgramStepName = (step) => {
    if (!step) return 'Unknown step';
    if (step.label?.trim()) return step.label.trim();
    if (isRestStep(step)) return 'Rest';
    return step.workoutTemplateName || step.templateName || 'Template workout';
};

export const getProgramStepSecondary = (step) => {
    if (!step || isRestStep(step)) return '';
    const name = step.workoutTemplateName || step.templateName || '';
    const category = step.workoutTemplateCategory || step.templateCategory || '';
    if (step.label?.trim() && name) return category ? `${name} · ${category}` : name;
    return category;
};
