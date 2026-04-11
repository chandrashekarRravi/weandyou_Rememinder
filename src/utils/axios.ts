import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    // Use relative path by default. 
    // In dev: proxy in vite.config.ts routes to localhost:5000
    // In prod: rewrites in vercel.json route to the Render backend
    baseURL: '', 
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
            // Token is invalid/expired (ignore for login route as it returns 401 on invalid credentials)
            if (!error.config.url?.endsWith('/login')) {
                console.error('Unauthorized! Token may be expired.');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
