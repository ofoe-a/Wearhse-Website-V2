import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Load env vars before anything else
dotenv.config();

// Validate required environment variables
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'PAYSTACK_SECRET_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error(`\n  ✗ Missing required environment variables:\n    ${missing.join('\n    ')}\n`);
    console.error('  Copy .env.example to .env and fill in the values.\n');
    process.exit(1);
}

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import printerRoutes from './routes/printer';
import riderRoutes from './routes/rider';
import uploadRoutes from './routes/upload';
import shippingRoutes from './routes/shipping';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — allow frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Parse JSON (except for webhooks which need raw body)
app.use('/api/webhooks', express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
app.use(express.json());

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,                  // 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 checkout attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many checkout attempts, please try again later' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,                   // 20 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later' },
});

app.use('/api', generalLimiter);
app.use('/api/orders/checkout', checkoutLimiter);
app.use('/api/auth', authLimiter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'wearhse-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipping', shippingRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`
  ╦ ╦╔═╗╔═╗╦═╗╦ ╦╔═╗╔═╗  ╔═╗╔═╗╦
  ║║║║╣ ╠═╣╠╦╝╠═╣╚═╗║╣   ╠═╣╠═╝║
  ╚╩╝╚═╝╩ ╩╩╚═╩ ╩╚═╝╚═╝  ╩ ╩╩  ╩

  Server running on port ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
    `);
});

export default app;
