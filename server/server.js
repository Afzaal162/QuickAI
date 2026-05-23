import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'; 
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 🔥 CRITICAL: Direct native override to eliminate preflight blocks before middleware evaluations
app.use((req, res, next) => {
    const origin = req.headers.origin;

    const allowedOrigins = [
        'https://quick-ai-client-opal.vercel.app',  // ✅ fixed: was "sage"
        'http://localhost:5173',
    ];

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, X-Requested-With, Accept, clerk-db-jwt, x-clerk-auth-token'
    );

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    next();
});

// Remove your old app.use(cors(...)) setup block completely now!

app.use(express.json());

// Remainder of your application script...

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