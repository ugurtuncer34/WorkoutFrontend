import React from 'react';

const formatUpdatedDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TemplateCard = ({ template, pendingAction, onEdit, onClone, onArchiveToggle }) => {
    const exercises = [...(template.exercises || [])].sort((a, b) => a.position - b.position);
    const isPending = Boolean(pendingAction);

    return (
        <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-xl font-black text-gray-900 dark:text-white">{template.name}</h2>
                        {template.isArchived && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                Archived
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-blue-600/70 dark:text-blue-400/70">
                        {template.category}
                    </p>
                </div>
                <span className="flex-none rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                </span>
            </div>

            {exercises.length > 0 && (
                <ol className="mt-4 space-y-1.5 border-l-2 border-blue-100 pl-4 dark:border-blue-900/50">
                    {exercises.slice(0, 4).map((exercise, index) => (
                        <li key={exercise.templateExerciseId ?? exercise.exerciseId} className="break-words text-sm font-medium text-gray-600 dark:text-gray-300">
                            <span className="mr-2 text-xs font-black text-blue-400">{index + 1}.</span>
                            {exercise.exerciseName}
                        </li>
                    ))}
                    {exercises.length > 4 && (
                        <li className="text-xs font-bold text-gray-400">+{exercises.length - 4} more</li>
                    )}
                </ol>
            )}

            {formatUpdatedDate(template.updatedAt) && (
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Updated {formatUpdatedDate(template.updatedAt)}
                </p>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    disabled={isPending}
                    className="min-h-11 rounded-xl bg-blue-50 text-xs font-black uppercase tracking-wider text-blue-700 transition hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-blue-950/40 dark:text-blue-300"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onClone}
                    disabled={isPending}
                    className="min-h-11 rounded-xl bg-indigo-50 text-xs font-black uppercase tracking-wider text-indigo-700 transition hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                    Clone
                </button>
                <button
                    type="button"
                    onClick={onArchiveToggle}
                    disabled={isPending}
                    className="min-h-11 rounded-xl bg-gray-100 px-1 text-xs font-black uppercase tracking-wider text-gray-600 transition hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
                >
                    {pendingAction || (template.isArchived ? 'Unarchive' : 'Archive')}
                </button>
            </div>
        </article>
    );
};

export default TemplateCard;
