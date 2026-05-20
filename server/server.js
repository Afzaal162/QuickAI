import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 1. Define allowed origins clearly (for local and production main domain)
const allowedOrigins = [
    'https://quick-ai-client-sage.vercel.app', 
    'http://localhost:5173'
];

// 2. Configure Dynamic CORS Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, postman, or internal cluster hops)
        if (!origin) return callback(null, true);
        
        // Match explicit list OR any dynamic Vercel preview/branch deployments
        const isAllowedExplicitly = allowedOrigins.indexOf(origin) !== -1;
        const isVercelSubdomain = origin.endsWith('.vercel.app');

        if (isAllowedExplicitly || isVercelSubdomain) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 3. Handle all Preflight OPTIONS cleanly
app.options(/.*/, (req, res) => {
    const origin = req.headers.origin;
    
    // Dynamic matching for preflight checks to keep Vercel subdomains working smoothly
    if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    return res.sendStatus(200);
});

app.use(express.json());

// Initialize services in background safely
connectCloudinary().catch(err => console.error("Cloudinary Error:", err));

// Clerk interceptor catches incoming tokens
app.use(clerkMiddleware());

// 4. Application Routes
app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy restriction' });
    }
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

export default app;