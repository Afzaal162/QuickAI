import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
// ... other imports

const app = express();

// 1. Place CORS at the absolute top of the middleware stack
app.use(cors({
    origin: 'https://quick-ai-client-sage.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Explicitly handle the "Preflight" OPTIONS request
// This ensures Vercel sends the headers back before Clerk or other logic runs
app.options('*', cors()); 

app.use(express.json());

// Move Clerk below CORS so it doesn't interfere with the OPTIONS check
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

export default app;