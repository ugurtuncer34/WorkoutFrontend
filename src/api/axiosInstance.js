import axios from 'axios';

// .NET backend (check Properties/launchSettings.json)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5065/api'; 

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});