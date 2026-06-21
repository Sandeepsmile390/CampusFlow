import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.pushSubscription.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.placementApplication.deleteMany({});
  await prisma.placement.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.classSchedule.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Departments
  const cse = await prisma.department.create({
    data: { name: 'Computer Science and Engineering', code: 'CSE' }
  });
  const ece = await prisma.department.create({
    data: { name: 'Electronics and Communication Engineering', code: 'ECE' }
  });
  const me = await prisma.department.create({
    data: { name: 'Mechanical Engineering', code: 'ME' }
  });

  console.log('Created Departments.');

  // 2. Create Courses
  const dbms = await prisma.course.create({
    data: { name: 'Database Management Systems', code: 'CSE-301', credits: 4, departmentId: cse.id, semester: 3 }
  });
  const os = await prisma.course.create({
    data: { name: 'Operating Systems', code: 'CSE-302', credits: 4, departmentId: cse.id, semester: 3 }
  });
  const ai = await prisma.course.create({
    data: { name: 'Artificial Intelligence', code: 'CSE-501', credits: 3, departmentId: cse.id, semester: 5 }
  });
  const dsa = await prisma.course.create({
    data: { name: 'Data Structures and Algorithms', code: 'CSE-101', credits: 4, departmentId: cse.id, semester: 1 }
  });

  console.log('Created Courses.');

  // 3. Create Users & Profiles
  // Admin
  const adminUser = await prisma.user.create({
    data: { email: 'admin@university.edu', passwordHash, role: 'ADMIN' }
  });
  await prisma.admin.create({
    data: { userId: adminUser.id, name: 'Director Sarah Jenkins', phone: '9988776655' }
  });

  // Teachers
  const teacherUser1 = await prisma.user.create({
    data: { email: 'teacher.dbms@university.edu', passwordHash, role: 'TEACHER' }
  });
  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      name: 'Dr. Alice Vance',
      phone: '8877665544',
      qualifications: 'Ph.D. in Computer Science (Stanford)',
      experience: 12,
      departmentId: cse.id
    }
  });

  const teacherUser2 = await prisma.user.create({
    data: { email: 'teacher.os@university.edu', passwordHash, role: 'TEACHER' }
  });
  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      name: 'Prof. Bob Miller',
      phone: '7766554433',
      qualifications: 'M.Tech. in Systems Engineering (MIT)',
      experience: 8,
      departmentId: cse.id
    }
  });

  // Parents
  const parentUser = await prisma.user.create({
    data: { email: 'parent.doe@gmail.com', passwordHash, role: 'PARENT' }
  });
  const parent = await prisma.parent.create({
    data: { userId: parentUser.id, name: 'Robert Doe', phone: '9876543210' }
  });

  // Students
  const studentUser1 = await prisma.user.create({
    data: { email: 'student.john@university.edu', passwordHash, role: 'STUDENT' }
  });
  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      name: 'John Doe',
      rollNumber: 'CSE2026-001',
      phone: '9876543210',
      address: '123 University Dorms, Campus A',
      departmentId: cse.id,
      semester: 3,
      parentName: 'Robert Doe',
      parentEmail: 'parent.doe@gmail.com',
      parentPhone: '9876543210',
      parentId: parent.id
    }
  });

  const studentUser2 = await prisma.user.create({
    data: { email: 'student.jane@university.edu', passwordHash, role: 'STUDENT' }
  });
  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      name: 'Jane Smith',
      rollNumber: 'CSE2026-002',
      phone: '9876543211',
      address: '456 University Townhouses, Campus B',
      departmentId: cse.id,
      semester: 3,
      parentName: 'David Smith',
      parentEmail: 'parent.smith@gmail.com',
      parentPhone: '9876543211'
    }
  });

  console.log('Created Profiles.');

  // 4. Create Class Schedules
  await prisma.classSchedule.createMany({
    data: [
      { courseId: dbms.id, teacherId: teacher1.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', room: 'LH-101' },
      { courseId: dbms.id, teacherId: teacher1.id, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '10:30', room: 'LH-101' },
      { courseId: os.id, teacherId: teacher2.id, dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '12:30', room: 'LH-102' },
      { courseId: os.id, teacherId: teacher2.id, dayOfWeek: 'THURSDAY', startTime: '11:00', endTime: '12:30', room: 'LH-102' }
    ]
  });

  console.log('Created Schedules.');

  // 5. Create Attendance Records
  // We'll add attendance for past 10 days for both students in DBMS and OS
  const pastDates = [];
  for (let i = 1; i <= 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    pastDates.push(d);
  }

  for (const date of pastDates) {
    // Alternate status to make records realistic
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Mon-Fri
      // DBMS is Mon & Wed
      if (day === 1 || day === 3) {
        await prisma.attendance.create({
          data: {
            studentId: student1.id,
            courseId: dbms.id,
            date,
            status: Math.random() > 0.15 ? 'PRESENT' : (Math.random() > 0.5 ? 'LATE' : 'ABSENT'),
            markedById: teacher1.id,
            method: 'MANUAL'
          }
        });
        await prisma.attendance.create({
          data: {
            studentId: student2.id,
            courseId: dbms.id,
            date,
            status: Math.random() > 0.08 ? 'PRESENT' : 'ABSENT',
            markedById: teacher1.id,
            method: 'QR'
          }
        });
      }
      // OS is Tue & Thu
      if (day === 2 || day === 4) {
        await prisma.attendance.create({
          data: {
            studentId: student1.id,
            courseId: os.id,
            date,
            status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT',
            markedById: teacher2.id,
            method: 'MANUAL'
          }
        });
        await prisma.attendance.create({
          data: {
            studentId: student2.id,
            courseId: os.id,
            date,
            status: 'PRESENT',
            markedById: teacher2.id,
            method: 'FACE'
          }
        });
      }
    }
  }

  console.log('Created Attendance Records.');

  // 6. Create Assignments & Submissions
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'SQL Schema Design & Normalization',
      description: 'Design a normalized DB schema up to BCNF for an e-commerce platform and document the functional dependencies.',
      filePath: 'https://res.cloudinary.com/demo-cloud/image/upload/sample.pdf',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      courseId: dbms.id,
      teacherId: teacher1.id
    }
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Process Synchronization & Semaphore Implementation',
      description: 'Implement the bounded buffer and readers-writers synchronization problems using POSIX Semaphores in C.',
      filePath: 'https://res.cloudinary.com/demo-cloud/image/upload/sample.pdf',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (deadline passed)
      courseId: os.id,
      teacherId: teacher2.id
    }
  });

  // Submissions for assignment2 (deadline passed)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment2.id,
      studentId: student1.id,
      filePath: 'https://res.cloudinary.com/demo-cloud/image/upload/john_doe_os_submission.pdf',
      grade: 'A',
      feedback: 'Excellent work. The synchronization constraints were correctly satisfied and logic is clean.',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment2.id,
      studentId: student2.id,
      filePath: 'https://res.cloudinary.com/demo-cloud/image/upload/jane_smith_os_submission.pdf',
      grade: 'B+',
      feedback: 'Good implementation, but check for possible deadlock scenarios when resources are low.',
      submittedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Created Assignments and Submissions.');

  // 7. Create Fees
  await prisma.fee.createMany({
    data: [
      { studentId: student1.id, amount: 2500, dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), status: 'PAID', paidAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), transactionId: 'TXN-987654321-AB' },
      { studentId: student1.id, amount: 150, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: 'PENDING' },
      { studentId: student2.id, amount: 2500, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: 'PENDING' }
    ]
  });

  console.log('Created Fees.');

  // 8. Create Placements
  const placement1 = await prisma.placement.create({
    data: {
      company: 'Google Inc.',
      role: 'Associate Software Engineer',
      salaryPackage: '22 LPA',
      requirements: 'Strong coding skills in C++/Java/Python, OS concepts, networks, and databases.',
      eligibilityCriteria: 'CGPA >= 8.0, CSE/ECE only',
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
    }
  });

  const placement2 = await prisma.placement.create({
    data: {
      company: 'Microsoft',
      role: 'Support Engineer Intern',
      salaryPackage: '12 LPA',
      requirements: 'Familiarity with Cloud computing, Windows/Linux server management, troubleshooting scripts.',
      eligibilityCriteria: 'CGPA >= 7.0, all engineering streams',
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
    }
  });

  // Applications
  await prisma.placementApplication.create({
    data: {
      placementId: placement1.id,
      studentId: student1.id,
      resumeUrl: 'https://res.cloudinary.com/demo-cloud/image/upload/john_doe_resume.pdf',
      status: 'SHORTLISTED'
    }
  });

  await prisma.placementApplication.create({
    data: {
      placementId: placement2.id,
      studentId: student2.id,
      resumeUrl: 'https://res.cloudinary.com/demo-cloud/image/upload/jane_smith_resume.pdf',
      status: 'APPLIED'
    }
  });

  console.log('Created Placements.');

  // 9. Create Notices
  await prisma.notice.createMany({
    data: [
      { title: 'Welcome to the 2026 Academic Term!', content: 'Classes resume on Jan 5th. Make sure your department registrations are updated.', category: 'GENERAL', postedById: adminUser.id },
      { title: 'End Semester Exam Schedule Out', content: 'The end-semester exam starts on Dec 10th. Timetable has been posted under academics section.', category: 'EXAM', postedById: adminUser.id },
      { title: 'Google Offcampus Recruitment Drive', content: 'Google is hiring Associate Software Engineers. The application portal closes soon. Apply via dashboard.', category: 'PLACEMENT', postedById: adminUser.id }
    ]
  });

  console.log('Created Notices.');
  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
