import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   GET /api/v1/assignments
// Returns assignments matching the user's scope
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { courseId } = req.query;

    const where = { deletedAt: null };
    if (courseId) {
      where.courseId = courseId;
    } else if (req.user.role === 'STUDENT') {
      const student = req.user.studentProfile;
      where.course = { departmentId: student.departmentId, semester: student.semester };
    } else if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.teacherProfile.id;
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: true,
        teacher: { select: { name: true } },
        submissions: {
          where: req.user.role === 'STUDENT' ? { studentId: req.user.studentProfile.id } : undefined,
          select: { id: true, submittedAt: true, grade: true, feedback: true, filePath: true }
        }
      },
      orderBy: { deadline: 'asc' }
    });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/assignments
// Access:  TEACHER, ADMIN
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const { title, description, deadline, courseId, filePath } = req.body;
    if (!title || !description || !deadline || !courseId) {
      return res.status(400).json({ success: false, message: 'Title, description, deadline, and courseId are required.' });
    }

    const teacherId = req.user.role === 'TEACHER' ? req.user.teacherProfile.id : (await prisma.teacher.findFirst()).id;

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        courseId,
        teacherId,
        filePath: filePath || 'https://res.cloudinary.com/demo-cloud/image/upload/sample.pdf'
      },
      include: { course: true }
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/assignments/:id/submit
// Access:  STUDENT
router.post('/:id/submit', authenticate, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { filePath } = req.body; // Simulated Cloudinary link from frontend

    if (!filePath) return res.status(400).json({ success: false, message: 'filePath is required.' });

    const studentId = req.user.studentProfile.id;

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment || assignment.deletedAt) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Upsert submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId
        }
      },
      update: {
        filePath,
        submittedAt: new Date()
      },
      create: {
        assignmentId: id,
        studentId,
        filePath
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully.',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/assignments/submissions/:assignmentId
// Access:  TEACHER, ADMIN
router.get('/submissions/:assignmentId', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, rollNumber: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/assignments/submissions/:id/grade
// Access:  TEACHER, ADMIN
router.post('/submissions/:id/grade', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    if (!grade) return res.status(400).json({ success: false, message: 'Grade is required.' });

    const submission = await prisma.assignmentSubmission.update({
      where: { id },
      data: { grade, feedback },
      include: {
        student: true,
        assignment: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

export default router;
