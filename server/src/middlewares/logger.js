import prisma from '../config/db.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const logString = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${req.ip} - UA: ${req.get('User-Agent')}`;
    console.log(logString);

    // Save sensitive or modifications to audit log database if authenticated
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    if (isMutation && req.user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: `${req.method} ${req.originalUrl} [Status: ${res.statusCode}]`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          },
        });
      } catch (err) {
        console.error('Failed to write to AuditLog:', err.message);
      }
    }
  });
  
  next();
}
