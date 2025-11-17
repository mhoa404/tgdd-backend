import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/wallet';

const app = express();

/*----------------------------------
Middleware
-----------------------------------*/
app.use(cors());
app.use(express.json());

/*----------------------------------
Routes
-----------------------------------*/
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

export default app;
