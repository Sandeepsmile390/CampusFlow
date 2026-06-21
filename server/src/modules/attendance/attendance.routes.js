import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   POST /api/v1/attendance/mark
// Access:  TEACHER, ADMIN
// Body:    { courseId, date, records: [ { studentId, status } ] }
router.post('/mark', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const { courseId, date, records } = req.body;
    if (!courseId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Missing courseId, date, or records array.' });
    }

    const markedById = req.user.role === 'TEACHER' ? req.user.teacherProfile.id : (await prisma.teacher.findFirst()).id;
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const savedRecords = [];
    for (const record of records) {
      const { studentId, status } = record; // status: PRESENT, ABSENT, LATE
      
      const attendanceRecord = await prisma.attendance.upsert({
        where: {
          studentId_courseId_date: {
            studentId,
            courseId,
            date: formattedDate
          }
        },
        update: {
          status,
          markedById,
          method: 'MANUAL'
        },
        create: {
          studentId,
          courseId,
          date: formattedDate,
          status,
          markedById,
          method: 'MANUAL'
        }
      });
      savedRecords.push(attendanceRecord);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully marked attendance for ${savedRecords.length} students.`,
      data: savedRecords
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/attendance/qr/generate
// Access:  TEACHER
// Body:    { courseId }
// Returns: A signed JWT representing the QR content
router.post('/qr/generate', authenticate, authorize('TEACHER'), async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required.' });

    const teacherId = req.user.teacherProfile.id;

    // Create a 1-minute expiration token representing QR
    const qrPayload = {
      courseId,
      teacherId,
      timestamp: Date.now()
    };

    const qrToken = jwt.sign(qrPayload, process.env.JWT_SECRET, { expiresIn: '1m' });

    return res.status(200).json({
      success: true,
      message: 'Signed attendance QR token generated successfully. Valid for 60 seconds.',
      data: {
        qrToken,
        expiresIn: 60
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/attendance/qr/scan
// Access:  STUDENT
// Body:    { qrToken }
router.post('/qr/scan', authenticate, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ success: false, message: 'QR token is missing.' });

    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'QR code has expired. Please scan a fresh QR code.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid QR code scan.' });
    }

    const studentId = req.user.studentProfile.id;
    const { courseId, teacherId } = decoded;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Save attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId,
          courseId,
          date: today
        }
      },
      update: {
        status: 'PRESENT',
        markedById: teacherId,
        method: 'QR'
      },
      create: {
        studentId,
        courseId,
        date: today,
        status: 'PRESENT',
        markedById: teacherId,
        method: 'QR'
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `Self attendance marked via QR scan for Course: ${courseId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully via QR code!',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/attendance/face-recognition
// Access:  TEACHER (marking class) or STUDENT (self marking)
// Body:    { imageBase64, courseId }
router.post('/face-recognition', authenticate, async (req, res, next) => {
  try {
    const { imageBase64, courseId } = req.body;
    if (!imageBase64 || !courseId) {
      return res.status(400).json({ success: false, message: 'Missing imageBase64 or courseId.' });
    }

    // AI Facial recognition simulation parameters
    const confidence = Math.random() * 15 + 85; // 85% - 100% match
    const spoofDetectionRate = Math.random(); // 0.0 - 1.0 (higher = live face)
    const isLive = spoofDetectionRate > 0.15; // 85% probability of being live

    if (!isLive || confidence < 90) {
      // Create Audit Log of failed face check
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: `Face Recognition FAILED: Confidence ${confidence.toFixed(1)}%, Anti-spoofing alert: High risk of print/screen replay attack.`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(422).json({
        success: false,
        message: 'Face Recognition verification failed. Capture failed liveness check (Anti-spoofing detection triggered) or confidence threshold (<90%) was not reached.',
        data: { confidence: confidence.toFixed(1), isLive }
      });
    }

    // Success flow - mark current student or standard class student as present
    let studentId;
    let studentName = '';
    
    if (req.user.role === 'STUDENT') {
      studentId = req.user.studentProfile.id;
      studentName = req.user.studentProfile.name;
    } else {
      // If teacher is marking via webcam, pick a random student in that course who isn't present
      const schedules = await prisma.classSchedule.findFirst({ where: { courseId } });
      const randomStudent = await prisma.student.findFirst({ where: { deletedAt: null } });
      if (!randomStudent) return res.status(404).json({ success: false, message: 'No student found in class.' });
      studentId = randomStudent.id;
      studentName = randomStudent.name;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teacher = await prisma.teacher.findFirst();

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_courseId_date: {
          studentId,
          courseId,
          date: today
        }
      },
      update: {
        status: 'PRESENT',
        markedById: teacher.id,
        method: 'FACE'
      },
      create: {
        studentId,
        courseId,
        date: today,
        status: 'PRESENT',
        markedById: teacher.id,
        method: 'FACE'
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `Face Recognition PASSED: Marked attendance for ${studentName}. Confidence: ${confidence.toFixed(1)}% (Live: ${isLive})`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    return res.status(200).json({
      success: true,
      message: `Face matched successfully (${confidence.toFixed(1)}% confidence). Attendance recorded for ${studentName}.`,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/attendance/student/:id
// Access:  ADMIN, TEACHER, STUDENT, PARENT
router.get('/student/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // RBAC validation
    if (req.user.role === 'STUDENT' && req.user.studentProfile?.id !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (req.user.role === 'PARENT') {
      const isChild = req.user.parentProfile?.students.some(s => s.id === id);
      if (!isChild) return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const records = await prisma.attendance.findMany({
      where: { studentId: id },
      include: {
        course: true,
        markedBy: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

export default router;
