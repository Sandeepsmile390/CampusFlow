import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import { corsMiddleware, helmetMiddleware, apiLimiter, xssSanitizer, csrfProtection } from './middlewares/security.js';
import { requestLogger } from './middlewares/logger.js';
import { globalErrorHandler } from './middlewares/error.js';

// Routers
import authRouter from './modules/auth/auth.routes.js';
import studentsRouter from './modules/students/students.routes.js';
import teachersRouter from './modules/teachers/teachers.routes.js';
import coursesRouter from './modules/courses/courses.routes.js';
import attendanceRouter from './modules/attendance/attendance.routes.js';
import assignmentsRouter from './modules/assignments/assignments.routes.js';
import feesRouter from './modules/fees/fees.routes.js';
import placementsRouter from './modules/placements/placements.routes.js';
import noticesRouter from './modules/notices/notices.routes.js';
import analyticsRouter from './modules/analytics/analytics.routes.js';
import aiRouter from './modules/ai/ai.routes.js';
import discussionsRouter from './modules/discussions/discussions.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads for facial recognition
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply CSRF and XSS input validation
app.use(csrfProtection);
app.use(xssSanitizer);

// Rate Limiting
app.use('/api/', apiLimiter);

// Logger (Stores DB audit logs for modifications)
app.use(requestLogger);

// REST API Endpoints
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/teachers', teachersRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/assignments', assignmentsRouter);
app.use('/api/v1/fees', feesRouter);
app.use('/api/v1/placements', placementsRouter);
app.use('/api/v1/notices', noticesRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/discussions', discussionsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Healthy', timestamp: new Date() });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusFlow Backend API is running successfully!",
    health: "/health",
    frontend: "https://campus-flow-brown.vercel.app"
  });
});

// Catch-all 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(globalErrorHandler);

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[SMS BACKEND SERVER] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
}

export default app;
