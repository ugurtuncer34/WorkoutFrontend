import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/axiosInstance';
import { getApiErrorMessage } from '../api/apiError';

export const WORKOUT_EXERCISE_STATUS = {
    Planned: 0,
    InProgress: 1,
    Completed: 2,
    Skipped: 3
};

const sortPlan = (plan) => {
    if (!plan) return plan;
    return {
        ...plan,
        exercises: [...(plan.exercises || [])].sort((a, b) => a.position - b.position)
    };
};

const useWorkoutPlan = (sessionId, { enabled = true } = {}) => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(Boolean(sessionId && enabled));
    const [error, setError] = useState('');
    const [errorStatus, setErrorStatus] = useState(null);
    const requestRef = useRef(0);
    const mountedRef = useRef(true);
    const sessionIdRef = useRef(sessionId);
    sessionIdRef.current = sessionId;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refetch = useCallback(async ({ silent = false } = {}) => {
        if (!sessionId || !enabled) return null;
        if (!mountedRef.current || String(sessionIdRef.current) !== String(sessionId)) return null;

        const requestId = ++requestRef.current;
        const isCurrentSession = () => mountedRef.current && String(sessionIdRef.current) === String(sessionId);
        if (isCurrentSession()) {
            if (!silent) setLoading(true);
            setError('');
            setErrorStatus(null);
        }

        try {
            const response = await api.get(`/workout/sessions/${sessionId}/exercise-plan`);
            const nextPlan = sortPlan(response.data.data);
            if (isCurrentSession() && requestId === requestRef.current) setPlan(nextPlan);
            return nextPlan;
        } catch (requestError) {
            if (isCurrentSession() && requestId === requestRef.current) {
                setErrorStatus(requestError.response?.status || null);
                setError(getApiErrorMessage(requestError, 'Unable to refresh the workout plan. Your session is still active.'));
            }
            throw requestError;
        } finally {
            if (isCurrentSession() && requestId === requestRef.current && !silent) setLoading(false);
        }
    }, [enabled, sessionId]);

    useEffect(() => {
        requestRef.current += 1;
        setPlan(null);
        setError('');
        setErrorStatus(null);

        if (!sessionId || !enabled) {
            setLoading(false);
            return;
        }

        refetch().catch(() => {});
    }, [enabled, refetch, sessionId]);

    const updateStatus = useCallback(async (sessionExerciseId, status) => {
        await api.put(`/workout/sessions/${sessionId}/exercises/${sessionExerciseId}/status`, { status });
        try {
            return await refetch({ silent: true });
        } catch {
            return null;
        }
    }, [refetch, sessionId]);

    const addExercise = useCallback(async (payload) => {
        await api.post(`/workout/sessions/${sessionId}/exercises`, payload);
        try {
            return await refetch({ silent: true });
        } catch {
            return null;
        }
    }, [refetch, sessionId]);

    return {
        plan,
        loading,
        error,
        errorStatus,
        refetch,
        updateStatus,
        addExercise
    };
};

export default useWorkoutPlan;
