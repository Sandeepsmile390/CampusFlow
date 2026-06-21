import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   GET /api/v1/placements
router.get('/', authenticate, async (req, res, next) => {
  try {
    const placements = await prisma.placement.findMany({
      where: { deletedAt: null },
      include: {
        applications: req.user.role === 'STUDENT' ? {
          where: { studentId: req.user.studentProfile.id }
        } : undefined
      },
      orderBy: { deadline: 'asc' }
    });

    return res.status(200).json({ success: true, data: placements });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/placements
// Access:  ADMIN
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { company, role, salaryPackage, requirements, eligibilityCriteria, deadline } = req.body;
    if (!company || !role || !salaryPackage || !requirements || !eligibilityCriteria || !deadline) {
      return res.status(400).json({ success: false, message: 'All job details are required.' });
    }

    const job = await prisma.placement.create({
      data: {
        company,
        role,
        salaryPackage,
        requirements,
        eligibilityCriteria,
        deadline: new Date(deadline)
      }
    });

    return res.status(201).json({ success: true, message: 'Job posting added successfully.', data: job });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/placements/:id/apply
// Access:  STUDENT
router.post('/:id/apply', authenticate, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resumeUrl } = req.body;

    const job = await prisma.placement.findUnique({ where: { id } });
    if (!job || job.deletedAt) return res.status(404).json({ success: false, message: 'Placement posting not found.' });

    const studentId = req.user.studentProfile.id;

    // Check if already applied
    const existingApp = await prisma.placementApplication.findUnique({
      where: {
        placementId_studentId: { placementId: id, studentId }
      }
    });

    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job.' });
    }

    const app = await prisma.placementApplication.create({
      data: {
        placementId: id,
        studentId,
        resumeUrl
      }
    });

    return res.status(201).json({ success: true, message: 'Applied successfully!', data: app });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/placements/applications/:placementId
// Access:  ADMIN
router.get('/applications/:placementId', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { placementId } = req.params;

    const applications = await prisma.placementApplication.findMany({
      where: { placementId },
      include: {
        student: { select: { name: true, rollNumber: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/placements/applications/:id/status
// Access:  ADMIN
router.put('/applications/:id/status', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPLIED, SHORTLISTED, REJECTED, PLACED

    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const updated = await prisma.placementApplication.update({
      where: { id },
      data: { status }
    });

    return res.status(200).json({ success: true, message: 'Application status updated.', data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
