import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 1. Setup CORS
const allowedOrigins = [
    'https://quick-ai-client-sage.vercel.app', 
    'http://localhost:5173' // Add your local Vite port here
];

app.use(cors({
    origin: (origin, callback) => {
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
console.log("Checking Env Variables:");
console.log("Clerk Secret:", process.env.CLERK_SECRET_KEY ? "Found" : "Missing");
console.log("Database URL:", process.env.DATABASE_URL ? "Found" : "Missing");