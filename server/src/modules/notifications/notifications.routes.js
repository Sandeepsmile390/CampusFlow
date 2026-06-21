import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// ─── Helper: create a notification for a user ───────────────────────────────
export async function createNotification(userId, { title, message, type = 'INFO', link = null }) {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type, link }
    });
  } catch (err) {
    console.error('[Notification] Failed to create:', err.message);
  }
}

// ─── GET /api/v1/notifications ───────────────────────────────────────────────
// Returns the last 30 notifications for the logged-in user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    return res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────────
// Mark a single notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────────
// Mark ALL notifications for the user as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/v1/notifications/:id ────────────────────────────────────────
// Delete a single notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await prisma.notification.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
