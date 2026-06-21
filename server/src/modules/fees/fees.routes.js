import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   GET /api/v1/fees
// Access:  ADMIN, STUDENT, PARENT
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { studentId } = req.query;

    const where = {};
    if (studentId) {
      // Security role check
      if (req.user.role === 'STUDENT' && req.user.studentProfile.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (req.user.role === 'PARENT' && !req.user.parentProfile.students.some(s => s.id === studentId)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      where.studentId = studentId;
    } else if (req.user.role === 'STUDENT') {
      where.studentId = req.user.studentProfile.id;
    } else if (req.user.role === 'PARENT') {
      const studentIds = req.user.parentProfile.students.map(s => s.id);
      where.studentId = { in: studentIds };
    }

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: { select: { name: true, rollNumber: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    return res.status(200).json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/fees/create
// Access:  ADMIN
router.post('/create', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { studentId, amount, dueDate } = req.body;
    if (!studentId || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'studentId, amount, and dueDate are required.' });
    }

    const fee = await prisma.fee.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: 'PENDING'
      },
      include: { student: true }
    });

    return res.status(201).json({ success: true, message: 'Fee invoice created successfully.', data: fee });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/fees/:id/pay
// Access:  STUDENT, PARENT
router.post('/:id/pay', authenticate, authorize('STUDENT', 'PARENT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found.' });

    // Mark as paid
    const updated = await prisma.fee.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}-PAY`
      }
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `Fee Invoice paid: ${fee.id} for Student: ${fee.student.name}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Payment mock transaction recorded successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
