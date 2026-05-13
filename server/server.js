import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoute.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();
await connectCloudinary();

app.use(cors({
    origin: 'https://quick-ai-client-sage.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is Live'));
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);
const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
    console.log('SERVER IS LIVE');
})
