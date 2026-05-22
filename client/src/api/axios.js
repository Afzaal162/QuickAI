import axios from 'axios';

// 🛠️ Detect your environment dynamically
const isProduction = import.meta.env.MODE === 'production';

const api = axios.create({
    // Local development leverages your Vite proxy, Production hits your real Vercel backend
    baseURL: isProduction 
        ? 'https://quick-ai-server.vercel.app/api' 
        : '/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;