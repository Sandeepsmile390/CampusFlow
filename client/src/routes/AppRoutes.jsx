import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
      <span className="text-sm text-slate-500 font-medium">Loading panel...</span>
    </div>
  );
}

// Lazy loaded page components
const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const StudentManagement = lazy(() => import('../pages/admin/StudentManagement'));
const TeacherManagement = lazy(() => import('../pages/admin/TeacherManagement'));
const CourseManagement = lazy(() => import('../pages/admin/CourseManagement'));
const NoticeBoard = lazy(() => import('../pages/admin/NoticeBoard'));
const Reports = lazy(() => import('../pages/admin/Reports'));

const TeacherDashboard = lazy(() => import('../pages/teacher/Dashboard'));
const AttendanceMark = lazy(() => import('../pages/teacher/AttendanceMark'));
const AttendanceQR = lazy(() => import('../pages/teacher/AttendanceQR'));
const TeacherAssignments = lazy(() => import('../pages/teacher/Assignments'));
const TeacherMarks = lazy(() => import('../pages/teacher/Marks'));

const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const StudentTimetable = lazy(() => import('../pages/student/Timetable'));
const StudentAttendance = lazy(() => import('../pages/student/Attendance'));
const StudentAssignments = lazy(() => import('../pages/student/Assignments'));
const StudentFees = lazy(() => import('../pages/student/Fees'));
const StudentPlacements = lazy(() => import('../pages/student/Placements'));

const ParentDashboard = lazy(() => import('../pages/parent/Dashboard'));
const Discussions = lazy(() => import('../pages/shared/Discussions'));

// Route guards
function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
}

function GuestGuard({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) {
    // Redirect to respective dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'PARENT') return <Navigate to="/parent/dashboard" replace />;
  }

  return children;
}

function RoleGuard({ children, allowedRoles }) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to safety dashboard based on user role
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user?.role === 'PARENT') return <Navigate to="/parent/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        
        {/* Guest Routes */}
        <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
        <Route path="/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
        <Route path="/reset-password" element={<GuestGuard><ResetPassword /></GuestGuard>} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="students" element={<StudentManagement />} />
                  <Route path="teachers" element={<TeacherManagement />} />
                  <Route path="courses" element={<CourseManagement />} />
                  <Route path="notices" element={<NoticeBoard />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="discussions" element={<Discussions />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleGuard>
          </AuthGuard>
        } />

        {/* Teacher Routes */}
        <Route path="/teacher/*" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['TEACHER']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="attendance" element={<AttendanceMark />} />
                  <Route path="qr" element={<AttendanceQR />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="marks" element={<TeacherMarks />} />
                  <Route path="discussions" element={<Discussions />} />
                  <Route path="notices" element={<NoticeBoard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleGuard>
          </AuthGuard>
        } />

        {/* Student Routes */}
        <Route path="/student/*" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="timetable" element={<StudentTimetable />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="fees" element={<StudentFees />} />
                  <Route path="placements" element={<StudentPlacements />} />
                  <Route path="discussions" element={<Discussions />} />
                  <Route path="notices" element={<NoticeBoard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleGuard>
          </AuthGuard>
        } />

        {/* Parent Routes */}
        <Route path="/parent/*" element={
          <AuthGuard>
            <RoleGuard allowedRoles={['PARENT']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<ParentDashboard />} />
                  <Route path="discussions" element={<Discussions />} />
                  <Route path="notices" element={<NoticeBoard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </RoleGuard>
          </AuthGuard>
        } />

        {/* General Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Suspense>
  );
}
