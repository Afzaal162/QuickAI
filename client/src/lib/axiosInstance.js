import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://quick-ai-server-omega-neon.vercel.app'
});

export default axiosInstance;