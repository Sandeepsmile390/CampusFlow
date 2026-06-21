import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   GET /api/v1/teachers
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        department: true,
        user: { select: { email: true } }
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: teachers
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/teachers/:id
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, qualifications, experience, departmentId, profilePhoto } = req.body;

    const teacher = await prisma.teacher.findFirst({ where: { id, deletedAt: null } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        name,
        phone,
        qualifications,
        experience: experience ? parseInt(experience, 10) : undefined,
        departmentId,
        profilePhoto
      },
      include: { department: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Teacher details updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/teachers/:id (Soft Delete)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findFirst({ where: { id, deletedAt: null } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    await prisma.$transaction([
      prisma.teacher.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: teacher.userId },
        data: { deletedAt: new Date(), isBlocked: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Teacher profile soft deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
