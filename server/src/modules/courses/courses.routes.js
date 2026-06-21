import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// ==================== DEPARTMENTS ====================

// @route   GET /api/v1/courses/departments
router.get('/departments', authenticate, async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/courses/departments
router.post('/departments', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and Code are required.' });

    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase() }
    });

    return res.status(201).json({ success: true, message: 'Department created.', data: dept });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/courses/departments/:id
router.delete('/departments/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    next(error);
  }
});


// ==================== COURSES ====================

// @route   GET /api/v1/courses
router.get('/', authenticate, async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { deletedAt: null },
      include: { department: true },
      orderBy: { code: 'asc' }
    });
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/courses
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, code, credits, departmentId, semester } = req.body;
    if (!name || !code || !credits || !departmentId || !semester) {
      return res.status(400).json({ success: false, message: 'All course details are required.' });
    }

    const course = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase(),
        credits: parseInt(credits, 10),
        departmentId,
        semester: parseInt(semester, 10)
      },
      include: { department: true }
    });

    return res.status(201).json({ success: true, message: 'Course created.', data: course });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/courses/:id
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, credits, departmentId, semester } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        credits: credits ? parseInt(credits, 10) : undefined,
        departmentId,
        semester: semester ? parseInt(semester, 10) : undefined
      },
      include: { department: true }
    });

    return res.status(200).json({ success: true, message: 'Course updated.', data: course });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/courses/:id (Soft delete)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    return res.status(200).json({ success: true, message: 'Course soft deleted.' });
  } catch (error) {
    next(error);
  }
});


// ==================== TIMETABLE SCHEDULES ====================

// @route   GET /api/v1/courses/schedules
// Retrieves class schedules filtered by student or teacher or general
router.get('/schedules', authenticate, async (req, res, next) => {
  try {
    const { departmentId, semester, teacherId } = req.query;

    const where = {};
    if (departmentId && semester) {
      where.course = { departmentId, semester: parseInt(semester, 10) };
    } else if (teacherId) {
      where.teacherId = teacherId;
    } else if (req.user.role === 'STUDENT') {
      const student = req.user.studentProfile;
      where.course = { departmentId: student.departmentId, semester: student.semester };
    } else if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.teacherProfile.id;
    }

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: {
        course: { include: { department: true } },
        teacher: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/courses/schedules
router.post('/schedules', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { courseId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;
    if (!courseId || !teacherId || !dayOfWeek || !startTime || !endTime || !room) {
      return res.status(400).json({ success: false, message: 'All schedule details are required.' });
    }

    const schedule = await prisma.classSchedule.create({
      data: {
        courseId,
        teacherId,
        dayOfWeek: dayOfWeek.toUpperCase(),
        startTime,
        endTime,
        room
      },
      include: {
        course: true,
        teacher: true
      }
    });

    return res.status(201).json({ success: true, message: 'Schedule added.', data: schedule });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/courses/schedules/:id
router.delete('/schedules/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.classSchedule.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Class schedule deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
