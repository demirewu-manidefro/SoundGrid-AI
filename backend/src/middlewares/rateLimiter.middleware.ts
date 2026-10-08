import { Request, Response, NextFunction } from 'express';
import { SlidingTokenBucket } from '../utils/tokenBucket';

// Auth bucket: 10 attempts per minute in production (generous in development/test)
const authBucket = new SlidingTokenBucket({
  maxTokens: process.env.NODE_ENV === 'production' ? 10 : 150,
  windowMs: 60 * 1000,
});

// General API bucket: 120 requests per minute
const apiBucket = new SlidingTokenBucket({ maxTokens: 120, windowMs: 60 * 1000 });

// Diagnostic audio inference bucket: 30 requests per minute
const diagnosticBucket = new SlidingTokenBucket({ maxTokens: 30, windowMs: 60 * 1000 });

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-client';
}

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientKey = `auth:${getClientIdentifier(req)}`;
  const result = authBucket.consume(clientKey);

  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded for authentication attempts. Please retry shortly.',
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    });
    return;
  }

  next();
}

export function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientKey = `api:${getClientIdentifier(req)}`;
  const result = apiBucket.consume(clientKey);

  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'API rate limit exceeded. Please throttle requests.',
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    });
    return;
  }

  next();
}

export function diagnosticRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientKey = `diag:${getClientIdentifier(req)}`;
  const result = diagnosticBucket.consume(clientKey);

  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Telemetry inference rate limit exceeded. Please throttle inspection requests.',
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    });
    return;
  }

  next();
}
