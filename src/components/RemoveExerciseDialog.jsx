import React, { useEffect, useRef } from 'react';

const RemoveExerciseDialog = ({ exerciseName, returnFocusElement, onClose, onConfirm }) => {
    const dialogRef = useRef(null);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        cancelButtonRef.current?.focus();

        return () => {
            if (returnFocusElement?.isConnected) returnFocusElement.focus();
        };
    }, [returnFocusElement]);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
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

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-950/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-exercise-title"
            aria-describedby="remove-exercise-description"
            onKeyDown={handleKeyDown}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div ref={dialogRef} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <h2 id="remove-exercise-title" className="text-xl font-black text-gray-900 dark:text-white">
                    Remove Exercise?
                </h2>
                <p id="remove-exercise-description" className="mt-2 break-words text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-gray-700 dark:text-gray-200">“{exerciseName}”</span> will be removed from this template.
                    <span className="mt-2 block">Unsaved target settings for this exercise will be lost.</span>
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onClose}
                        className="min-h-12 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="min-h-12 rounded-xl bg-red-600 font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoveExerciseDialog;
