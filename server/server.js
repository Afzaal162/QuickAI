import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// Initialize Cloudinary
connectCloudinary();

// Middleware
app.use(cors({
    origin: 'https://quick-ai-client-sage.vercel.app', // Explicitly allow your frontend
    credentials: true
}));
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// Local development support
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`SERVER IS LIVE ON PORT ${PORT}`);
    });
}

// Export for Vercel
export default app;