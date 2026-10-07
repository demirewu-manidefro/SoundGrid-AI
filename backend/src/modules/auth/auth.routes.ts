import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';
import { authenticateJWT } from '../../middlewares/auth.middleware';

const router = Router();

// Login endpoint protected by rate limiter (brute-force defense)
router.post('/login', authRateLimiter, AuthController.login);

// Google OAuth 2.0 SSO login
router.post('/google', authRateLimiter, AuthController.googleSSO);

// Refresh token rotation
router.post('/refresh', AuthController.refreshToken);

// Logout (revokes token)
router.post('/logout', AuthController.logout);

// Current user profile
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
