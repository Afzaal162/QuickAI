import 'dotenv/config'; 
import express from 'express';
import { clerkMiddleware } from '@clerk/express'; 
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

const allowedOrigins = [
    'https://quick-ai-client-opal.vercel.app',
    'http://localhost:5173',
];

// ✅ STEP 1: CORS must be the VERY first middleware — before everything including body parser
// Add this BEFORE your CORS middleware to log every request
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path} | Origin: ${req.headers.origin}`);
    
    // Log response headers after they're sent
    const originalEnd = res.end;
    res.end = function(...args) {
        console.log(`[RESPONSE] ${req.method} ${req.path} | Status: ${res.statusCode} | CORS Header: ${res.getHeader('Access-Control-Allow-Origin')}`);
        originalEnd.apply(this, args);
    };
    next();
});
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, X-Requested-With, Accept, clerk-db-jwt, x-clerk-auth-token'
    );

    // ✅ STEP 2: Short-circuit OPTIONS BEFORE Clerk ever sees it
    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // use 200 not 204 — some clients handle it better
    }

    next();
});

app.use(express.json());

// ✅ STEP 3: Clerk comes AFTER CORS middleware
app.use(clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY
}));

app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

app.use((err, req, res, next) => {
    console.error('Global error:', err.message);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

connectCloudinary().catch(err => console.error("Cloudinary Error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// ✅ Only listen when running locally, not on Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;