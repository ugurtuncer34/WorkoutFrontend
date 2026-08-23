import React, { useEffect, useRef } from 'react';

const ConfirmationDialog = ({ title, description, confirmLabel, pendingLabel, isPending = false, tone = 'primary', onClose, onConfirm }) => {
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    useEffect(() => {
        const previousFocus = document.activeElement;
        cancelRef.current?.focus();
        return () => previousFocus?.isConnected && previousFocus.focus();
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isPending) {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key !== 'Tab') return;
        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const confirmClass = tone === 'danger'
        ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-700 focus-visible:ring-red-400'
        : 'app-primary bg-blue-600 text-white shadow-lg shadow-blue-500/20 focus-visible:ring-blue-400';

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-gray-950/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onKeyDown={handleKeyDown} onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onClose(); }}>
            <div ref={dialogRef} className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <h2 id="confirmation-title" className="text-xl font-black text-gray-900 dark:text-white">{title}</h2>
                <p id="confirmation-description" className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button ref={cancelRef} type="button" onClick={onClose} disabled={isPending} className="min-h-12 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">Cancel</button>
                    <button type="button" onClick={onConfirm} disabled={isPending} className={`min-h-12 rounded-xl font-bold focus-visible:ring-2 disabled:opacity-50 ${confirmClass}`}>{isPending ? (pendingLabel || 'Working...') : confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
