import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';
import CloneTemplateDialog from '../components/CloneTemplateDialog';
import TemplateCard from '../components/TemplateCard';

const Templates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [includeArchived, setIncludeArchived] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingActions, setPendingActions] = useState({});
    const [cloneTemplate, setCloneTemplate] = useState(null);
    const [cloneError, setCloneError] = useState('');
    const [isCloning, setIsCloning] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/workout-templates', {
                params: includeArchived ? { includeArchived: true } : undefined
            });
            setTemplates(response.data.data || []);
        } catch (requestError) {
            console.error('Failed to fetch workout templates', requestError);
            setError(getApiErrorMessage(requestError, 'Unable to load templates. Pull to refresh or try again.'));
        } finally {
            setIsLoading(false);
        }
    }, [includeArchived]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleArchiveToggle = async (template) => {
        if (!template.isArchived) {
            const confirmed = window.confirm(`Archive “${template.name}”? You can restore it later.`);
            if (!confirmed) return;
        }

        const action = template.isArchived ? 'Unarchiving...' : 'Archiving...';
        setPendingActions((current) => ({ ...current, [template.id]: action }));
        setError('');

        try {
            const endpoint = template.isArchived ? 'unarchive' : 'archive';
            await api.put(`/workout-templates/${template.id}/${endpoint}`);
            await fetchTemplates();
        } catch (requestError) {
            console.error('Failed to change template archive status', requestError);
            setError(getApiErrorMessage(requestError, `Unable to ${template.isArchived ? 'unarchive' : 'archive'} the template.`));
        } finally {
            setPendingActions((current) => {
                const next = { ...current };
                delete next[template.id];
                return next;
            });
        }
    };

    const handleClone = async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setCloneError('A name is required for the cloned template.');
            return;
        }
        if (trimmedName.length > 100) {
            setCloneError('Template name must be 100 characters or fewer.');
            return;
        }

        setIsCloning(true);
        setCloneError('');
        try {
            const response = await api.post(`/workout-templates/${cloneTemplate.id}/clone`, { name: trimmedName });
            const cloned = response.data.data;
            setCloneTemplate(null);
            navigate(`/templates/${cloned.id}/edit`);
        } catch (requestError) {
            console.error('Failed to clone workout template', requestError);
            setCloneError(getApiErrorMessage(requestError, 'Unable to clone this template.'));
        } finally {
            setIsCloning(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-4 transition-colors dark:bg-gray-900">
            <main className="mx-auto w-full max-w-md pt-4">
                <header className="mb-6 flex items-center gap-4 pr-12">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        aria-label="Back to home"
                        className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-gray-100 bg-white text-xl font-bold text-gray-800 shadow-sm transition focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        ←
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Workout Templates
                        </h1>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600/70 dark:text-blue-400/70">
                            Plan your training
                        </p>
                    </div>
                </header>

                <button
                    type="button"
                    onClick={() => navigate('/templates/new')}
                    className="mb-4 min-h-14 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                    Create Template
                </button>

                <label className="mb-5 flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Include archived templates</span>
                    <input
                        type="checkbox"
                        checked={includeArchived}
                        onChange={(event) => setIncludeArchived(event.target.checked)}
                        className="h-5 w-5 accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                </label>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={fetchTemplates} className="mt-2 underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-red-400">
                            Try again
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="animate-pulse font-semibold text-gray-400">Loading templates...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                        <p className="font-bold text-gray-700 dark:text-gray-200">
                            {includeArchived ? 'No templates found.' : 'No active templates yet.'}
                        </p>
                        <p className="mt-2 text-sm text-gray-400">Create a template to define an ordered workout.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {templates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                pendingAction={pendingActions[template.id]}
                                onEdit={() => navigate(`/templates/${template.id}/edit`)}
                                onClone={() => {
                                    setCloneError('');
                                    setCloneTemplate(template);
                                }}
                                onArchiveToggle={() => handleArchiveToggle(template)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {cloneTemplate && (
                <CloneTemplateDialog
                    template={cloneTemplate}
                    isCloning={isCloning}
                    error={cloneError}
                    onClose={() => {
                        setCloneTemplate(null);
                        setCloneError('');
                    }}
                    onClone={handleClone}
                />
            )}
        </div>
    );
};

export default Templates;
