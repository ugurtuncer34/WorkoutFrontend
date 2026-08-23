import { useCallback, useEffect, useRef, useState } from 'react';
import {
    activateWorkoutProgram,
    completeWorkoutProgramRest,
    deactivateWorkoutProgram,
    getActiveWorkoutProgram,
    startNextWorkoutProgramSession
} from '../api/workoutPrograms';
import { getApiErrorMessage } from '../api/apiError';

const useActiveWorkoutProgram = ({ enabled = true } = {}) => {
    const [activeProgram, setActiveProgram] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');
    const requestRef = useRef(0);
    const mountedRef = useRef(true);
    const controllerRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            requestRef.current += 1;
            controllerRef.current?.abort();
        };
    }, []);

    const refetch = useCallback(async ({ silent = false } = {}) => {
        if (!enabled || !mountedRef.current) return null;
        const requestId = ++requestRef.current;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        if (!silent) setLoading(true);
        setError('');

        try {
            const nextActiveProgram = await getActiveWorkoutProgram({ signal: controller.signal });
            if (mountedRef.current && requestId === requestRef.current) setActiveProgram(nextActiveProgram);
            return nextActiveProgram;
        } catch (requestError) {
            if (requestError.code === 'ERR_CANCELED' || requestError.name === 'CanceledError') return null;
            if (mountedRef.current && requestId === requestRef.current) {
                setError(getApiErrorMessage(requestError, 'Unable to load the active workout program.'));
            }
            throw requestError;
        } finally {
            if (mountedRef.current && requestId === requestRef.current && !silent) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        requestRef.current += 1;
        controllerRef.current?.abort();
        setActiveProgram(null);
        setError('');
        if (!enabled) {
            setLoading(false);
            return;
        }
        refetch().catch(() => {});
    }, [enabled, refetch]);

    const activate = useCallback(async (programId, startingStepId) => {
        const nextActiveProgram = await activateWorkoutProgram(programId, startingStepId);
        if (mountedRef.current) {
            requestRef.current += 1;
            controllerRef.current?.abort();
            setActiveProgram(nextActiveProgram);
            setError('');
        }
        return nextActiveProgram;
    }, []);

    const deactivate = useCallback(async () => {
        const result = await deactivateWorkoutProgram();
        if (mountedRef.current) {
            requestRef.current += 1;
            controllerRef.current?.abort();
            setActiveProgram(null);
            setError('');
        }
        return result;
    }, []);

    const startNext = useCallback(() => startNextWorkoutProgramSession(), []);

    const completeRest = useCallback(async (currentStepId) => {
        const nextActiveProgram = await completeWorkoutProgramRest(currentStepId);
        if (mountedRef.current) {
            requestRef.current += 1;
            controllerRef.current?.abort();
            setActiveProgram(nextActiveProgram);
            setError('');
        }
        return nextActiveProgram;
    }, []);

    return { activeProgram, loading, error, refetch, activate, deactivate, startNext, completeRest };
};

export default useActiveWorkoutProgram;
