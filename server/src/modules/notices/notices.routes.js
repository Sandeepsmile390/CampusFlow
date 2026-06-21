import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { sendPushNotification } from '../../utils/push.js';

const router = Router();

// @route   GET /api/v1/notices
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        postedBy: { select: { email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: notices });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/notices
// Access:  ADMIN, TEACHER
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const { title, content, category, expiresAt } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required.' });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category.toUpperCase(), // GENERAL, EXAM, HOLIDAY, PLACEMENT
        postedById: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Fire asynchronous background push notifications to all registered users
    // This allows the request to return quickly while notifications deliver
    prisma.pushSubscription.findMany({ select: { userId: true } })
      .then(async (subs) => {
        const uniqueUserIds = [...new Set(subs.map(s => s.userId))];
        for (const userId of uniqueUserIds) {
          await sendPushNotification(userId, `New Announcement: ${title}`, `${category} - ${content.substring(0, 50)}...`, {
            noticeId: notice.id,
            category
          });
        }
      })
      .catch(err => console.error('Failed to dispatch notice push notifications:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Notice posted successfully and push notifications queued.',
      data: notice
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/notices/:id
// Access:  ADMIN, TEACHER (own notices only)
router.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    if (req.user.role !== 'ADMIN' && notice.postedById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own notices.' });
    }

    await prisma.notice.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Notice announcement deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
