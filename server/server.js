import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'; 
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

const allowedOrigins = [
    'https://quick-ai-client-opal.vercel.app', 
    'http://localhost:5173'
];

// 1. Core CORS Setup with Preflight Handling
app.use(cors({
    origin: function (origin, callback) {
        // Allow Postman or Server-to-Server requests (origin is undefined)
        if (!origin) return callback(null, true);
        
        // Dynamically accept explicitly whitelisted origins OR any Vercel deployment
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'clerk-db-jwt'],
    preflightContinue: false, // 🔥 Intercept and terminate OPTIONS checks instantly
    optionsSuccessStatus: 204  // Send a clean 204 status back to browser handshakes
}));

app.use(express.json());

console.log("🛠️ CLERK KEY ENGINE CHECK:", {
  hasPublishable: !!process.env.CLERK_PUBLISHABLE_KEY,
  hasVitePublishable: !!process.env.VITE_CLERK_PUBLISHABLE_KEY,
  hasSecret: !!process.env.CLERK_SECRET_KEY
});

// 2. Clerk Global Middleware (Safely protected from preflight interference now)
app.use(clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY
}));

// 3. System Routes
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

// Initialize database assets safely
connectCloudinary().catch(err => console.error("Cloudinary Error:", err));
console.log("Clerk Secret Key Exists?:", !!process.env.CLERK_SECRET_KEY);
console.log("Clerk Publishable Key Exists?:", !!process.env.CLERK_PUBLISHABLE_KEY);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;