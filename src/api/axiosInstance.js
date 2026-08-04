import axios from 'axios';
import { clearActiveSession } from '../utils/activeSession';

// .NET backend (check Properties/launchSettings.json)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5065/api'; 

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        clearActiveSession();
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
