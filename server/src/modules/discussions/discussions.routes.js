import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   POST /api/v1/discussions
// Access:  TEACHER, ADMIN
// Body:    { name, description, departmentId, courseId }
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), async (req, res, next) => {
  try {
    const { name, description, departmentId, courseId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name is required.' });

    const group = await prisma.discussionGroup.create({
      data: {
        name,
        description,
        departmentId: departmentId || null,
        courseId: courseId || null,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Discussion group created successfully.',
      data: group
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/discussions
// Access:  All authenticated users (Students see their department/courses, Teachers see theirs, Admins see all)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const role = req.user.role;
    let groups = [];

    if (role === 'ADMIN') {
      groups = await prisma.discussionGroup.findMany({
        include: {
          department: true,
          course: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'TEACHER') {
      const teacher = req.user.teacherProfile;
      groups = await prisma.discussionGroup.findMany({
        where: {
          OR: [
            { createdById: req.user.id },
            { departmentId: teacher.departmentId },
            { courseId: { in: (await prisma.classSchedule.findMany({ where: { teacherId: teacher.id } })).map(s => s.courseId) } }
          ]
        },
        include: {
          department: true,
          course: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'STUDENT') {
      const student = req.user.studentProfile;
      
      // Get student's course IDs from their department and semester schedules
      const schedules = await prisma.classSchedule.findMany({
        where: {
          course: {
            departmentId: student.departmentId,
            semester: student.semester
          }
        }
      });
      const courseIds = [...new Set(schedules.map(s => s.courseId))];

      groups = await prisma.discussionGroup.findMany({
        where: {
          OR: [
            { departmentId: student.departmentId },
            { courseId: { in: courseIds } }
          ]
        },
        include: {
          department: true,
          course: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'PARENT') {
      // Parents can view discussions for their children's departments
      const childrenDepts = req.user.parentProfile.students.map(s => s.departmentId).filter(Boolean);
      groups = await prisma.discussionGroup.findMany({
        where: {
          departmentId: { in: childrenDepts }
        },
        include: {
          department: true,
          course: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/discussions/:id/messages
// Access:  All authenticated users member of the group
router.get('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if group exists
    const group = await prisma.discussionGroup.findUnique({
      where: { id }
    });

    if (!group) return res.status(404).json({ success: false, message: 'Discussion group not found.' });

    // Fetch messages
    const messages = await prisma.discussionMessage.findMany({
      where: { groupId: id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            adminProfile: { select: { name: true, profilePhoto: true } },
            teacherProfile: { select: { name: true, profilePhoto: true } },
            studentProfile: { select: { name: true, profilePhoto: true } },
            parentProfile: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Formatting sender names nicely before returning to frontend
    const formattedMessages = messages.map(msg => {
      let senderName = 'Unknown User';
      let avatar = '';

      if (msg.sender.role === 'ADMIN') {
        senderName = msg.sender.adminProfile?.name || 'Administrator';
        avatar = msg.sender.adminProfile?.profilePhoto || '';
      } else if (msg.sender.role === 'TEACHER') {
        senderName = msg.sender.teacherProfile?.name || 'Faculty';
        avatar = msg.sender.teacherProfile?.profilePhoto || '';
      } else if (msg.sender.role === 'STUDENT') {
        senderName = msg.sender.studentProfile?.name || 'Student';
        avatar = msg.sender.studentProfile?.profilePhoto || '';
      } else if (msg.sender.role === 'PARENT') {
        senderName = msg.sender.parentProfile?.name || 'Parent';
      }

      return {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          name: senderName,
          role: msg.sender.role,
          email: msg.sender.email,
          avatar
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/discussions/:id/messages
// Access:  All authenticated users
router.post('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const group = await prisma.discussionGroup.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ success: false, message: 'Discussion group not found.' });

    const message = await prisma.discussionMessage.create({
      data: {
        groupId: id,
        senderId: req.user.id,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            adminProfile: { select: { name: true, profilePhoto: true } },
            teacherProfile: { select: { name: true, profilePhoto: true } },
            studentProfile: { select: { name: true, profilePhoto: true } },
            parentProfile: { select: { name: true } }
          }
        }
      }
    });

    // Format sender info
    let senderName = 'Unknown User';
    if (message.sender.role === 'ADMIN') senderName = message.sender.adminProfile?.name || 'Administrator';
    else if (message.sender.role === 'TEACHER') senderName = message.sender.teacherProfile?.name || 'Faculty';
    else if (message.sender.role === 'STUDENT') senderName = message.sender.studentProfile?.name || 'Student';
    else if (message.sender.role === 'PARENT') senderName = message.sender.parentProfile?.name || 'Parent';

    return res.status(201).json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: senderName,
          role: message.sender.role,
          email: message.sender.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
