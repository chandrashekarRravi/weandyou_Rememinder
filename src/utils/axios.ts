import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: '/', // Vite proxies /api to backend by default
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional: handle 401s to auto-logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid/expired
            // Optional: emit an event or clear local storage here
            console.error('Unauthorized! Token may be expired.');
        }
        return Promise.reject(error);
    }
);

export default api;
