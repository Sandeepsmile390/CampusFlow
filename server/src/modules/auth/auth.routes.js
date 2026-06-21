import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';
import { generateAccessToken, generateRefreshToken, sendRefreshTokenCookie, clearRefreshTokenCookie } from '../../utils/token.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/security.js';
import { sendEmail } from '../../utils/email.js';

const router = Router();

// Helper to parse cookies manually
function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

// @route   POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: true,
        teacherProfile: true,
        studentProfile: { include: { department: true } },
        parentProfile: { include: { students: true } }
      }
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check account locking
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked.' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account temporarily locked. Try again after ${user.lockUntil.toLocaleTimeString()}`
      });
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && user.role === 'PARENT') {
      const parentProfile = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: {
          students: {
            include: {
              user: true
            }
          }
        }
      });
      if (parentProfile && parentProfile.students.length > 0) {
        for (const student of parentProfile.students) {
          if (student.user && student.user.passwordHash) {
            const match = await bcrypt.compare(password, student.user.passwordHash);
            if (match) {
              isMatch = true;
              break;
            }
          }
        }
      }
    }

    if (!isMatch) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1;
      let lockUntil = null;
      let isBlocked = user.isBlocked;

      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockUntil }
      });

      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send cookie
    sendRefreshTokenCookie(res, refreshToken);

    // Get role-specific profile name/info
    let profile = null;
    if (user.role === 'ADMIN') profile = user.adminProfile;
    if (user.role === 'TEACHER') profile = user.teacherProfile;
    if (user.role === 'STUDENT') profile = user.studentProfile;
    if (user.role === 'PARENT') profile = user.parentProfile;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const cookies = parseCookies(req);
    const refreshToken = cookies.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token, access denied.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      include: {
        adminProfile: true,
        teacherProfile: true,
        studentProfile: { include: { department: true } },
        parentProfile: { include: { students: true } }
      }
    });

    if (!user || user.isBlocked) {
      return res.status(401).json({ success: false, message: 'User unauthorized.' });
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    sendRefreshTokenCookie(res, newRefreshToken);

    let profile = null;
    if (user.role === 'ADMIN') profile = user.adminProfile;
    if (user.role === 'TEACHER') profile = user.teacherProfile;
    if (user.role === 'STUDENT') profile = user.studentProfile;
    if (user.role === 'PARENT') profile = user.parentProfile;

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  clearRefreshTokenCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// @route   POST /api/v1/auth/register
// Route for ADMIN to create accounts (Students, Teachers, Parents, Admins)
router.post('/register', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { email, password, role, name, phone, qualifications, experience, departmentId, rollNumber, address, parentName, parentEmail, parentPhone } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ success: false, message: 'Missing required credentials.' });
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email, passwordHash: hashedPassword, role }
      });

      if (role === 'ADMIN') {
        await tx.admin.create({
          data: { userId: u.id, name, phone }
        });
      } else if (role === 'TEACHER') {
        if (!qualifications) throw new Error('Qualifications are required for a teacher.');
        await tx.teacher.create({
          data: {
            userId: u.id,
            name,
            phone,
            qualifications,
            experience: parseInt(experience || '0', 10),
            departmentId
          }
        });
      } else if (role === 'STUDENT') {
        if (!rollNumber) throw new Error('Roll Number is required for a student.');
        
        // Find or create parent user if email exists, or just link parentName details
        let parentId = null;
        if (parentEmail) {
          let parentUserRecord = await tx.user.findUnique({ where: { email: parentEmail } });
          if (!parentUserRecord) {
            const pPass = await bcrypt.hash('parent123', salt);
            parentUserRecord = await tx.user.create({
              data: { email: parentEmail, passwordHash: pPass, role: 'PARENT' }
            });
            const pProfile = await tx.parent.create({
              data: { userId: parentUserRecord.id, name: parentName || 'Parent', phone: parentPhone || '' }
            });
            parentId = pProfile.id;
          } else {
            const parentProfileRecord = await tx.parent.findUnique({ where: { userId: parentUserRecord.id } });
            if (parentProfileRecord) parentId = parentProfileRecord.id;
          }
        }

        await tx.student.create({
          data: {
            userId: u.id,
            name,
            rollNumber,
            phone,
            address,
            departmentId,
            parentName: parentName || '',
            parentEmail: parentEmail || '',
            parentPhone: parentPhone || '',
            parentId
          }
        });
      } else if (role === 'PARENT') {
        await tx.parent.create({
          data: { userId: u.id, name, phone: phone || '' }
        });
      }

      return u;
    });

    return res.status(201).json({
      success: true,
      message: `${role} account registered successfully.`,
      data: { userId: newUser.id, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// @route   POST /api/v1/auth/google
// Simulated OAuth token exchange
router.post('/google', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google auth token missing.' });
    }

    // In a real production app, verify the token via Google Auth Library
    // Here we simulate validation and retrieve matching or new user
    let email = 'google.student@university.edu';
    let name = 'Google OAuth Student';
    
    // Customize based on simulation payload
    if (token === 'mock-admin-token') {
      email = 'admin@university.edu';
      name = 'Director Sarah Jenkins';
    } else if (token === 'mock-teacher-token') {
      email = 'teacher.dbms@university.edu';
      name = 'Dr. Alice Vance';
    } else if (token === 'mock-student-token') {
      email = 'student.john@university.edu';
      name = 'John Doe';
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: true,
        teacherProfile: true,
        studentProfile: { include: { department: true } },
        parentProfile: { include: { students: true } }
      }
    });

    if (!user) {
      // If student email not found, register them as student by default
      const salt = await bcrypt.genSalt(10);
      const randPassword = await bcrypt.hash(Math.random().toString(), salt);
      const cseDep = await prisma.department.findFirst();

      const newU = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: { email, passwordHash: randPassword, role: 'STUDENT' }
        });
        await tx.student.create({
          data: {
            userId: u.id,
            name,
            rollNumber: 'G-' + Math.floor(1000 + Math.random() * 9000),
            departmentId: cseDep ? cseDep.id : null,
            parentName: 'Google Parent',
            parentEmail: 'parent.google@gmail.com',
            parentPhone: '9876543200'
          }
        });
        return u;
      });

      const fullUser = await prisma.user.findUnique({
        where: { id: newU.id },
        include: { studentProfile: { include: { department: true } } }
      });

      const accessToken = generateAccessToken(fullUser);
      sendRefreshTokenCookie(res, generateRefreshToken(fullUser));

      return res.status(200).json({
        success: true,
        message: 'Google Sign-In successful (New User)',
        data: { accessToken, user: { id: fullUser.id, email: fullUser.email, role: fullUser.role, profile: fullUser.studentProfile } }
      });
    }

    const accessToken = generateAccessToken(user);
    sendRefreshTokenCookie(res, generateRefreshToken(user));

    let profile = null;
    if (user.role === 'ADMIN') profile = user.adminProfile;
    if (user.role === 'TEACHER') profile = user.teacherProfile;
    if (user.role === 'STUDENT') profile = user.studentProfile;
    if (user.role === 'PARENT') profile = user.parentProfile;

    return res.status(200).json({
      success: true,
      message: 'Google Sign-In successful',
      data: { accessToken, user: { id: user.id, email: user.email, role: user.role, profile } }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please enter your email.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 for security reasons (avoid enumerating email accounts)
      return res.status(200).json({ success: true, message: 'If that email exists, a password reset link has been dispatched.' });
    }

    // In a real application, create a reset token, store in DB with expiration, and send reset URL
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Student Management System',
      text: `Hello,\n\nYou requested a password reset. Click this link to reset it (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>Hello,</p><p>You requested a password reset. Click the button below to reset it (valid for 1 hour):</p><p><a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>`
    });

    return res.status(200).json({ success: true, message: 'If that email exists, a password reset link has been dispatched.' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash, loginAttempts: 0, lockUntil: null }
    });

    return res.status(200).json({ success: true, message: 'Password has been updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// Push Subscription registration
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid push subscription payload.' });
    }

    // Save subscription in DB
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: req.user.id,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      },
      create: {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      }
    });

    return res.status(200).json({ success: true, message: 'Web Push subscription registered.', data: sub });
  } catch (error) {
    next(error);
  }
});

export default router;
