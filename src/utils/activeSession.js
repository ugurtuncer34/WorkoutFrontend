const ACTIVE_SESSION_ID_KEY = 'activeSessionId';
const ACTIVE_SESSION_MODE_KEY = 'activeSessionMode';
const ACTIVE_TEMPLATE_NAME_KEY = 'activeTemplateName';
const ACTIVE_TEMPLATE_CATEGORY_KEY = 'activeTemplateCategory';

export const getActiveSession = () => ({
    sessionId: localStorage.getItem(ACTIVE_SESSION_ID_KEY),
    mode: localStorage.getItem(ACTIVE_SESSION_MODE_KEY) || 'quick',
    templateName: localStorage.getItem(ACTIVE_TEMPLATE_NAME_KEY) || '',
    templateCategory: localStorage.getItem(ACTIVE_TEMPLATE_CATEGORY_KEY) || ''
});

export const setQuickSession = (sessionId) => {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, String(sessionId));
    localStorage.setItem(ACTIVE_SESSION_MODE_KEY, 'quick');
    localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
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
};

export const clearActiveSession = () => {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    localStorage.removeItem(ACTIVE_SESSION_MODE_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_NAME_KEY);
    localStorage.removeItem(ACTIVE_TEMPLATE_CATEGORY_KEY);
};

export const getActiveSessionDestination = () => {
    const { sessionId, mode } = getActiveSession();
    if (!sessionId) return '/';
    return mode === 'template' ? `/workout-plan/${sessionId}` : '/catalog';
};
