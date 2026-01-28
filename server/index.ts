import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { aiRouter } from './ai';

// Load env vars
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3100', 'http://127.0.0.1:3100'], // Allow Vite frontend
    credentials: true
}));
app.use(express.json({ limit: '2mb' })); // Support larger prompts/contexts

// Routes
app.use('/api/ai', aiRouter);

// Health Check
app.get('/', (req, res) => {
    res.send('FinHub Secure Server is running 🚀');
});

// Start
app.listen(PORT, () => {
    console.log(`\n✅ Secure backend running on http://localhost:${PORT}`);
    console.log(`   - AI Proxy: http://localhost:${PORT}/api/ai/generate`);
});
