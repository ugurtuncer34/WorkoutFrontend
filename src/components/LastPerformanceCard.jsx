import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api/axiosInstance';

const normalizeUtcTimestamp = (timestamp) => {
    if (!timestamp || /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)) return timestamp;
    return `${timestamp}Z`;
};

const formatPerformanceDate = (timestamp) => {
    const date = new Date(normalizeUtcTimestamp(timestamp));

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

const formatWeight = (weightKg) => Number(weightKg).toString();

const formatSet = (set, exerciseType, isCompact = false) => {
    if (exerciseType === 'DurationOnly' || set.durationSeconds != null) {
        return `${set.durationSeconds}s`;
    }

    const weight = set.weightKg == null ? 'BW' : formatWeight(set.weightKg);
    return isCompact
        ? `${set.reps}\u00d7${weight}`
        : `${set.reps} reps @ ${weight}${set.weightKg == null ? '' : ' kg'}`;
};

const LastPerformanceCard = ({ exerciseId, sessionId }) => {
    const [status, setStatus] = useState('loading');
    const [performance, setPerformance] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const detailsId = useId();

    useEffect(() => {
        const controller = new AbortController();
        let isCurrentRequest = true;

        setStatus('loading');
        setPerformance(null);
        setIsExpanded(false);

        const fetchLastPerformance = async () => {
            try {
                const response = await api.get(
                    `/workout/exercises/${exerciseId}/last-performance`,
                    {
                        params: {
                            excludeSessionId: sessionId
                        },
                        signal: controller.signal
                    }
                );

                if (!isCurrentRequest) return;

                setPerformance(response.data.data);
                setStatus(response.data.data ? 'success' : 'empty');
            } catch (error) {
                if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') return;
                if (!isCurrentRequest) return;

                console.error('Failed to fetch last performance', error);
                setStatus('error');
            }
        };

        fetchLastPerformance();

        return () => {
            isCurrentRequest = false;
            controller.abort();
        };
    }, [exerciseId, sessionId]);

    if (status === 'loading') {
        return (
            <div className="mb-4 rounded-2xl border border-blue-100/70 bg-white/70 px-4 py-3 shadow-sm transition-colors dark:border-blue-900/40 dark:bg-gray-800/70">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500/60 dark:text-blue-400/50">
                    Last Performance
                </p>
                <p className="mt-1 animate-pulse text-xs font-medium text-gray-400 dark:text-gray-500">
                    Loading previous performance...
                </p>
            </div>
        );
    }

    if (status === 'empty' || status === 'error') {
        return (
            <div className="mb-4 rounded-2xl border border-blue-100/70 bg-white/70 px-4 py-3 shadow-sm transition-colors dark:border-blue-900/40 dark:bg-gray-800/70">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500/60 dark:text-blue-400/50">
                    Last Performance
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {status === 'empty' ? 'No previous performance yet.' : 'Previous performance unavailable.'}
                </p>
            </div>
        );
    }

    const sortedSets = [...performance.sets].sort((a, b) => a.setNumber - b.setNumber);
    const formattedDate = formatPerformanceDate(performance.sessionCreatedAt);

    return (
        <div className="mb-4 overflow-hidden rounded-2xl border border-blue-100/70 bg-white/70 shadow-sm transition-colors dark:border-blue-900/40 dark:bg-gray-800/70">
            <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                className="w-full rounded-2xl px-4 py-3 text-left outline-none transition-colors active:bg-blue-50/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:active:bg-blue-950/30"
            >
                <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-blue-500/60 dark:text-blue-400/50">
                    Last Performance{formattedDate ? ` \u00b7 ${formattedDate}` : ''}
                </span>
                <span className="mt-1 flex min-w-0 items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-blue-700 dark:text-blue-300">
                        {sortedSets.map((set) => formatSet(set, performance.exerciseType, true)).join(' \u00b7 ')}
                    </span>
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-3 w-3 flex-none text-blue-500 transition-transform duration-200 dark:text-blue-400 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        id={detailsId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-48 space-y-2 overflow-y-auto border-t border-blue-100/70 bg-blue-50/30 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/10">
                            {sortedSets.map((set) => (
                                <div
                                    key={set.id ?? set.setNumber}
                                    className="border-b border-blue-100/60 pb-2 last:border-0 last:pb-0 dark:border-blue-900/30"
                                >
                                    <div className="flex items-baseline justify-between gap-4 text-sm">
                                        <span className="flex-none font-bold text-blue-500/70 dark:text-blue-400/70">
                                            Set {set.setNumber}
                                        </span>
                                        <span className="min-w-0 text-right font-semibold text-blue-700 dark:text-blue-300">
                                            {formatSet(set, performance.exerciseType)}
                                        </span>
                                    </div>
                                    {set.notes && (
                                        <p className="mt-1 break-words text-xs font-medium text-blue-600/70 dark:text-blue-300/70">
                                            {set.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LastPerformanceCard;
