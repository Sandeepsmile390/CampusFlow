import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// CORS configuration - allowing credentials and Vite client on port 3000
export const corsMiddleware = cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
});

// Helmet configuration for secure headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'http://localhost:5001', 'ws://localhost:3000'],
    },
  },
});

// Rate limiting middleware
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30000, // Limit each IP to 30000 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Strict limit on auth attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// XSS Sanitizer Middleware - sanitizes req.body, req.query, and req.params
export function xssSanitizer(req, res, next) {
  const sanitize = (val) => {
    if (typeof val === 'string') {
      return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    if (Array.isArray(val)) {
      return val.map(sanitize);
    }
    if (val !== null && typeof val === 'object') {
      const clean = {};
      for (const k in val) {
        clean[k] = sanitize(val[k]);
      }
      return clean;
    }
    return val;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
}

// Simple CSRF Protection Middleware using Custom Request Header verification
export function csrfProtection(req, res, next) {
  // Safe methods do not modify state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Expect custom header to prevent simple HTML form submissions (CSRF)
  const clientCsrfToken = req.headers['x-csrf-token'] || req.headers['x-requested-with'];
  if (!clientCsrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token verification failed: Missing required verification headers.',
    });
  }

  next();
}
