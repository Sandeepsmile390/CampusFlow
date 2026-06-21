import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and profile from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      include: {
        adminProfile: true,
        teacherProfile: true,
        studentProfile: {
          include: {
            department: true,
          },
        },
        parentProfile: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User no longer exists or is deleted.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account Blocked: Access has been restricted by an administrator.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token Expired: Please refresh your session.',
        expired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Access Denied: Invalid authentication token.',
    });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: User not authenticated.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Authorization Forbidden: Role '${req.user.role}' does not have permission to access this resource.`,
      });
    }

    next();
  };
}
