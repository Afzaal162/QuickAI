import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 1. Setup CORS
app.use(cors({
    origin: 'https://quick-ai-client-sage.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/** 
 * THE CRITICAL FIX: 
 * We use a Regex /^(.*)$/ because it's universal. 
 * This avoids the "PathError: Missing parameter name" crash.
 */
app.options(/^(.*)$/, cors());

app.use(express.json());

// Initialize services (background)
connectCloudinary().catch(err => console.error("Cloudinary Error:", err));

app.use(clerkMiddleware());

// 2. Routes
app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));