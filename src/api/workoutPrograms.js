import { api } from './axiosInstance';

export const getWorkoutPrograms = async (includeArchived = false, config = {}) => {
    const response = await api.get('/workout-programs', {
        ...config,
        params: includeArchived ? { includeArchived: true } : undefined
    });
    return response.data.data || [];
};

export const getWorkoutProgram = async (programId, config = {}) => {
    const response = await api.get(`/workout-programs/${programId}`, config);
    return response.data.data;
};

export const getActiveWorkoutProgram = async (config = {}) => {
    const response = await api.get('/workout-programs/active', config);
    return response.data.data || null;
};

export const createWorkoutProgram = async (payload) => {
    const response = await api.post('/workout-programs', payload);
    return response.data.data;
};

export const updateWorkoutProgram = async (programId, payload) => {
    const response = await api.put(`/workout-programs/${programId}`, payload);
    return response.data.data;
};

export const setWorkoutProgramArchived = async (programId, isArchived) => {
    const endpoint = isArchived ? 'archive' : 'unarchive';
    const response = await api.put(`/workout-programs/${programId}/${endpoint}`);
    return response.data.data;
};

export const activateWorkoutProgram = async (programId, startingStepId) => {
    const response = await api.post(`/workout-programs/${programId}/activate`, { startingStepId });
    return response.data.data;
};

export const deactivateWorkoutProgram = async () => {
    const response = await api.post('/workout-programs/active/deactivate');
    return response.data.data;
};

export const startNextWorkoutProgramSession = async () => {
    const response = await api.post('/workout-programs/active/start-next');
    return response.data.data;
};

export const completeWorkoutProgramRest = async (currentStepId) => {
    const response = await api.post('/workout-programs/active/complete-rest', { currentStepId });
    return response.data.data;
};
