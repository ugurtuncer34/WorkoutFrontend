const ACTIVE_SESSION_ID_KEY = 'activeSessionId';
const ACTIVE_SESSION_MODE_KEY = 'activeSessionMode';
const ACTIVE_TEMPLATE_NAME_KEY = 'activeTemplateName';
const ACTIVE_TEMPLATE_CATEGORY_KEY = 'activeTemplateCategory';
const ACTIVE_PROGRAM_NAME_KEY = 'activeProgramName';
const ACTIVE_PROGRAM_STEP_LABEL_KEY = 'activeProgramStepLabel';
const ACTIVE_PROGRAM_CYCLE_KEY = 'activeProgramCycle';

export const getActiveSession = () => ({
    sessionId: localStorage.getItem(ACTIVE_SESSION_ID_KEY),
    mode: localStorage.getItem(ACTIVE_SESSION_MODE_KEY) || 'quick',
    templateName: localStorage.getItem(ACTIVE_TEMPLATE_NAME_KEY) || '',
    templateCategory: localStorage.getItem(ACTIVE_TEMPLATE_CATEGORY_KEY) || '',
    programName: localStorage.getItem(ACTIVE_PROGRAM_NAME_KEY) || '',
    programStepLabel: localStorage.getItem(ACTIVE_PROGRAM_STEP_LABEL_KEY) || '',
    programCycle: localStorage.getItem(ACTIVE_PROGRAM_CYCLE_KEY) || ''
});

const clearProgramMetadata = () => {
    localStorage.removeItem(ACTIVE_PROGRAM_NAME_KEY);
    localStorage.removeItem(ACTIVE_PROGRAM_STEP_LABEL_KEY);
    localStorage.removeItem(ACTIVE_PROGRAM_CYCLE_KEY);
};

export const setQuickSession = (sessionId) => {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, String(sessionId));
    localStorage.setItem(ACTIVE_SESSION_MODE_KEY, 'quick');
    localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
    clearProgramMetadata();
};

export const setTemplateSession = (sessionId, metadata = {}) => {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, String(sessionId));
    localStorage.setItem(ACTIVE_SESSION_MODE_KEY, 'template');

    if (metadata.templateName) {
        localStorage.setItem(ACTIVE_TEMPLATE_NAME_KEY, metadata.templateName);
    } else {
        localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    }

    if (metadata.templateCategory) {
        localStorage.setItem(ACTIVE_TEMPLATE_CATEGORY_KEY, metadata.templateCategory);
    } else {
        localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
    }
    clearProgramMetadata();
};

export const setProgramSession = (sessionId, metadata = {}) => {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, String(sessionId));
    localStorage.setItem(ACTIVE_SESSION_MODE_KEY, 'program');

    if (metadata.templateName) localStorage.setItem(ACTIVE_TEMPLATE_NAME_KEY, metadata.templateName);
    else localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    if (metadata.templateCategory) localStorage.setItem(ACTIVE_TEMPLATE_CATEGORY_KEY, metadata.templateCategory);
    else localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
    if (metadata.programName) localStorage.setItem(ACTIVE_PROGRAM_NAME_KEY, metadata.programName);
    else localStorage.removeItem(ACTIVE_PROGRAM_NAME_KEY);
    if (metadata.programStepLabel) localStorage.setItem(ACTIVE_PROGRAM_STEP_LABEL_KEY, metadata.programStepLabel);
    else localStorage.removeItem(ACTIVE_PROGRAM_STEP_LABEL_KEY);
    if (metadata.programCycle != null) localStorage.setItem(ACTIVE_PROGRAM_CYCLE_KEY, String(metadata.programCycle));
    else localStorage.removeItem(ACTIVE_PROGRAM_CYCLE_KEY);
};

export const clearActiveSession = () => {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    localStorage.removeItem(ACTIVE_SESSION_MODE_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
    clearProgramMetadata();
};

export const getActiveSessionDestination = () => {
    const { sessionId, mode } = getActiveSession();
    if (!sessionId) return '/';
    return mode === 'template' || mode === 'program' ? `/workout-plan/${sessionId}` : '/catalog';
};
