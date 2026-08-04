import React, { useEffect, useRef, useState } from 'react';

const MAX_TEMPLATE_NAME_LENGTH = 100;
const COPY_SUFFIX = ' Copy';

const getDefaultCloneName = (name) => {
    const availableLength = MAX_TEMPLATE_NAME_LENGTH - COPY_SUFFIX.length;
    return `${name.slice(0, availableLength).trimEnd()}${COPY_SUFFIX}`;
};

const CloneTemplateDialog = ({ template, isCloning, error, onClose, onClone }) => {
    const [name, setName] = useState(() => getDefaultCloneName(template.name));
    const inputRef = useRef(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        const previouslyFocusedElement = document.activeElement;
        inputRef.current?.focus();

        return () => {
            previouslyFocusedElement?.focus();
        };
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isCloning) {
            event.preventDefault();
            onClose();
            return;
        }

        if (event.key !== 'Tab') return;

        const focusableElements = dialogRef.current?.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onClone(name);
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-950/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clone-template-title"
            aria-describedby="clone-template-description"
            onKeyDown={handleKeyDown}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isCloning) onClose();
            }}
        >
            <div ref={dialogRef} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <h2 id="clone-template-title" className="text-xl font-black text-gray-900 dark:text-white">
                    Clone Template
                </h2>
                <p id="clone-template-description" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create an active copy of {template.name}.
                </p>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5">
                    <label htmlFor="clone-name" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        New template name
                    </label>
                    <input
                        ref={inputRef}
                        id="clone-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={MAX_TEMPLATE_NAME_LENGTH}
                        disabled={isCloning}
                        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 dark:border-blue-800/50 dark:bg-gray-900 dark:text-gray-200"
                    />
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isCloning}
                            className="min-h-12 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCloning || !name.trim()}
                            className="min-h-12 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
                        >
                            {isCloning ? 'Cloning...' : 'Clone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CloneTemplateDialog;
