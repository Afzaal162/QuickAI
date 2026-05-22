import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'; // Make sure this is installed via npm install @clerk/express
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// 1. Force the system to register your backend configurations immediately
const allowedOrigins = [
    'https://quick-ai-client-sage.vercel.app', 
    'http://localhost:5173'
];

// 1. Clear out the callback functions and explicitly target your live client app
app.use(cors({
    origin: 'https://quick-ai-client-sage.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. Add an explicit manual catcher for OPTIONS requests to guarantee a 200 OK response
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://quick-ai-client-sage.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    return res.sendStatus(200);
});

app.use(express.json());

// 2. Explicitly feed your keys into Clerk so it doesn't guess where they are
app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
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