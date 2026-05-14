import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 1. Optimized CORS Configuration
const allowedOrigins = ['https://quick-ai-client-sage.vercel.app'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or matching our client
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle Preflight (OPTIONS) requests immediately
app.options('*', cors());

// 2. Middleware
app.use(express.json());

// 3. Initialize External Services
// We call this without 'await' at the top level to prevent Vercel boot timeouts
connectCloudinary().catch(err => console.error("Cloudinary Connection Failed:", err));

// 4. Auth Middleware (Ensure CLERK_SECRET_KEY is in Vercel Env Variables)
app.use(clerkMiddleware());

// 5. Routes
app.get('/', (req, res) => res.send('Quick AI Server is Live'));

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// 6. Global Error Handler (Prevents the "Silent" 500 Error)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error', 
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`SERVER IS LIVE ON PORT ${PORT}`);
});