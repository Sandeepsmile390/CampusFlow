import { Router } from 'express';
import prisma from '../../config/db.js';
import { authenticate } from '../../middlewares/auth.js';
import { generateAIContent } from '../../utils/gemini.js';

const router = Router();

// @route   POST /api/v1/ai/chat
// Access:  STUDENT, TEACHER, ADMIN, PARENT
router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

    // Build context instruction based on authenticated user profile
    let systemInstruction = `You are a helpful university AI Assistant embedded inside a Student Management System.
The current date is June 20, 2026.
Role: ${req.user.role}
Email: ${req.user.email}
`;

    if (req.user.role === 'STUDENT') {
      const student = req.user.studentProfile;
      // Fetch performance statistics to feed the AI context
      const attendance = await prisma.attendance.findMany({ where: { studentId: student.id } });
      const total = attendance.length;
      const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attRate = total > 0 ? ((present / total) * 100).toFixed(1) : '85.0';

      const submissions = await prisma.assignmentSubmission.findMany({ where: { studentId: student.id } });
      const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
      let pts = 0, count = 0;
      submissions.forEach(s => {
        if (s.grade && gradePoints[s.grade] !== undefined) {
          pts += gradePoints[s.grade];
          count++;
        }
      });
      const cgpa = count > 0 ? (pts / count).toFixed(2) : '8.40';

      systemInstruction += `Student Details:
- Name: ${student.name}
- Roll Number: ${student.rollNumber}
- Semester: ${student.semester}
- Department: ${student.department?.name || 'CSE'}
- CGPA: ${cgpa}
- Current Attendance: ${attRate}% (Present ${present} of ${total} classes)
`;
    } else if (req.user.role === 'TEACHER') {
      const teacher = req.user.teacherProfile;
      systemInstruction += `Teacher Details:
- Name: ${teacher.name}
- Qualifications: ${teacher.qualifications}
- Experience: ${teacher.experience} years
`;
    }

    const aiResponse = await generateAIContent(message, systemInstruction);

    return res.status(200).json({
      success: true,
      data: {
        response: aiResponse
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/ai/report/:studentId
// Access:  ADMIN, TEACHER, STUDENT, PARENT
router.get('/report/:studentId', authenticate, async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId, deletedAt: null },
      include: { department: true }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    // Fetch details
    const attendance = await prisma.attendance.findMany({ where: { studentId } });
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attRate = total > 0 ? ((present / total) * 100).toFixed(1) : '85.0';

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId },
      include: { assignment: { include: { course: true } } }
    });

    const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
    let pts = 0, count = 0;
    submissions.forEach(s => {
      if (s.grade && gradePoints[s.grade] !== undefined) {
        pts += gradePoints[s.grade];
        count++;
      }
    });
    const cgpa = count > 0 ? (pts / count).toFixed(2) : '8.40';

    // Call AI to write a formal summary report of the student
    const prompt = `Write a professional academic performance summary report for student ${student.name} (Roll No: ${student.rollNumber}) in CSE department.
CGPA is ${cgpa}/10.0.
Attendance rate is ${attRate}%.
Number of graded assignments submitted is ${count}.
Provide:
1. Executive Summary of academic health
2. Key strengths
3. Recommendations for improvement
Format the response using clear sections. Keep it professional.`;

    const systemInstruction = 'You are the University Director\'s Academic advisor assistant.';
    const reportText = await generateAIContent(prompt, systemInstruction);

    return res.status(200).json({
      success: true,
      data: {
        student: {
          name: student.name,
          rollNumber: student.rollNumber,
          semester: student.semester,
          department: student.department?.name,
          cgpa,
          attendanceRate: attRate
        },
        reportSummary: reportText
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
