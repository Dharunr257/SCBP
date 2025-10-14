import axios from 'axios';

// Helper to revive date strings from JSON into Date objects
const reviveDates = (key: any, value: any) => {
    const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (typeof value === 'string' && dateFormat.test(value)) {
        return new Date(value);
    }
    return value;
};

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Create an Axios instance with a base URL that changes based on the environment.
export const axiosInstance = axios.create({
    baseURL: isDev ? "http://localhost:5000/api" : "/api",
    transformResponse: [
        (data) => {
            // data is the raw response string from the server
            if (data && typeof data === 'string') {
                try {
                    return JSON.parse(data, reviveDates);
                } catch (e) {
                    // if it's not a valid JSON, return it as is
                    return data;
                }
            }
            return data;
        },
    ],
});

// Request interceptor to automatically add the JWT token to every outgoing request.
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);