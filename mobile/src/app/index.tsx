import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Megaphone,
  Briefcase,
  Bot,
  LogOut,
  Search,
  Send,
  QrCode,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  BookOpen,
  X,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Users,
  BookMarked,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Automatically switch backend target depending on platform environment
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1';

export default function MobileDashboard() {
  const [email, setEmail] = useState('student.john@university.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT'>('STUDENT');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    if (selectedRole === 'STUDENT') {
      setEmail('student.john@university.edu');
      setPassword('password123');
    } else if (selectedRole === 'TEACHER') {
      setEmail('teacher.dbms@university.edu');
      setPassword('password123');
    } else if (selectedRole === 'ADMIN') {
      setEmail('admin@university.edu');
      setPassword('password123');
    } else if (selectedRole === 'PARENT') {
      setEmail('parent.doe@gmail.com');
      setPassword('password123');
    }
  }, [selectedRole]);

  // Custom fetch wrapper that automatically injects CSRF headers and Authorization JWT
  const customFetch = async (url: string, options: any = {}) => {
    const headers: any = {
      'Content-Type': 'application/json',
      'x-csrf-token': 'university_sms_secure_token',
      'x-requested-with': 'XMLHttpRequest',
      ...options.headers
    };
    if (accessToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return fetch(url, { ...options, headers });
  };

  // Primary Navigation Tabs
  // DASHBOARD: Role portal overview
  // OPERATIONS: Admin Management / Teacher Attendance / Student Logs / Parent Monitoring
  // TASKS: Assignments submissions, grades & creations
  // CHAT_AI: Channels group discussions & Gemini virtual helper
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'OPERATIONS' | 'TASKS' | 'CHAT_AI'>('DASHBOARD');

  // Sector options inside tabs
  const [adminSector, setAdminSector] = useState<'STUDENTS' | 'TEACHERS' | 'COURSES' | 'SCHEDULES'>('STUDENTS');
  const [teacherSector, setTeacherSector] = useState<'REGISTER' | 'QR_GEN' | 'MARKS'>('REGISTER');
  const [studentSector, setStudentSector] = useState<'LOGS' | 'PLACEMENTS'>('LOGS');
  const [chatSector, setChatSector] = useState<'CHANNELS' | 'GEMINI'>('CHANNELS');

  // Shared Data States
  const [notices, setNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // 1. Discussions & Chats States
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Gemini AI Chat States
  const [aiMessages, setAiMessages] = useState<any[]>([
    { sender: 'ai', text: 'Welcome to your CampusFlow AI virtual mobile assistant. Ask me anything about course work, deadlines, or schedules!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 2. Assignments & Tasks States
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [submitFilePath, setSubmitFilePath] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Teacher Grading States
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // 3. Admin Management States
  const [adminStudents, setAdminStudents] = useState<any[]>([]);
  const [adminTeachers, setAdminTeachers] = useState<any[]>([]);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [adminSchedules, setAdminSchedules] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // Forms Modals Visibility
  const [studentFormVisible, setStudentFormVisible] = useState(false);
  const [teacherFormVisible, setTeacherFormVisible] = useState(false);
  const [courseFormVisible, setCourseFormVisible] = useState(false);
  const [scheduleFormVisible, setScheduleFormVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);

  // Form Inputs - Student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentDeptId, setStudentDeptId] = useState('');
  const [studentSemester, setStudentSemester] = useState('1');
  const [studentParentName, setStudentParentName] = useState('');
  const [studentParentEmail, setStudentParentEmail] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');

  // Form Inputs - Teacher
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherQuals, setTeacherQuals] = useState('');
  const [teacherExp, setTeacherExp] = useState('');
  const [teacherDeptId, setTeacherDeptId] = useState('');

  // Form Inputs - Course
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCredits, setCourseCredits] = useState('4');
  const [courseDeptId, setCourseDeptId] = useState('');
  const [courseSemester, setCourseSemester] = useState('1');

  // Form Inputs - Schedule
  const [schedCourseId, setSchedCourseId] = useState('');
  const [schedTeacherId, setSchedTeacherId] = useState('');
  const [schedDay, setSchedDay] = useState('MONDAY');
  const [schedStart, setSchedStart] = useState('09:00');
  const [schedEnd, setSchedEnd] = useState('10:30');
  const [schedRoom, setSchedRoom] = useState('LH-101');

  // Form Inputs - Notice
  const [newNotice, setNewNotice] = useState({ title: '', content: '', category: 'GENERAL' });
  const [noticePublishing, setNoticePublishing] = useState(false);

  // 4. Teacher Operations States
  const [activeMarkCourseId, setActiveMarkCourseId] = useState('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' }>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  const [generatedQrToken, setGeneratedQrToken] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [activeQrCourseId, setActiveQrCourseId] = useState('');

  const [gradeSheetCourseId, setGradeSheetCourseId] = useState('');
  const [gradeSheetInputs, setGradeSheetInputs] = useState<{ [studentId: string]: string }>({});

  // 5. Student Operations States
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [attendanceLogsLoading, setAttendanceLogsLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrScanning, setQrScanning] = useState(false);

  // Student Placements Board
  const [placements, setPlacements] = useState<any[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);
  const [resumeUrlInput, setResumeUrlInput] = useState('');
  const [placementModalVisible, setPlacementModalVisible] = useState(false);
  const [selectedPlacementId, setSelectedPlacementId] = useState('');
  const [submittingPlacementApp, setSubmittingPlacementApp] = useState(false);

  // 6. Parent Operations States
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childAttendance, setChildAttendance] = useState<any[]>([]);
  const [childFees, setChildFees] = useState<any[]>([]);
  const [childSchedules, setChildSchedules] = useState<any[]>([]);
  const [childLoading, setChildLoading] = useState(false);

  // Global Notice Publisher Form Modal Toggle
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', courseId: '', deadline: '' });
  const [assignmentFormVisible, setAssignmentFormVisible] = useState(false);
  const [postingAssignment, setPostingAssignment] = useState(false);

  // API Call Helpers
  const fetchNotices = async (token = accessToken) => {
    setNoticesLoading(true);
    try {
      const res = await customFetch(`${API_URL}/notices`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setNotices(json.data);
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setNoticesLoading(false);
    }
  };

  const fetchAssignments = async (token = accessToken) => {
    setAssignmentsLoading(true);
    try {
      const res = await customFetch(`${API_URL}/assignments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setAssignments(json.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId: string, token = accessToken) => {
    try {
      const res = await customFetch(`${API_URL}/assignments/submissions/${assignmentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setSubmissions(json.data);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const fetchDiscussions = async (token = accessToken) => {
    setGroupsLoading(true);
    try {
      const res = await customFetch(`${API_URL}/discussions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setGroups(json.data);
        if (json.data.length > 0 && !activeGroup) {
          selectGroup(json.data[0], token);
        }
      }
    } catch (err) {
      console.error('Failed to fetch discussion groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const selectGroup = async (group: any, token = accessToken) => {
    setActiveGroup(group);
    setMessagesLoading(true);
    try {
      const res = await customFetch(`${API_URL}/discussions/${group.id}/messages`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setMessages(json.data);
    } catch (err) {
      console.error('Failed to fetch group messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeGroup) return;
    setSendingMessage(true);
    try {
      const res = await customFetch(`${API_URL}/discussions/${activeGroup.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessageText })
      });
      const json = await res.json();
      if (json.success) {
        setNewMessageText('');
        selectGroup(activeGroup, accessToken);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendAiMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || aiInput;
    if (!promptToSend.trim()) return;

    setAiMessages(prev => [...prev, { sender: 'user', text: promptToSend }]);
    if (!customPrompt) setAiInput('');
    setAiLoading(true);

    try {
      const res = await customFetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: promptToSend })
      });
      const json = await res.json();
      if (json.success) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: json.data.response }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { sender: 'ai', text: 'Failed to request AI assistant.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Student QR Code self marking
  const handleQRCheckIn = async () => {
    if (!qrTokenInput.trim()) {
      Alert.alert('Error', 'Please enter a signed QR token.');
      return;
    }
    setQrScanning(true);
    try {
      const res = await customFetch(`${API_URL}/attendance/qr/scan`, {
        method: 'POST',
        body: JSON.stringify({ qrToken: qrTokenInput })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Attendance marked successfully!');
        setQrModalVisible(false);
        setQrTokenInput('');
        fetchStudentAttendanceLogs();
      } else {
        Alert.alert('Failed', json.message || 'Verification failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Verification token invalid or network timeout.');
    } finally {
      setQrScanning(false);
    }
  };

  // Student Assignment File Submission
  const handleAssignmentSubmit = async () => {
    if (!submitFilePath.trim() || !activeAssignment) return;
    setSubmittingAssignment(true);
    try {
      const res = await customFetch(`${API_URL}/assignments/${activeAssignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ filePath: submitFilePath })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Assignment submitted.');
        setSubmissionModalVisible(false);
        setSubmitFilePath('');
        fetchAssignments();
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Student Placements Board
  const fetchPlacements = async (token = accessToken) => {
    setPlacementsLoading(true);
    try {
      const res = await customFetch(`${API_URL}/placements`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setPlacements(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPlacementsLoading(false);
    }
  };

  const handleApplyPlacement = async () => {
    if (!resumeUrlInput.trim() || !selectedPlacementId) return;
    setSubmittingPlacementApp(true);
    try {
      const res = await customFetch(`${API_URL}/placements/${selectedPlacementId}/apply`, {
        method: 'POST',
        body: JSON.stringify({ resumeUrl: resumeUrlInput })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Applied!', 'Your application has been registered successfully.');
        setPlacementModalVisible(false);
        setResumeUrlInput('');
        fetchPlacements();
      } else {
        Alert.alert('Failed', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not apply.');
    } finally {
      setSubmittingPlacementApp(false);
    }
  };

  // Student Attendance Log fetch
  const fetchStudentAttendanceLogs = async (studentId?: string, token = accessToken) => {
    setAttendanceLogsLoading(true);
    const targetId = studentId || user.profile.id;
    try {
      const res = await customFetch(`${API_URL}/attendance/student/${targetId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) setAttendanceLogs(json.data);
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setAttendanceLogsLoading(false);
    }
  };

  // Teacher manual student load
  const loadClassStudents = async (courseId: string) => {
    setStudentsLoading(true);
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const res = await customFetch(`${API_URL}/students?departmentId=${course.departmentId}&semester=${course.semester}`);
      const json = await res.json();
      if (json.success) {
        setClassStudents(json.data);
        const initRecs: { [id: string]: 'PRESENT' | 'ABSENT' } = {};
        json.data.forEach((s: any) => {
          initRecs[s.id] = 'PRESENT';
        });
        setAttendanceRecords(initRecs);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve department student roster.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Teacher submit manual attendance register
  const handleSaveAttendance = async () => {
    if (!activeMarkCourseId) return;
    setSubmittingAttendance(true);
    try {
      const records = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));

      const res = await customFetch(`${API_URL}/attendance/mark`, {
        method: 'POST',
        body: JSON.stringify({
          courseId: activeMarkCourseId,
          date: new Date().toISOString().split('T')[0],
          method: 'MANUAL',
          records
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Attendance sheet recorded successfully.');
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to mark attendance.');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Teacher generate rotating QR check-in
  const handleGenerateQR = async () => {
    if (!activeQrCourseId) return;
    setGeneratingQr(true);
    try {
      const res = await customFetch(`${API_URL}/attendance/qr/generate`, {
        method: 'POST',
        body: JSON.stringify({ courseId: activeQrCourseId })
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedQrToken(json.data.token);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate session code.');
    } finally {
      setGeneratingQr(false);
    }
  };

  // Teacher post new Assignment task
  const handlePostAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.description.trim() || !newAssignment.courseId || !newAssignment.deadline) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    setPostingAssignment(true);
    try {
      const res = await customFetch(`${API_URL}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          title: newAssignment.title,
          description: newAssignment.description,
          courseId: newAssignment.courseId,
          deadline: new Date(newAssignment.deadline).toISOString()
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Assignment posted successfully.');
        setAssignmentFormVisible(false);
        setNewAssignment({ title: '', description: '', courseId: '', deadline: '' });
        fetchAssignments();
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setPostingAssignment(false);
    }
  };

  // Teacher Grading Homework
  const handleTeacherGrade = async () => {
    if (!gradeInput || !selectedSubmission) return;
    setSubmittingGrade(true);
    try {
      const res = await customFetch(`${API_URL}/assignments/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({ grade: gradeInput, feedback: feedbackInput })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Submission graded successfully.');
        setGradingModalVisible(false);
        setGradeInput('');
        setFeedbackInput('');
        fetchSubmissions(activeAssignment.id);
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to grade submission.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Admin Management Fetch Helpers
  const fetchAdminManagementData = async (sector = adminSector) => {
    setAdminLoading(true);
    try {
      if (sector === 'STUDENTS') {
        const res = await customFetch(`${API_URL}/students`);
        const json = await res.json();
        if (json.success) setAdminStudents(json.data);
      } else if (sector === 'TEACHERS') {
        const res = await customFetch(`${API_URL}/teachers`);
        const json = await res.json();
        if (json.success) setAdminTeachers(json.data);
      } else if (sector === 'COURSES') {
        const res = await customFetch(`${API_URL}/courses`);
        const json = await res.json();
        if (json.success) setAdminCourses(json.data);
      } else if (sector === 'SCHEDULES') {
        const res = await customFetch(`${API_URL}/courses/schedules`);
        const json = await res.json();
        if (json.success) setAdminSchedules(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchDepartmentsList = async () => {
    try {
      const res = await customFetch(`${API_URL}/courses/departments`);
      const json = await res.json();
      if (json.success) setDepartments(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoursesList = async () => {
    try {
      const res = await customFetch(`${API_URL}/courses`);
      const json = await res.json();
      if (json.success) setCourses(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Create Operations
  const handleRegisterStudent = async () => {
    if (!studentName || !studentEmail || !studentRoll || !studentDeptId) {
      Alert.alert('Validation Error', 'Name, Email, Roll, and Dept are required.');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await customFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          email: studentEmail,
          password: 'password123',
          role: 'STUDENT',
          name: studentName,
          rollNumber: studentRoll,
          departmentId: studentDeptId,
          semester: parseInt(studentSemester, 10),
          parentName: studentParentName,
          parentEmail: studentParentEmail,
          parentPhone: studentParentPhone
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Student registered successfully.');
        setStudentFormVisible(false);
        // reset forms
        setStudentName('');
        setStudentEmail('');
        setStudentRoll('');
        fetchAdminManagementData('STUDENTS');
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Creation failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleHireTeacher = async () => {
    if (!teacherName || !teacherEmail || !teacherQuals || !teacherDeptId) {
      Alert.alert('Validation Error', 'Name, Email, Qualifications, and Dept are required.');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await customFetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          email: teacherEmail,
          password: 'password123',
          role: 'TEACHER',
          name: teacherName,
          qualifications: teacherQuals,
          experience: parseInt(teacherExp || '0', 10),
          departmentId: teacherDeptId
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Teacher hired successfully.');
        setTeacherFormVisible(false);
        setTeacherName('');
        setTeacherEmail('');
        setTeacherQuals('');
        setTeacherExp('');
        fetchAdminManagementData('TEACHERS');
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Hire transaction failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseName || !courseCode || !courseDeptId) {
      Alert.alert('Validation Error', 'Name, Code, and Dept are required.');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await customFetch(`${API_URL}/courses`, {
        method: 'POST',
        body: JSON.stringify({
          name: courseName,
          code: courseCode,
          credits: parseInt(courseCredits, 10),
          departmentId: courseDeptId,
          semester: parseInt(courseSemester, 10)
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Course created.');
        setCourseFormVisible(false);
        setCourseName('');
        setCourseCode('');
        fetchAdminManagementData('COURSES');
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Course create failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedCourseId || !schedTeacherId || !schedRoom) {
      Alert.alert('Validation Error', 'Select Course, Teacher, and input Room.');
      return;
    }
    setAdminLoading(true);
    try {
      const res = await customFetch(`${API_URL}/courses/schedules`, {
        method: 'POST',
        body: JSON.stringify({
          courseId: schedCourseId,
          teacherId: schedTeacherId,
          dayOfWeek: schedDay,
          startTime: schedStart,
          endTime: schedEnd,
          room: schedRoom
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Timetable slot created.');
        setScheduleFormVisible(false);
        setSchedRoom('');
        fetchAdminManagementData('SCHEDULES');
      } else {
        Alert.alert('Error', json.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Schedule mapping failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin Delete Actions
  const handleDeleteStudent = async (studentId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await customFetch(`${API_URL}/students/${studentId}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Deleted', 'Student record removed.');
              fetchAdminManagementData('STUDENTS');
            }
          } catch (err) {
            Alert.alert('Error', 'Delete failed.');
          }
        }
      }
    ]);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this teacher?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await customFetch(`${API_URL}/teachers/${teacherId}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Deleted', 'Teacher record removed.');
              fetchAdminManagementData('TEACHERS');
            }
          } catch (err) {
            Alert.alert('Error', 'Delete failed.');
          }
        }
      }
    ]);
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert('Confirm Delete', 'Soft delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await customFetch(`${API_URL}/courses/${courseId}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Deleted', 'Course soft deleted.');
              fetchAdminManagementData('COURSES');
            }
          } catch (err) {
            Alert.alert('Error', 'Delete failed.');
          }
        }
      }
    ]);
  };

  const handleDeleteSchedule = async (schedId: string) => {
    Alert.alert('Confirm Delete', 'Remove this timetable slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await customFetch(`${API_URL}/courses/schedules/${schedId}`, {
              method: 'DELETE'
            });
            const json = await res.json();
            if (json.success) {
              Alert.alert('Success', 'Slot removed.');
              fetchAdminManagementData('SCHEDULES');
            }
          } catch (err) {
            Alert.alert('Error', 'Delete failed.');
          }
        }
      }
    ]);
  };

  // Notice board publishers
  const handlePublishNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      Alert.alert('Error', 'Title and Content are required.');
      return;
    }
    setNoticePublishing(true);
    try {
      const res = await customFetch(`${API_URL}/notices`, {
        method: 'POST',
        body: JSON.stringify({
          title: newNotice.title,
          content: newNotice.content,
          category: newNotice.category
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Published', 'Notice board updated.');
        setPublishModalVisible(false);
        setNewNotice({ title: '', content: '', category: 'GENERAL' });
        fetchNotices();
      }
    } catch (err) {
      Alert.alert('Error', 'Notice publication failed.');
    } finally {
      setNoticePublishing(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const res = await customFetch(`${API_URL}/notices/${noticeId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Notice removed.');
        fetchNotices();
      }
    } catch (err) {
      Alert.alert('Error', 'Notice deletion failed.');
    }
  };

  // Parent child selector handler
  const loadChildData = async (childId: string) => {
    setChildLoading(true);
    try {
      const student = user.parentProfile.students.find((s: any) => s.id === childId);
      if (!student) return;

      const attRes = await customFetch(`${API_URL}/attendance/student/${student.id}`);
      const attJson = await attRes.json();
      if (attJson.success) setChildAttendance(attJson.data);

      const feeRes = await customFetch(`${API_URL}/fees?studentId=${student.id}`);
      const feeJson = await feeRes.json();
      if (feeJson.success) setChildFees(feeJson.data);

      const schedRes = await customFetch(`${API_URL}/courses/schedules?departmentId=${student.departmentId}&semester=${student.semester}`);
      const schedJson = await schedRes.json();
      if (schedJson.success) setChildSchedules(schedJson.data);

    } catch (err) {
      console.error('Child fetch error:', err);
    } finally {
      setChildLoading(false);
    }
  };

  // Pay unpaid child invoices (simulated)
  const handlePayFee = async (feeId: string, studentId: string) => {
    try {
      const res = await customFetch(`${API_URL}/fees/${feeId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ transactionId: `MOCK-PAY-${Date.now()}` })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Payment processed successfully.');
        if (user.role === 'PARENT') {
          loadChildData(studentId);
        } else {
          fetchStudentDashboardData(studentId, accessToken);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Payment failed.');
    }
  };

  // Dashboard Data loading triggers
  const fetchStudentDashboardData = async (studentId: string, token = accessToken) => {
    try {
      const feesRes = await customFetch(`${API_URL}/fees?studentId=${studentId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const feesJson = await feesRes.json();
      if (feesJson.success) setFees(feesJson.data);

      const schedRes = await customFetch(`${API_URL}/courses/schedules`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const schedJson = await schedRes.json();
      if (schedJson.success) setSchedules(schedJson.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeacherDashboardData = async (teacherId: string, token = accessToken) => {
    try {
      const schedRes = await customFetch(`${API_URL}/courses/schedules?teacherId=${teacherId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const schedJson = await schedRes.json();
      if (schedJson.success) setSchedules(schedJson.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (prefillEmail = email, prefillPass = password) => {
    if (!prefillEmail || !prefillPass) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await customFetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: prefillEmail, password: prefillPass })
      });
      const json = await response.json();
      if (json.success) {
        const loggedInUser = json.data.user;
        const token = json.data.accessToken;
        setUser(loggedInUser);
        setAccessToken(token);

        fetchNotices(token);
        fetchAssignments(token);
        fetchDiscussions(token);
        fetchDepartmentsList();
        fetchCoursesList();

        if (loggedInUser.role === 'STUDENT') {
          fetchStudentDashboardData(loggedInUser.profile.id, token);
          fetchStudentAttendanceLogs(loggedInUser.profile.id, token);
          fetchPlacements(token);
        } else if (loggedInUser.role === 'TEACHER') {
          fetchTeacherDashboardData(loggedInUser.profile.id, token);
        } else if (loggedInUser.role === 'ADMIN') {
          fetchAdminManagementData('STUDENTS');
        } else if (loggedInUser.role === 'PARENT') {
          if (loggedInUser.parentProfile?.students?.length > 0) {
            const firstChild = loggedInUser.parentProfile.students[0].id;
            setSelectedChildId(firstChild);
            loadChildData(firstChild);
          }
        }
      } else {
        Alert.alert('Login Failed', json.message || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Network Error', `Could not connect to API server at ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken('');
    setSchedules([]);
    setFees([]);
    setNotices([]);
    setAssignments([]);
    setGroups([]);
    setActiveGroup(null);
    setActiveTab('DASHBOARD');
  };

  const getNoticeCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'EXAM': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'HOLIDAY': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'PLACEMENT': return { color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)' };
      default: return { color: '#4338CA', bg: 'rgba(67, 56, 202, 0.1)' };
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.loginScroll}>
          <View style={styles.loginHeader}>
            <View style={styles.logoBadge}>
              <Sparkles size={32} color="#14B8A6" />
            </View>
            <Text style={styles.appName}>CampusFlow</Text>
            <Text style={styles.appSubtitle}>Secure Mobile Client Portal</Text>
          </View>

          <View style={styles.glassForm}>
            <Text style={styles.formTitle}>Sign In to portal</Text>
            <Text style={styles.formSubtitle}>Enter your credentials to enter ERP system</Text>

            {/* Access Role Dropdown */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ACCESS ROLE</Text>
              <TouchableOpacity
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                style={styles.dropdownTrigger}
              >
                <Text style={styles.dropdownTriggerText}>
                  {selectedRole === 'STUDENT' ? 'Student' : selectedRole === 'TEACHER' ? 'Teacher' : selectedRole === 'ADMIN' ? 'Admin' : 'Parent'}
                </Text>
                {showRoleDropdown ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
              </TouchableOpacity>
              {showRoleDropdown && (
                <View style={styles.dropdownMenu}>
                  {(['STUDENT', 'TEACHER', 'ADMIN', 'PARENT'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => {
                        setSelectedRole(r);
                        setShowRoleDropdown(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        selectedRole === r && styles.dropdownItemActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedRole === r && styles.dropdownItemTextActive
                        ]}
                      >
                        {r === 'STUDENT' ? 'Student' : r === 'TEACHER' ? 'Teacher' : r === 'ADMIN' ? 'Admin' : 'Parent'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Email Address */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputFieldContainer}>
                <Mail size={18} color="#94A3B8" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.textInput, { marginLeft: 10 }]}
                  placeholder="name@university.edu"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password with Forgot Password link */}
            <View style={styles.inputWrapper}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { marginBottom: 0 }]}>PASSWORD</Text>
                <TouchableOpacity onPress={() => Alert.alert('Reset Token', 'Check database reset tokens flow.')}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputFieldContainer}>
                <Lock size={18} color="#94A3B8" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.textInput, { marginLeft: 10 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleLogin()}
              disabled={loading}
              style={styles.signInButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In to Account →</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.mockTitle}>Development Simulator Logins</Text>
          <View style={styles.mockButtonsContainer}>
            <TouchableOpacity
              onPress={() => { setSelectedRole('ADMIN'); handleLogin('admin@university.edu', 'password123'); }}
              style={styles.mockButton}
            >
              <UserCheck size={14} color="#EF4444" />
              <Text style={styles.mockButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedRole('TEACHER'); handleLogin('teacher.dbms@university.edu', 'password123'); }}
              style={styles.mockButton}
            >
              <GraduationCap size={14} color="#4338CA" />
              <Text style={styles.mockButtonText}>Teacher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedRole('STUDENT'); handleLogin('student.john@university.edu', 'password123'); }}
              style={styles.mockButton}
            >
              <UserCheck size={14} color="#14B8A6" />
              <Text style={styles.mockButtonText}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setSelectedRole('PARENT'); handleLogin('parent.doe@gmail.com', 'password123'); }}
              style={styles.mockButton}
            >
              <Users size={14} color="#38BDF8" />
              <Text style={styles.mockButtonText}>Parent</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.apiLabelContainer}>
            <Text style={styles.apiLabelText}>Server End: {API_URL}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" />

      {/* Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarRow}>
          <Image
            source={{ uri: user.profile?.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}` }}
            style={styles.avatarImage}
          />
          <View style={styles.profileMeta}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.profileName}>{user.profile?.name || 'Administrator'}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={18} color="#F43F5E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Navigator */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('DASHBOARD')}
          style={[styles.tabButton, activeTab === 'DASHBOARD' && styles.tabButtonActive]}
        >
          <LayoutDashboard size={18} color={activeTab === 'DASHBOARD' ? '#14B8A6' : '#94A3B8'} />
          <Text style={[styles.tabButtonText, activeTab === 'DASHBOARD' && styles.tabButtonTextActive]}>Portal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('OPERATIONS');
            if (user.role === 'ADMIN') {
              fetchAdminManagementData(adminSector);
            }
          }}
          style={[styles.tabButton, activeTab === 'OPERATIONS' && styles.tabButtonActive]}
        >
          <ClipboardCheck size={18} color={activeTab === 'OPERATIONS' ? '#14B8A6' : '#94A3B8'} />
          <Text style={[styles.tabButtonText, activeTab === 'OPERATIONS' && styles.tabButtonTextActive]}>
            {user.role === 'ADMIN' ? 'Manage' : user.role === 'TEACHER' ? 'Attendance' : user.role === 'STUDENT' ? 'Logs' : 'Child Monitor'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setActiveTab('TASKS'); fetchAssignments(); }}
          style={[styles.tabButton, activeTab === 'TASKS' && styles.tabButtonActive]}
        >
          <BookOpen size={18} color={activeTab === 'TASKS' ? '#14B8A6' : '#94A3B8'} />
          <Text style={[styles.tabButtonText, activeTab === 'TASKS' && styles.tabButtonTextActive]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setActiveTab('CHAT_AI'); fetchDiscussions(); }}
          style={[styles.tabButton, activeTab === 'CHAT_AI' && styles.tabButtonActive]}
        >
          <MessageSquare size={18} color={activeTab === 'CHAT_AI' ? '#14B8A6' : '#94A3B8'} />
          <Text style={[styles.tabButtonText, activeTab === 'CHAT_AI' && styles.tabButtonTextActive]}>Chat & AI</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Screen Switcher */}
      {activeTab === 'DASHBOARD' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. WELCOME HERO CARD */}
          <View style={styles.dashboardHeroCard}>
            <Text style={styles.heroTitle}>
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'} 👋
            </Text>
            <Text style={styles.heroSubtitle}>
              {user.role === 'STUDENT'
                ? `Welcome back, ${user.profile?.name || 'Student'}. Manage your courses, view grades, and check timetables efficiently.`
                : user.role === 'TEACHER'
                ? `Welcome back, ${user.profile?.name || 'Teacher'}. Manage schedules, verify grade inputs, and generate class reports.`
                : `Welcome back, Administrator. Access roster logs, publish bulletins, and assign department mapped timetables.`}
            </Text>
          </View>

          {/* 2. STATS GRID */}
          {user.role === 'STUDENT' && (
            <View style={styles.statsCardGrid}>
              <View style={styles.statDoubleCard}>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>CUMULATIVE GPA</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                      <Award size={16} color="#6366F1" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>9.50 / 10.0</Text>
                  <Text style={styles.statCardSubtitle}>Excellent Standing</Text>
                </View>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>TOTAL ATTENDANCE</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <CheckCircle size={16} color="#10B981" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>
                    {attendanceLogs.length > 0
                      ? `${((attendanceLogs.filter(a => a.status === 'PRESENT').length / attendanceLogs.length) * 100).toFixed(1)}%`
                      : '85.7%'}
                  </Text>
                  <Text style={styles.statCardSubtitle}>Compliant</Text>
                </View>
              </View>

              <View style={styles.statDoubleCard}>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>PENDING TASKS</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                      <BookOpen size={16} color="#38BDF8" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>
                    {assignments.filter(asg => !asg.submissions || asg.submissions.length === 0).length || '1'}
                  </Text>
                  <Text style={styles.statCardSubtitle}>Due shortly</Text>
                </View>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>FEE BALANCE</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                      <IndianRupee size={16} color="#14B8A6" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>
                    ₹{fees.reduce((acc, curr) => curr.status === 'PENDING' ? acc + curr.amount : acc, 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.statCardSubtitle}>
                    {fees.reduce((acc, curr) => curr.status === 'PENDING' ? acc + curr.amount : acc, 0) === 0 ? 'All Paid' : 'Pending Payment'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {user.role === 'TEACHER' && (
            <View style={styles.statsCardGrid}>
              <View style={styles.statDoubleCard}>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>ASSIGNED CLASSES</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                      <BookMarked size={16} color="#6366F1" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>{schedules.length || '2'}</Text>
                  <Text style={styles.statCardSubtitle}>Active slots</Text>
                </View>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>TOTAL STUDENT SCOPE</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Users size={16} color="#10B981" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>45</Text>
                  <Text style={styles.statCardSubtitle}>Registered scope</Text>
                </View>
              </View>

              <View style={styles.statDoubleCard}>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>PENDING GRADINGS</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                      <ClipboardCheck size={16} color="#38BDF8" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>3</Text>
                  <Text style={styles.statCardSubtitle}>Ungraded inputs</Text>
                </View>
                <View style={styles.statItemCard}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statCardTitle}>CLASSES TODAY</Text>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                      <Calendar size={16} color="#14B8A6" />
                    </View>
                  </View>
                  <Text style={styles.statCardValue}>2</Text>
                  <Text style={styles.statCardSubtitle}>Lectures today</Text>
                </View>
              </View>
            </View>
          )}

          {user.role === 'ADMIN' && (
            <View style={styles.adminStatsRow}>
              <View style={styles.statMiniCard}>
                <Users size={20} color="#14B8A6" />
                <Text style={styles.statMiniVal}>{adminStudents.length || '120'}</Text>
                <Text style={styles.statMiniLabel}>Students</Text>
              </View>
              <View style={styles.statMiniCard}>
                <GraduationCap size={20} color="#4338CA" />
                <Text style={styles.statMiniVal}>{adminTeachers.length || '15'}</Text>
                <Text style={styles.statMiniLabel}>Teachers</Text>
              </View>
              <View style={styles.statMiniCard}>
                <BookMarked size={20} color="#38BDF8" />
                <Text style={styles.statMiniVal}>{adminCourses.length || '8'}</Text>
                <Text style={styles.statMiniLabel}>Courses</Text>
              </View>
            </View>
          )}

          {/* 3. PERFORMANCE CHART (STUDENT ONLY) */}
          {user.role === 'STUDENT' && (
            <View style={styles.chartContainerCard}>
              <Text style={styles.chartCardTitle}>Subject Performance Analysis</Text>
              <View style={styles.chartContentWrapper}>
                {/* Y Axis */}
                <View style={styles.chartYAxis}>
                  <Text style={styles.chartYLabel}>10</Text>
                  <Text style={styles.chartYLabel}>6</Text>
                  <Text style={styles.chartYLabel}>3</Text>
                  <Text style={styles.chartYLabel}>0</Text>
                </View>

                {/* Bars Area */}
                <View style={styles.chartBarsArea}>
                  <View style={styles.chartBarCol}>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBarFill, { height: '90%' }]} />
                    </View>
                    <Text style={styles.chartBarLabel}>CSE-302</Text>
                  </View>
                  <View style={styles.chartBarCol}>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBarFill, { height: '100%' }]} />
                    </View>
                    <Text style={styles.chartBarLabel}>CSE-301</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 4. UPCOMING SCHEDULES / WEEKLY TIMETABLE TABLE */}
          {user.role === 'STUDENT' && (
            <View style={styles.upcomingSchedulesCard}>
              <Text style={styles.upcomingTitleText}>Upcoming Schedules</Text>
              <View style={[styles.upcomingItemCard, { borderLeftColor: '#EF4444' }]}>
                <View style={styles.upcomingBadgeRow}>
                  <View style={[styles.upcomingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Text style={[styles.upcomingBadgeText, { color: '#EF4444' }]}>EXAM RETEST</Text>
                  </View>
                </View>
                <Text style={styles.upcomingCourseName}>Operating Systems Midterm</Text>
                <Text style={styles.upcomingTimeText}>Dec 8th at 10:00 AM | Room LH-102</Text>
              </View>

              <View style={[styles.upcomingItemCard, { borderLeftColor: '#38BDF8' }]}>
                <View style={styles.upcomingBadgeRow}>
                  <View style={[styles.upcomingBadge, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                    <Text style={[styles.upcomingBadgeText, { color: '#38BDF8' }]}>LAB VIVA</Text>
                  </View>
                </View>
                <Text style={styles.upcomingCourseName}>Database Systems Lab Exam</Text>
                <Text style={styles.upcomingTimeText}>Dec 12th at 2:00 PM | Room DBMS Lab</Text>
              </View>
            </View>
          )}

          {user.role === 'TEACHER' && (
            <View style={styles.upcomingSchedulesCard}>
              <Text style={styles.upcomingTitleText}>Weekly Lecture Timetable</Text>
              <View style={styles.timetableTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>DAY</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>SUB CODE</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>COURSE NAME</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>LECTURE SLOT</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>ROOM</Text>
                </View>
                {schedules.length > 0 ? (
                  schedules.map((item, idx) => (
                    <View key={item.id || idx} style={styles.tableBodyRow}>
                      <Text style={[styles.tableBodyCell, { flex: 1.2, fontWeight: '700' }]}>{item.dayOfWeek}</Text>
                      <Text style={[styles.tableBodyCell, { flex: 1.2, color: '#38BDF8' }]}>{item.course?.code}</Text>
                      <Text style={[styles.tableBodyCell, { flex: 2.2 }]}>{item.course?.name}</Text>
                      <Text style={[styles.tableBodyCell, { flex: 1.8 }]}>{item.startTime} - {item.endTime}</Text>
                      <Text style={[styles.tableBodyCell, { flex: 1.2 }]}>{item.room}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No timetables schedules mapped.</Text>
                )}
              </View>
            </View>
          )}

          {/* Quick operations actions (e.g. Scan) */}
          {user.role === 'STUDENT' && (
            <View style={[styles.quickGrid, { marginTop: 12 }]}>
              <TouchableOpacity onPress={() => setQrModalVisible(true)} style={styles.quickCard}>
                <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                  <QrCode size={22} color="#14B8A6" />
                </View>
                <Text style={styles.quickTitle}>QR Scanner</Text>
                <Text style={styles.quickDesc}>Log Class Check-In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Timetable agenda fallback */}
          {user.role !== 'ADMIN' && user.role !== 'PARENT' && (
            <>
              <Text style={styles.sectionTitle}>Daily Class Agenda</Text>
              <View style={styles.scheduleList}>
                {schedules.length > 0 ? (
                  schedules.map((item, idx) => (
                    <View key={item.id || idx} style={styles.scheduleItem}>
                      <View style={styles.scheduleTimeBadge}>
                        <Text style={styles.scheduleTimeText}>{item.startTime}</Text>
                        <Text style={styles.scheduleTimeSub}>Room {item.room}</Text>
                      </View>
                      <View style={styles.scheduleDetails}>
                        <Text style={styles.scheduleCourseName}>{item.course?.name}</Text>
                        <Text style={styles.scheduleFaculty}>{item.teacher?.name}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No lectures on the agenda today.</Text>
                )}
              </View>
            </>
          )}

          {/* Global Notice Feed */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Global Campus Notices</Text>
            <TouchableOpacity onPress={() => fetchNotices()} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noticesFeed}>
            {noticesLoading ? (
              <ActivityIndicator color="#14B8A6" />
            ) : notices.length > 0 ? (
              notices.map((notice) => {
                const catStyle = getNoticeCategoryStyle(notice.category);
                return (
                  <View key={notice.id} style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                      <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
                        <Text style={[styles.categoryText, { color: catStyle.color }]}>{notice.category}</Text>
                      </View>
                      {(user.role === 'ADMIN' || notice.postedById === user.id) && (
                        <TouchableOpacity onPress={() => handleDeleteNotice(notice.id)} style={styles.deleteButton}>
                          <Trash2 size={14} color="#F43F5E" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.noticeTitleText}>{notice.title}</Text>
                    <Text style={styles.noticeContentText}>{notice.content}</Text>
                    <View style={styles.noticeFooter}>
                      <Text style={styles.noticeAuthor}>Author: {notice.postedBy?.email.split('@')[0]}</Text>
                      <Text style={styles.noticeDate}>{new Date(notice.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No bulletins posted.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'OPERATIONS' && (
        <View style={{ flex: 1 }}>
          {/* 1. ADMIN MANAGEMENT SCREEN */}
          {user.role === 'ADMIN' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subSegmentContainer}>
                {(['STUDENTS', 'TEACHERS', 'COURSES', 'SCHEDULES'] as const).map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => {
                      setAdminSector(sec as any);
                      fetchAdminManagementData(sec);
                    }}
                    style={[styles.subSegmentBtn, adminSector === sec && styles.subSegmentBtnActive]}
                  >
                    <Text style={[styles.subSegmentText, adminSector === sec && styles.subSegmentTextActive]}>{sec.substring(0, 4)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Active Roster: {adminSector}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (adminSector === 'STUDENTS') setStudentFormVisible(true);
                      else if (adminSector === 'TEACHERS') setTeacherFormVisible(true);
                      else if (adminSector === 'COURSES') setCourseFormVisible(true);
                      else if (adminSector === 'SCHEDULES') setScheduleFormVisible(true);
                    }}
                    style={styles.refreshButton}
                  >
                    <Text style={styles.refreshButtonText}>+ Add {adminSector.slice(0, -1)}</Text>
                  </TouchableOpacity>
                </View>

                {adminLoading ? (
                  <ActivityIndicator color="#14B8A6" style={{ marginTop: 20 }} />
                ) : (
                  <View style={{ gap: 10 }}>
                    {adminSector === 'STUDENTS' && adminStudents.map((st) => (
                      <View key={st.id} style={styles.scheduleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleCourseName}>{st.name}</Text>
                          <Text style={styles.scheduleFaculty}>Roll: {st.rollNumber} | Sem: {st.semester}</Text>
                          <Text style={styles.noticeAuthor}>Email: {st.user?.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteStudent(st.id)} style={styles.deleteButton}>
                          <Trash2 size={16} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {adminSector === 'TEACHERS' && adminTeachers.map((tc) => (
                      <View key={tc.id} style={styles.scheduleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleCourseName}>{tc.name}</Text>
                          <Text style={styles.scheduleFaculty}>{tc.qualifications}</Text>
                          <Text style={styles.noticeAuthor}>Exp: {tc.experience} years | Email: {tc.user?.email}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteTeacher(tc.id)} style={styles.deleteButton}>
                          <Trash2 size={16} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {adminSector === 'COURSES' && adminCourses.map((co) => (
                      <View key={co.id} style={styles.scheduleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleCourseName}>{co.name} ({co.code})</Text>
                          <Text style={styles.scheduleFaculty}>Credits: {co.credits} | Dept: {co.department?.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteCourse(co.id)} style={styles.deleteButton}>
                          <Trash2 size={16} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {adminSector === 'SCHEDULES' && adminSchedules.map((sc) => (
                      <View key={sc.id} style={styles.scheduleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleCourseName}>{sc.course?.name}</Text>
                          <Text style={styles.scheduleFaculty}>Faculty: {sc.teacher?.name} | Room: {sc.room}</Text>
                          <Text style={styles.noticeAuthor}>{sc.dayOfWeek} {sc.startTime} - {sc.endTime}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSchedule(sc.id)} style={styles.deleteButton}>
                          <Trash2 size={16} color="#F43F5E" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* 2. TEACHER OPERATIONS SCREEN */}
          {user.role === 'TEACHER' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subSegmentContainer}>
                {['REGISTER', 'QR_GEN'].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setTeacherSector(sec as any)}
                    style={[styles.subSegmentBtn, teacherSector === sec && styles.subSegmentBtnActive]}
                  >
                    <Text style={[styles.subSegmentText, teacherSector === sec && styles.subSegmentTextActive]}>
                      {sec === 'REGISTER' ? 'Register Check' : 'QR Broadcast'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                {teacherSector === 'REGISTER' && (
                  <View style={{ gap: 12 }}>
                    <Text style={styles.inputLabel}>Select Target Class Course</Text>
                    <View style={styles.pickerSim}>
                      {schedules.map((sched) => (
                        <TouchableOpacity
                          key={sched.courseId}
                          style={[styles.pickerOption, activeMarkCourseId === sched.courseId && styles.pickerOptionActive]}
                          onPress={() => {
                            setActiveMarkCourseId(sched.courseId);
                            loadClassStudents(sched.courseId);
                          }}
                        >
                          <Text style={[styles.pickerOptionText, activeMarkCourseId === sched.courseId && styles.pickerOptionTextActive]}>
                            {sched.course?.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {studentsLoading ? (
                      <ActivityIndicator color="#14B8A6" />
                    ) : classStudents.length > 0 ? (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.sectionTitle}>Check Attendance List</Text>
                        {classStudents.map((stud) => {
                          const isPresent = attendanceRecords[stud.id] === 'PRESENT';
                          return (
                            <View key={stud.id} style={styles.studentAttendanceRow}>
                              <Text style={styles.studentAttendanceName}>{stud.name} ({stud.rollNumber})</Text>
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                  onPress={() => setAttendanceRecords(prev => ({ ...prev, [stud.id]: 'PRESENT' }))}
                                  style={[styles.attCheckbox, isPresent && styles.attCheckboxActive]}
                                >
                                  <Text style={[styles.attCheckboxText, isPresent && { color: '#FFF' }]}>P</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => setAttendanceRecords(prev => ({ ...prev, [stud.id]: 'ABSENT' }))}
                                  style={[styles.attCheckbox, !isPresent && styles.attCheckboxActiveDanger]}
                                >
                                  <Text style={[styles.attCheckboxText, !isPresent && { color: '#FFF' }]}>A</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}

                        <TouchableOpacity
                          onPress={handleSaveAttendance}
                          disabled={submittingAttendance}
                          style={styles.submitNoticeBtn}
                        >
                          {submittingAttendance ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.submitNoticeBtnText}>Save Attendance Register</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>Select a class schedule course to load student list.</Text>
                    )}
                  </View>
                )}

                {teacherSector === 'QR_GEN' && (
                  <View style={{ gap: 16 }}>
                    <Text style={styles.inputLabel}>Select Course to Generate Check-In Token</Text>
                    <View style={styles.pickerSim}>
                      {schedules.map((sched) => (
                        <TouchableOpacity
                          key={sched.courseId}
                          style={[styles.pickerOption, activeQrCourseId === sched.courseId && styles.pickerOptionActive]}
                          onPress={() => setActiveQrCourseId(sched.courseId)}
                        >
                          <Text style={[styles.pickerOptionText, activeQrCourseId === sched.courseId && styles.pickerOptionTextActive]}>
                            {sched.course?.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      onPress={handleGenerateQR}
                      disabled={generatingQr || !activeQrCourseId}
                      style={styles.submitNoticeBtn}
                    >
                      {generatingQr ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.submitNoticeBtnText}>Generate Rotating QR Code</Text>
                      )}
                    </TouchableOpacity>

                    {generatedQrToken ? (
                      <View style={styles.qrDisplayBox}>
                        <QrCode size={180} color="#14B8A6" />
                        <Text style={styles.qrDisplayToken} numberOfLines={2}>{generatedQrToken}</Text>
                        <Text style={styles.qrExpiryWarning}>Expires in 1 minute. Broadcast code to student devices.</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* 3. STUDENT DETAILED LOGS SCREEN */}
          {user.role === 'STUDENT' && (
            <View style={{ flex: 1 }}>
              <View style={styles.subSegmentContainer}>
                {['LOGS', 'PLACEMENTS'].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setStudentSector(sec as any)}
                    style={[styles.subSegmentBtn, studentSector === sec && styles.subSegmentBtnActive]}
                  >
                    <Text style={[styles.subSegmentText, studentSector === sec && styles.subSegmentTextActive]}>
                      {sec === 'LOGS' ? 'Attendance Logs' : 'Corporate Placements'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}>
                {studentSector === 'LOGS' && (
                  <View style={{ gap: 14 }}>
                    <View style={styles.attendanceSummaryBox}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.attSummaryVal}>
                          {attendanceLogs.length > 0
                            ? Math.round((attendanceLogs.filter(a => a.status === 'PRESENT').length / attendanceLogs.length) * 100)
                            : 0}%
                        </Text>
                        <Text style={styles.attSummaryLabel}>Overall Percentage</Text>
                      </View>
                      <View style={styles.attSummaryStats}>
                        <Text style={styles.attSummaryStatText}>Total: {attendanceLogs.length} classes</Text>
                        <Text style={[styles.attSummaryStatText, { color: '#10B981' }]}>Present: {attendanceLogs.filter(a => a.status === 'PRESENT').length}</Text>
                        <Text style={[styles.attSummaryStatText, { color: '#EF4444' }]}>Absent: {attendanceLogs.filter(a => a.status === 'ABSENT').length}</Text>
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>Attendance Logs Timeline</Text>
                    {attendanceLogsLoading ? (
                      <ActivityIndicator color="#14B8A6" />
                    ) : attendanceLogs.length > 0 ? (
                      attendanceLogs.map((log) => (
                        <View key={log.id} style={styles.scheduleItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.scheduleCourseName}>{log.course?.name}</Text>
                            <Text style={styles.scheduleFaculty}>Marked by: {log.markedBy?.name}</Text>
                            <Text style={styles.noticeDate}>{new Date(log.date).toLocaleDateString()} | Method: {log.method}</Text>
                          </View>
                          <View style={[
                            styles.categoryBadge,
                            log.status === 'PRESENT' ? { backgroundColor: 'rgba(16, 185, 129, 0.1)' } : { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          ]}>
                            <Text style={[
                              styles.categoryText,
                              log.status === 'PRESENT' ? { color: '#10B981' } : { color: '#EF4444' }
                            ]}>{log.status}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No attendance records verified.</Text>
                    )}
                  </View>
                )}

                {studentSector === 'PLACEMENTS' && (
                  <View style={{ gap: 14 }}>
                    <Text style={styles.sectionTitle}>Corporate Hiring Drives</Text>
                    {placementsLoading ? (
                      <ActivityIndicator color="#14B8A6" />
                    ) : placements.length > 0 ? (
                      placements.map((drive) => {
                        const hasApplied = drive.applications && drive.applications.length > 0;
                        return (
                          <View key={drive.id} style={styles.noticeCard}>
                            <View style={styles.noticeHeader}>
                              <Text style={styles.asgCourseCode}>{drive.company}</Text>
                              <Text style={styles.asgDeadline}>Deadline: {new Date(drive.deadline).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.noticeTitleText}>{drive.role}</Text>
                            <Text style={styles.noticeContentText}>Salary: {drive.salaryPackage}</Text>
                            <Text style={styles.noticeContentText}>Criteria: {drive.eligibilityCriteria}</Text>
                            <Text style={[styles.noticeContentText, { color: '#CBD5E1' }]}>Requirements: {drive.requirements}</Text>

                            <View style={{ marginTop: 14 }}>
                              {hasApplied ? (
                                <View style={styles.asgStatusDone}>
                                  <CheckCircle size={14} color="#10B981" />
                                  <Text style={styles.asgStatusDoneText}>Applied (Status: {drive.applications[0].status})</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => {
                                    setSelectedPlacementId(drive.id);
                                    setPlacementModalVisible(true);
                                  }}
                                  style={styles.asgSubmitBtn}
                                >
                                  <Text style={styles.asgSubmitBtnText}>Apply Now</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.emptyText}>No recruitment drives scheduled currently.</Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* 4. PARENT MONITORING SCREEN */}
          {user.role === 'PARENT' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.inputLabel}>Select Registered Child</Text>
              <View style={styles.pickerSim}>
                {user.parentProfile?.students?.map((child: any) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.pickerOption, selectedChildId === child.id && styles.pickerOptionActive]}
                    onPress={() => {
                      setSelectedChildId(child.id);
                      loadChildData(child.id);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, selectedChildId === child.id && styles.pickerOptionTextActive]}>
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {childLoading ? (
                <ActivityIndicator color="#14B8A6" style={{ marginTop: 24 }} />
              ) : (
                <View style={{ gap: 20, marginTop: 16 }}>
                  {/* Child attendance summary */}
                  <View style={styles.attendanceSummaryBox}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.attSummaryVal}>
                        {childAttendance.length > 0
                          ? Math.round((childAttendance.filter(a => a.status === 'PRESENT').length / childAttendance.length) * 100)
                          : 0}%
                      </Text>
                      <Text style={styles.attSummaryLabel}>Child Attendance</Text>
                    </View>
                    <View style={styles.attSummaryStats}>
                      <Text style={styles.attSummaryStatText}>Verified Slots: {childAttendance.length}</Text>
                      <Text style={[styles.attSummaryStatText, { color: '#10B981' }]}>Present: {childAttendance.filter(a => a.status === 'PRESENT').length}</Text>
                      <Text style={[styles.attSummaryStatText, { color: '#EF4444' }]}>Absent: {childAttendance.filter(a => a.status === 'ABSENT').length}</Text>
                    </View>
                  </View>

                  {/* Child Billing Invoices */}
                  <Text style={styles.sectionTitle}>Child Fee Invoices</Text>
                  {childFees.length > 0 ? (
                    childFees.map((inv) => (
                      <View key={inv.id} style={styles.scheduleItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleCourseName}>Academic Invoice</Text>
                          <Text style={styles.scheduleFaculty}>Amount: ₹{inv.amount.toLocaleString('en-IN')}</Text>
                          <Text style={styles.noticeDate}>Due: {new Date(inv.dueDate).toLocaleDateString()}</Text>
                        </View>
                        {inv.status === 'PENDING' ? (
                          <TouchableOpacity
                            onPress={() => handlePayFee(inv.id, selectedChildId)}
                            style={styles.gradeRosterBtn}
                          >
                            <Text style={styles.gradeRosterBtnText}>Pay Now</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.categoryBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Text style={[styles.categoryText, { color: '#10B981' }]}>PAID</Text>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No invoices loaded.</Text>
                  )}

                  {/* Child weekly timetables */}
                  <Text style={styles.sectionTitle}>Child Timetable Schedule</Text>
                  <View style={styles.scheduleList}>
                    {childSchedules.length > 0 ? (
                      childSchedules.map((sc, idx) => (
                        <View key={sc.id || idx} style={styles.scheduleItem}>
                          <View style={styles.scheduleTimeBadge}>
                            <Text style={styles.scheduleTimeText}>{sc.startTime}</Text>
                            <Text style={styles.scheduleTimeSub}>Room {sc.room}</Text>
                          </View>
                          <View style={styles.scheduleDetails}>
                            <Text style={styles.scheduleCourseName}>{sc.course?.name}</Text>
                            <Text style={styles.scheduleFaculty}>{sc.teacher?.name}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No active courses mapped.</Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === 'TASKS' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Assignments Portal</Text>
              {user.role === 'TEACHER' && (
                <TouchableOpacity onPress={() => setAssignmentFormVisible(true)} style={styles.refreshButton}>
                  <Text style={styles.refreshButtonText}>+ New Assignment</Text>
                </TouchableOpacity>
              )}
            </View>

            {assignmentsLoading ? (
              <ActivityIndicator color="#14B8A6" style={{ marginVertical: 30 }} />
            ) : assignments.length > 0 ? (
              assignments.map((asg) => {
                const isStudent = user.role === 'STUDENT';
                const submission = isStudent && asg.submissions && asg.submissions[0];
                return (
                  <TouchableOpacity
                    key={asg.id}
                    onPress={() => {
                      setActiveAssignment(asg);
                      if (user.role === 'TEACHER' || user.role === 'ADMIN') {
                        fetchSubmissions(asg.id);
                      }
                    }}
                    style={[
                      styles.noticeCard,
                      { marginBottom: 12 },
                      activeAssignment?.id === asg.id && { borderColor: '#14B8A6', borderStyle: 'solid' }
                    ]}
                  >
                    <View style={styles.noticeHeader}>
                      <Text style={styles.asgCourseCode}>{asg.course?.code || 'Task'}</Text>
                      <Text style={styles.asgDeadline}>Due: {new Date(asg.deadline).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.noticeTitleText}>{asg.title}</Text>
                    <Text style={styles.noticeContentText}>{asg.description}</Text>

                    {isStudent ? (
                      <View style={styles.asgStatusBlock}>
                        {submission ? (
                          <View style={styles.asgStatusDone}>
                            <CheckCircle size={14} color="#10B981" />
                            <Text style={styles.asgStatusDoneText}>Submitted</Text>
                            {submission.grade && (
                              <Text style={styles.asgGradeBadge}>Grade: {submission.grade}</Text>
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setActiveAssignment(asg);
                              setSubmissionModalVisible(true);
                            }}
                            style={styles.asgSubmitBtn}
                          >
                            <Text style={styles.asgSubmitBtnText}>Submit Homework</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.asgSubCountText}>Tap to view student rosters</Text>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No homework assignments registered.</Text>
            )}

            {/* Submissions list for Teachers/Admins */}
            {(user.role === 'TEACHER' || user.role === 'ADMIN') && activeAssignment && (
              <View style={styles.teacherRosterBlock}>
                <Text style={styles.sectionTitle}>Submissions: {activeAssignment.title}</Text>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <View key={sub.id} style={styles.scheduleItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scheduleCourseName}>{sub.student?.name}</Text>
                        <Text style={styles.scheduleFaculty}>Roll: {sub.student?.rollNumber}</Text>
                        <Text style={styles.subFilePathText} numberOfLines={1}>File: {sub.filePath}</Text>
                        {sub.grade ? (
                          <Text style={styles.gradedInfoText}>Grade: {sub.grade} - {sub.feedback}</Text>
                        ) : (
                          <Text style={styles.pendingGradeText}>Pending Grading</Text>
                        )}
                      </View>
                      {user.role === 'TEACHER' && !sub.grade && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedSubmission(sub);
                            setGradingModalVisible(true);
                          }}
                          style={styles.gradeRosterBtn}
                        >
                          <Text style={styles.gradeRosterBtnText}>Grade</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No submissions received yet.</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {activeTab === 'CHAT_AI' && (
        <View style={{ flex: 1 }}>
          <View style={styles.subSegmentContainer}>
            {['CHANNELS', 'GEMINI'].map((sec) => (
              <TouchableOpacity
                key={sec}
                onPress={() => setChatSector(sec as any)}
                style={[styles.subSegmentBtn, chatSector === sec && styles.subSegmentBtnActive]}
              >
                <Text style={[styles.subSegmentText, chatSector === sec && styles.subSegmentTextActive]}>
                  {sec === 'CHANNELS' ? 'Peer Discussions' : 'AI Campus Assistant'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Group discussion view */}
          {chatSector === 'CHANNELS' && (
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <View style={styles.groupsSidebar}>
                <Text style={styles.sidebarTitle}>Channels</Text>
                {groupsLoading ? (
                  <ActivityIndicator color="#14B8A6" />
                ) : (
                  <ScrollView>
                    {groups.map((g) => (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => selectGroup(g)}
                        style={[styles.sidebarGroupItem, activeGroup?.id === g.id && styles.sidebarGroupItemActive]}
                      >
                        <MessageSquare size={16} color={activeGroup?.id === g.id ? '#14B8A6' : '#94A3B8'} />
                        <Text style={[styles.sidebarGroupText, activeGroup?.id === g.id && styles.sidebarGroupTextActive]} numberOfLines={1}>
                          {g.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={{ flex: 1.7, backgroundColor: '#060A13' }}>
                {activeGroup ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatTitleText}>{activeGroup.name}</Text>
                      <Text style={styles.chatSubtitleText}>{activeGroup.description || 'Topic discussions'}</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.chatScroll}>
                      {messagesLoading ? (
                        <ActivityIndicator color="#14B8A6" />
                      ) : messages.length > 0 ? (
                        messages.map((msg) => {
                          const isMe = msg.senderId === user.id;
                          return (
                            <View key={msg.id} style={[styles.messageBubbleContainer, isMe && { justifyContent: 'flex-end' }]}>
                              <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                                {!isMe && (
                                  <Text style={styles.messageAuthor}>{msg.sender?.email.split('@')[0]}</Text>
                                )}
                                <Text style={[styles.messageTextContent, isMe && { color: '#FFF' }]}>{msg.content}</Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.emptyText}>No messages inside this channel.</Text>
                      )}
                    </ScrollView>

                    <View style={styles.chatInputRow}>
                      <TextInput
                        value={newMessageText}
                        onChangeText={setNewMessageText}
                        style={styles.chatTextInput}
                        placeholder="Type message..."
                        placeholderTextColor="#64748B"
                      />
                      <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={sendingMessage}
                        style={styles.chatSendBtn}
                      >
                        <Send size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyCenter}>
                    <MessageSquare size={48} color="#64748B" />
                    <Text style={styles.emptyText}>Select a discussion group</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* AI GEMINI Chatbot */}
          {chatSector === 'GEMINI' && (
            <View style={{ flex: 1, backgroundColor: '#090D1A' }}>
              <View style={styles.chatHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Bot size={22} color="#14B8A6" />
                  <Text style={styles.chatTitleText}>CampusFlow Gemini Helper</Text>
                </View>
                <Text style={styles.chatSubtitleText}>POWERED BY GEMINI ENGINE</Text>
              </View>

              <ScrollView contentContainerStyle={styles.chatScroll}>
                {aiMessages.map((msg, i) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <View key={i} style={[styles.messageBubbleContainer, isUser && { justifyContent: 'flex-end' }]}>
                      <View style={[styles.messageBubble, isUser ? styles.messageBubbleMe : styles.messageBubbleOther, { maxWidth: '85%' }]}>
                        <Text style={[styles.messageTextContent, isUser && { color: '#FFF' }]}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                })}
                {aiLoading && (
                  <View style={styles.messageBubbleContainer}>
                    <View style={styles.messageBubbleOther}>
                      <ActivityIndicator size="small" color="#14B8A6" />
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.presetRow}>
                <TouchableOpacity onPress={() => handleSendAiMessage('Recommend study timetable')} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Timetable</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSendAiMessage('What are Google drive eligibility details?')} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Eligibility</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSendAiMessage('Summarize my grade targets')} style={styles.presetChip}>
                  <Text style={styles.presetChipText}>Targets</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chatInputRow}>
                <TextInput
                  value={aiInput}
                  onChangeText={setAiInput}
                  style={styles.chatTextInput}
                  placeholder="Ask assistant..."
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity
                  onPress={() => handleSendAiMessage()}
                  disabled={aiLoading}
                  style={styles.chatSendBtn}
                >
                  <Send size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ADMIN ADD STUDENT FORM MODAL */}
      <Modal visible={studentFormVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register New Student</Text>
                <TouchableOpacity onPress={() => setStudentFormVisible(false)} style={styles.closeButton}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput value={studentName} onChangeText={setStudentName} style={styles.modalInput} placeholder="e.g. John Doe" placeholderTextColor="#64748B" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput value={studentEmail} onChangeText={setStudentEmail} style={styles.modalInput} placeholder="student.name@university.edu" placeholderTextColor="#64748B" autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Roll Number</Text>
                  <TextInput value={studentRoll} onChangeText={setStudentRoll} style={styles.modalInput} placeholder="e.g. CSE2026-045" placeholderTextColor="#64748B" autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Department ID</Text>
                  <View style={styles.pickerSim}>
                    {departments.map((dept) => (
                      <TouchableOpacity
                        key={dept.id}
                        style={[styles.pickerOption, studentDeptId === dept.id && styles.pickerOptionActive]}
                        onPress={() => setStudentDeptId(dept.id)}
                      >
                        <Text style={[styles.pickerOptionText, studentDeptId === dept.id && styles.pickerOptionTextActive]}>{dept.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Current Semester</Text>
                  <View style={styles.pickerSim}>
                    {['1', '2', '3', '4'].map((sem) => (
                      <TouchableOpacity
                        key={sem}
                        style={[styles.pickerOption, studentSemester === sem && styles.pickerOptionActive]}
                        onPress={() => setStudentSemester(sem)}
                      >
                        <Text style={[styles.pickerOptionText, studentSemester === sem && styles.pickerOptionTextActive]}>{sem}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Parent Full Name</Text>
                  <TextInput value={studentParentName} onChangeText={setStudentParentName} style={styles.modalInput} placeholder="Parent name" placeholderTextColor="#64748B" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Parent Email</Text>
                  <TextInput value={studentParentEmail} onChangeText={setStudentParentEmail} style={styles.modalInput} placeholder="parent@gmail.com" placeholderTextColor="#64748B" autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Parent Phone</Text>
                  <TextInput value={studentParentPhone} onChangeText={setStudentParentPhone} style={styles.modalInput} placeholder="Parent phone" placeholderTextColor="#64748B" />
                </View>

                <TouchableOpacity onPress={handleRegisterStudent} style={styles.submitNoticeBtn}>
                  <Text style={styles.submitNoticeBtnText}>Create Student Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ADMIN HIRE TEACHER FORM MODAL */}
      <Modal visible={teacherFormVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Hire Faculty Teacher</Text>
                <TouchableOpacity onPress={() => setTeacherFormVisible(false)} style={styles.closeButton}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Teacher Name</Text>
                  <TextInput value={teacherName} onChangeText={setTeacherName} style={styles.modalInput} placeholder="Dr. Sarah Miller" placeholderTextColor="#64748B" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Teacher Email</Text>
                  <TextInput value={teacherEmail} onChangeText={setTeacherEmail} style={styles.modalInput} placeholder="teacher@university.edu" placeholderTextColor="#64748B" autoCapitalize="none" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Qualifications</Text>
                  <TextInput value={teacherQuals} onChangeText={setTeacherQuals} style={styles.modalInput} placeholder="Ph.D Systems" placeholderTextColor="#64748B" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Years Experience</Text>
                  <TextInput value={teacherExp} onChangeText={setTeacherExp} style={styles.modalInput} placeholder="e.g. 5" keyboardType="numeric" placeholderTextColor="#64748B" />
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Department ID</Text>
                  <View style={styles.pickerSim}>
                    {departments.map((dept) => (
                      <TouchableOpacity
                        key={dept.id}
                        style={[styles.pickerOption, teacherDeptId === dept.id && styles.pickerOptionActive]}
                        onPress={() => setTeacherDeptId(dept.id)}
                      >
                        <Text style={[styles.pickerOptionText, teacherDeptId === dept.id && styles.pickerOptionTextActive]}>{dept.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity onPress={handleHireTeacher} style={styles.submitNoticeBtn}>
                  <Text style={styles.submitNoticeBtnText}>Register Teacher</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ADMIN CREATE COURSE MODAL */}
      <Modal visible={courseFormVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Course Subject</Text>
              <TouchableOpacity onPress={() => setCourseFormVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Course Name</Text>
                <TextInput value={courseName} onChangeText={setCourseName} style={styles.modalInput} placeholder="e.g. Compiler Design" placeholderTextColor="#64748B" />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Course Code</Text>
                <TextInput value={courseCode} onChangeText={setCourseCode} style={styles.modalInput} placeholder="e.g. CSE-305" placeholderTextColor="#64748B" autoCapitalize="none" />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Credits</Text>
                <View style={styles.pickerSim}>
                  {['1', '2', '3', '4'].map((cred) => (
                    <TouchableOpacity
                      key={cred}
                      style={[styles.pickerOption, courseCredits === cred && styles.pickerOptionActive]}
                      onPress={() => setCourseCredits(cred)}
                    >
                      <Text style={[styles.pickerOptionText, courseCredits === cred && styles.pickerOptionTextActive]}>{cred}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Department ID</Text>
                <View style={styles.pickerSim}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[styles.pickerOption, courseDeptId === dept.id && styles.pickerOptionActive]}
                      onPress={() => setCourseDeptId(dept.id)}
                    >
                      <Text style={[styles.pickerOptionText, courseDeptId === dept.id && styles.pickerOptionTextActive]}>{dept.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity onPress={handleCreateCourse} style={styles.submitNoticeBtn}>
                <Text style={styles.submitNoticeBtnText}>Create Subject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADMIN ADD TIMETABLE SCHEDULE SLOT MODAL */}
      <Modal visible={scheduleFormVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Map Timetable Schedule</Text>
                <TouchableOpacity onPress={() => setScheduleFormVisible(false)} style={styles.closeButton}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Select Course</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerSim}>
                    {courses.map((co) => (
                      <TouchableOpacity
                        key={co.id}
                        style={[styles.pickerOption, schedCourseId === co.id && styles.pickerOptionActive, { minWidth: 100 }]}
                        onPress={() => setSchedCourseId(co.id)}
                      >
                        <Text style={[styles.pickerOptionText, schedCourseId === co.id && styles.pickerOptionTextActive]}>{co.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Assign Teacher</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerSim}>
                    {adminTeachers.map((tc) => (
                      <TouchableOpacity
                        key={tc.id}
                        style={[styles.pickerOption, schedTeacherId === tc.id && styles.pickerOptionActive, { minWidth: 120 }]}
                        onPress={() => setSchedTeacherId(tc.id)}
                      >
                        <Text style={[styles.pickerOptionText, schedTeacherId === tc.id && styles.pickerOptionTextActive]}>{tc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Day of Week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerSim}>
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.pickerOption, schedDay === day && styles.pickerOptionActive, { minWidth: 90 }]}
                        onPress={() => setSchedDay(day)}
                      >
                        <Text style={[styles.pickerOptionText, schedDay === day && styles.pickerOptionTextActive]}>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Time Slots (Start - End)</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput value={schedStart} onChangeText={setSchedStart} style={[styles.modalInput, { flex: 1 }]} placeholder="09:00" placeholderTextColor="#64748B" />
                    <TextInput value={schedEnd} onChangeText={setSchedEnd} style={[styles.modalInput, { flex: 1 }]} placeholder="10:30" placeholderTextColor="#64748B" />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Room Number</Text>
                  <TextInput value={schedRoom} onChangeText={setSchedRoom} style={styles.modalInput} placeholder="e.g. LH-302" placeholderTextColor="#64748B" />
                </View>

                <TouchableOpacity onPress={handleCreateSchedule} style={styles.submitNoticeBtn}>
                  <Text style={styles.submitNoticeBtnText}>Create Timetable Slot</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* PUBLISH NOTICE FORM MODAL */}
      <Modal visible={publishModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Publish Announcement</Text>
              <TouchableOpacity onPress={() => setPublishModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Announcement Category</Text>
                <View style={styles.pickerSim}>
                  {['GENERAL', 'EXAM', 'HOLIDAY', 'PLACEMENT'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pickerOption, newNotice.category === cat && styles.pickerOptionActive]}
                      onPress={() => setNewNotice(prev => ({ ...prev, category: cat }))}
                    >
                      <Text style={[styles.pickerOptionText, newNotice.category === cat && styles.pickerOptionTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Notice Title</Text>
                <TextInput value={newNotice.title} onChangeText={(val) => setNewNotice(prev => ({ ...prev, title: val }))} style={styles.modalInput} placeholder="Title..." placeholderTextColor="#64748B" />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Notice Content</Text>
                <TextInput value={newNotice.content} onChangeText={(val) => setNewNotice(prev => ({ ...prev, content: val }))} style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Body..." placeholderTextColor="#64748B" multiline />
              </View>

              <TouchableOpacity onPress={handlePublishNotice} disabled={noticePublishing} style={styles.submitNoticeBtn}>
                {noticePublishing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Publish Notice</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TEACHER CREATE ASSIGNMENT MODAL */}
      <Modal visible={assignmentFormVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Assignment Task</Text>
              <TouchableOpacity onPress={() => setAssignmentFormVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Select Course</Text>
                <View style={styles.pickerSim}>
                  {courses.map((co) => (
                    <TouchableOpacity
                      key={co.id}
                      style={[styles.pickerOption, newAssignment.courseId === co.id && styles.pickerOptionActive]}
                      onPress={() => setNewAssignment(prev => ({ ...prev, courseId: co.id }))}
                    >
                      <Text style={[styles.pickerOptionText, newAssignment.courseId === co.id && styles.pickerOptionTextActive]}>{co.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Assignment Title</Text>
                <TextInput value={newAssignment.title} onChangeText={(val) => setNewAssignment(prev => ({ ...prev, title: val }))} style={styles.modalInput} placeholder="e.g. Normalization fd..." placeholderTextColor="#64748B" />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Task Description</Text>
                <TextInput value={newAssignment.description} onChangeText={(val) => setNewAssignment(prev => ({ ...prev, description: val }))} style={[styles.modalInput, { height: 70 }]} placeholder="Instructions..." placeholderTextColor="#64748B" multiline />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Deadline Date</Text>
                <TextInput value={newAssignment.deadline} onChangeText={(val) => setNewAssignment(prev => ({ ...prev, deadline: val }))} style={styles.modalInput} placeholder="YYYY-MM-DD" placeholderTextColor="#64748B" />
              </View>

              <TouchableOpacity onPress={handlePostAssignment} disabled={postingAssignment} style={styles.submitNoticeBtn}>
                {postingAssignment ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Post Assignment</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT SUBMIT ASSIGNMENT MODAL */}
      <Modal visible={submissionModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Assignment File</Text>
              <TouchableOpacity onPress={() => setSubmissionModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Cloud Secure URL File Path</Text>
                <TextInput value={submitFilePath} onChangeText={setSubmitFilePath} style={styles.modalInput} placeholder="https://res.cloudinary.com/..." placeholderTextColor="#64748B" autoCapitalize="none" />
              </View>

              <TouchableOpacity onPress={handleAssignmentSubmit} disabled={submittingAssignment} style={styles.submitNoticeBtn}>
                {submittingAssignment ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Upload & Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TEACHER GRADING SUBMISSION MODAL */}
      <Modal visible={gradingModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grade Submission</Text>
              <TouchableOpacity onPress={() => setGradingModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Grade Point / Rating</Text>
                <TextInput value={gradeInput} onChangeText={setGradeInput} style={styles.modalInput} placeholder="e.g. A+, B-, 9.5" placeholderTextColor="#64748B" />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Feedback Comments</Text>
                <TextInput value={feedbackInput} onChangeText={setFeedbackInput} style={styles.modalInput} placeholder="Excellent logic flow..." placeholderTextColor="#64748B" />
              </View>

              <TouchableOpacity onPress={handleTeacherGrade} disabled={submittingGrade} style={styles.submitNoticeBtn}>
                {submittingGrade ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Submit Grade</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT QR MODAL */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code Check-In</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.scanSimBlock}>
                <QrCode size={60} color="#14B8A6" />
                <Text style={styles.scanSimText}>Input the generated QR session token from the teacher's broadcast screen below to verify presence.</Text>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Verification Token</Text>
                <TextInput value={qrTokenInput} onChangeText={setQrTokenInput} style={styles.modalInput} placeholder="Paste token..." placeholderTextColor="#64748B" autoCapitalize="none" />
              </View>

              <TouchableOpacity onPress={handleQRCheckIn} disabled={qrScanning} style={styles.submitNoticeBtn}>
                {qrScanning ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Verify Attendance</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT PLACEMENT CV MODAL */}
      <Modal visible={placementModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit CV Application</Text>
              <TouchableOpacity onPress={() => setPlacementModalVisible(false)} style={styles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Resume Cloud PDF Link</Text>
                <TextInput value={resumeUrlInput} onChangeText={setResumeUrlInput} style={styles.modalInput} placeholder="https://res.cloudinary.com/..." placeholderTextColor="#64748B" autoCapitalize="none" />
              </View>

              <TouchableOpacity onPress={handleApplyPlacement} disabled={submittingPlacementApp} style={styles.submitNoticeBtn}>
                {submittingPlacementApp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitNoticeBtnText}>Submit Resume</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loginScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  glassForm: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    height: '100%',
  },
  signInButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 12,
  },
  mockButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  mockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  mockButtonText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  apiLabelContainer: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  apiLabelText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#090D1A',
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 14,
  },
  welcomeText: {
    fontSize: 11,
    color: '#64748B',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  roleBadgeText: {
    color: '#14B8A6',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#14B8A6',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    marginTop: 16,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  quickDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  financeBanner: {
    backgroundColor: 'rgba(67, 56, 202, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(67, 56, 202, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeLabel: {
    fontSize: 10,
    color: '#C7D2FE',
  },
  financeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
  },
  scheduleTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTimeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scheduleTimeSub: {
    color: '#64748B',
    fontSize: 8,
    marginTop: 2,
  },
  scheduleDetails: {
    marginLeft: 14,
    flex: 1,
  },
  scheduleCourseName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scheduleFaculty: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#14B8A6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noticesFeed: {
    gap: 16,
  },
  noticeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    borderRadius: 8,
  },
  noticeTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  noticeContentText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 16,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  noticeAuthor: {
    fontSize: 9,
    color: '#64748B',
  },
  noticeDate: {
    fontSize: 9,
    color: '#64748B',
  },
  subSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    margin: 12,
    borderRadius: 14,
    padding: 4,
  },
  subSegmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  subSegmentBtnActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  subSegmentText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  subSegmentTextActive: {
    color: '#14B8A6',
    fontWeight: 'bold',
  },
  adminStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  statMiniVal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statMiniLabel: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  studentAttendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  studentAttendanceName: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  attCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attCheckboxActive: {
    backgroundColor: '#10B981',
  },
  attCheckboxActiveDanger: {
    backgroundColor: '#EF4444',
  },
  attCheckboxText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qrDisplayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 16,
  },
  qrDisplayToken: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },
  qrExpiryWarning: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
  },
  attendanceSummaryBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  attSummaryVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14B8A6',
  },
  attSummaryLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  attSummaryStats: {
    gap: 4,
  },
  attSummaryStatText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  asgCourseCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  asgDeadline: {
    fontSize: 9,
    color: '#F43F5E',
    fontWeight: '600',
  },
  asgStatusBlock: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  asgStatusDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  asgStatusDoneText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  asgGradeBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  asgSubmitBtn: {
    backgroundColor: '#14B8A6',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  asgSubmitBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  asgSubCountText: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'right',
  },
  teacherRosterBlock: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  subFilePathText: {
    fontSize: 10,
    color: '#38BDF8',
    marginTop: 4,
  },
  gradedInfoText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  pendingGradeText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  gradeRosterBtn: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderWidth: 1,
    borderColor: '#14B8A6',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  gradeRosterBtnText: {
    color: '#14B8A6',
    fontSize: 11,
    fontWeight: 'bold',
  },
  groupsSidebar: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
  },
  sidebarTitle: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sidebarGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarGroupItemActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  sidebarGroupText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  sidebarGroupTextActive: {
    color: '#14B8A6',
    fontWeight: 'bold',
  },
  chatHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#090D1A',
  },
  chatTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  chatSubtitleText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  chatScroll: {
    padding: 14,
    gap: 12,
    flexGrow: 1,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  messageBubbleMe: {
    backgroundColor: '#4338CA',
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 2,
  },
  messageAuthor: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#14B8A6',
    marginBottom: 2,
  },
  messageTextContent: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#0A0E1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#05070E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    height: 40,
    color: '#FFF',
    paddingHorizontal: 12,
    fontSize: 12,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  presetRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0A0E1A',
    gap: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    gap: 16,
  },
  pickerSim: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pickerOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 10,
  },
  pickerOptionActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  pickerOptionText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#FFF',
  },
  modalInput: {
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13,
  },
  submitNoticeBtn: {
    backgroundColor: '#14B8A6',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitNoticeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scanSimBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.1)',
    marginBottom: 8,
  },
  scanSimText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    lineHeight: 16,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
    marginTop: -16,
    textAlign: 'center',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownTriggerText: {
    color: '#FFF',
    fontSize: 14,
  },
  dropdownMenu: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  dropdownItemText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  dropdownItemTextActive: {
    color: '#14B8A6',
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#14B8A6',
    fontSize: 11,
    fontWeight: '600',
  },
  dashboardHeroCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  statsCardGrid: {
    gap: 12,
    marginBottom: 20,
  },
  statDoubleCard: {
    flexDirection: 'row',
    gap: 12,
  },
  statItemCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  statCardSubtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
  },
  chartContainerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  chartCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  chartContentWrapper: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'stretch',
  },
  chartYAxis: {
    width: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  chartYLabel: {
    color: '#64748B',
    fontSize: 9,
  },
  chartBarsArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 10,
    paddingBottom: 4,
  },
  chartBarCol: {
    alignItems: 'center',
    width: 60,
  },
  chartBarTrack: {
    height: 110,
    width: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#14B8A6',
    borderRadius: 6,
  },
  chartBarLabel: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 6,
  },
  upcomingSchedulesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  upcomingTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  upcomingItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  upcomingBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  upcomingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  upcomingBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  upcomingCourseName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingTimeText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  timetableTable: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableBodyCell: {
    color: '#CBD5E1',
    fontSize: 9,
  }
});
