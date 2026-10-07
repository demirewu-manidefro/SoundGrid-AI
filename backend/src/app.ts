import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { audioUploadMiddleware, validateAudioPayload } from './middlewares/uploadValidator.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import tenantsRoutes from './modules/tenants/tenants.routes';
import usersRoutes from './modules/users/users.routes';
import auditRoutes from './modules/audit/audit.routes';
import { prisma } from './db/prisma';

export const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:5173', 'http://127.0.0.1:8001'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    frameguard: { action: 'deny' }, // X-Frame-Options: DENY
    noSniff: true,                 // X-Content-Type-Options: nosniff
  })
);

// 2. CORS configuration (credentials allowed for HTTP-only cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or localhost dev
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Parsers & Logging
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Global API Rate Limiter
app.use('/api', apiRateLimiter);

// 5. System Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'HEALTHY',
      service: 'SoundGrid Sentinel API Gateway',
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// 6. Audio Magic-Byte Validation Sandbox Endpoint (for security testing)
app.post(
  '/api/security/validate-audio',
  audioUploadMiddleware,
  validateAudioPayload,
  (req, res) => {
    res.json({
      success: true,
      message: 'Audio payload passed RIFF/WAVE magic byte and security inspection',
      file: {
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        sizeBytes: req.file?.size,
      },
    });
  }
);

// 7. Core Subsystem Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);

// 8. 404 Catch-All
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource does not exist on SoundGrid Sentinel API Gateway.',
  });
});

// 9. Centralized Error Handler
app.use(errorHandler);
