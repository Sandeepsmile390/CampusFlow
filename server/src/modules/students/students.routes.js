import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// @route   GET /api/v1/students
// Access:  ADMIN, TEACHER
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const search = req.query.search || '';
    const departmentId = req.query.departmentId || '';
    const semester = req.query.semester ? parseInt(req.query.semester, 10) : undefined;
    
    const skip = (page - 1) * limit;

    // Filter construction
    const where = {
      deletedAt: null,
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { rollNumber: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ]
        } : {},
        departmentId ? { departmentId } : {},
        semester ? { semester } : {}
      ]
    };

    const [total, students] = await prisma.$transaction([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          user: { select: { email: true, isBlocked: true } }
        },
        orderBy: { rollNumber: 'asc' }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/students/:id
// Access:  ADMIN, TEACHER, STUDENT (own profile), PARENT (child profile)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // RBAC Guard - students can only see their own, parents can only see their children
    if (req.user.role === 'STUDENT' && req.user.studentProfile?.id !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only access your own profile.' });
    }
    if (req.user.role === 'PARENT') {
      const isChild = req.user.parentProfile?.students.some(s => s.id === id);
      if (!isChild) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only access your child\'s profile.' });
      }
    }

    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        user: { select: { email: true, role: true } },
        parent: true
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/students/:id
// Access:  ADMIN
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, departmentId, semester, profilePhoto, parentName, parentEmail, parentPhone } = req.body;

    const student = await prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const updated = await prisma.student.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        departmentId,
        semester: semester ? parseInt(semester, 10) : undefined,
        profilePhoto,
        parentName,
        parentEmail,
        parentPhone
      },
      include: { department: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/students/:id (Soft Delete)
// Access:  ADMIN
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    // Transaction to soft delete student, block user
    await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: { deletedAt: new Date(), isBlocked: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Student profile soft deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/students/bulk-import
// Access:  ADMIN
// Expects an array of students in JSON: req.body.students
router.post('/bulk-import', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { students } = req.body; // Array of students
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty array of students.' });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const errors = [];
    let importedCount = 0;

    for (const [index, std] of students.entries()) {
      const { email, name, rollNumber, phone, departmentCode, semester, parentName, parentEmail, parentPhone } = std;

      if (!email || !name || !rollNumber) {
        errors.push(`Row ${index + 1}: Missing email, name, or roll number.`);
        continue;
      }

      try {
        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
          errors.push(`Row ${index + 1}: Email ${email} already exists.`);
          continue;
        }

        const rollExists = await prisma.student.findUnique({ where: { rollNumber } });
        if (rollExists) {
          errors.push(`Row ${index + 1}: Roll number ${rollNumber} already exists.`);
          continue;
        }

        // Get department
        let departmentId = null;
        if (departmentCode) {
          const dept = await prisma.department.findUnique({ where: { code: departmentCode } });
          if (dept) departmentId = dept.id;
        }

        await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: { email, passwordHash: defaultPassword, role: 'STUDENT' }
          });
          
          let parentId = null;
          if (parentEmail) {
            let pUser = await tx.user.findUnique({ where: { email: parentEmail } });
            if (!pUser) {
              pUser = await tx.user.create({
                data: { email: parentEmail, passwordHash: defaultPassword, role: 'PARENT' }
              });
              const pProf = await tx.parent.create({
                data: { userId: pUser.id, name: parentName || 'Parent', phone: parentPhone || '' }
              });
              parentId = pProf.id;
            } else {
              const pProf = await tx.parent.findUnique({ where: { userId: pUser.id } });
              if (pProf) parentId = pProf.id;
            }
          }

          await tx.student.create({
            data: {
              userId: u.id,
              name,
              rollNumber,
              phone: phone?.toString() || null,
              departmentId,
              semester: semester ? parseInt(semester, 10) : 1,
              parentName: parentName || '',
              parentEmail: parentEmail || '',
              parentPhone: parentPhone?.toString() || '',
              parentId
            }
          });
        });

        importedCount++;
      } catch (err) {
        errors.push(`Row ${index + 1}: Transaction failed. Error: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk import completed. Successfully imported ${importedCount} of ${students.length} students.`,
      data: {
        importedCount,
        failedCount: errors.length,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/students/:id/performance
// Access:  ADMIN, TEACHER, STUDENT (own), PARENT (child)
router.get('/:id/performance', authenticate, async (req, res, next) => {
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

    // Retrieve attendance stats
    const attendance = await prisma.attendance.findMany({
      where: { studentId: id },
      include: { course: true }
    });

    const totalAttendance = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '100.0';

    // Retrieve graded assignments
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: id },
      include: {
        assignment: {
          include: { course: true }
        }
      }
    });

    // Compute grades/performance averages
    // Map letter grades to GPA equivalent
    const gradePoints = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0
    };
    
    let totalPoints = 0;
    let gradedCount = 0;
    const coursesPerformances = {};

    submissions.forEach(sub => {
      if (sub.grade && gradePoints[sub.grade] !== undefined) {
        const pt = gradePoints[sub.grade];
        totalPoints += pt;
        gradedCount++;

        const courseCode = sub.assignment.course.code;
        if (!coursesPerformances[courseCode]) {
          coursesPerformances[courseCode] = { total: 0, count: 0, name: sub.assignment.course.name };
        }
        coursesPerformances[courseCode].total += pt;
        coursesPerformances[courseCode].count++;
      }
    });

    const calculatedGPA = gradedCount > 0 ? (totalPoints / gradedCount).toFixed(2) : '8.50'; // Default/baseline
    const subjectWisePerformance = Object.keys(coursesPerformances).map(code => ({
      code,
      name: coursesPerformances[code].name,
      gpa: (coursesPerformances[code].total / coursesPerformances[code].count).toFixed(2)
    }));

    return res.status(200).json({
      success: true,
      data: {
        cgpa: calculatedGPA,
        gpa: calculatedGPA,
        attendancePercentage,
        totalClassesMarked: totalAttendance,
        presentClassesMarked: presentCount,
        subjectWisePerformance,
        submissionsCount: submissions.length,
        gradedSubmissionsCount: gradedCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
