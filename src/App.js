import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/SideNav';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BulkUserCreation from './pages/BulkUserCreation';
import ActiveFeedback from './pages/ActiveFeedback';
import FeedbackForm from './pages/FeedbackForm';
import FeedbackHistory from './pages/FeedbackHistory';
import CreateFeedback from './pages/CreateFeedback';
import FacultyAnalyticsPage from './pages/FacultyAnalyticsPage';
import FacultyResponses from './pages/FacultyResponses';
import { useAuth } from './context/AuthContext';
import { Box } from '@mui/material';

function Protected({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {user && <SideNav />}
      <Box sx={{ 
        flexGrow: 1,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/student" element={<Protected allowedRoles={["student"]}><StudentDashboard /></Protected>} />
          <Route path="/student/pending" element={<Protected allowedRoles={["student"]}><ActiveFeedback /></Protected>} />
          <Route path="/student/impact" element={<Protected allowedRoles={["student"]}><StudentDashboard view="impact" /></Protected>} />
          <Route path="/student/courses" element={<Protected allowedRoles={["student"]}><StudentDashboard view="courses" /></Protected>} />
          <Route path="/student/active" element={<Protected allowedRoles={["student"]}><ActiveFeedback /></Protected>} />
          <Route path="/student/feedback/:id" element={<Protected allowedRoles={["student"]}><FeedbackForm /></Protected>} />
          <Route path="/student/history" element={<Protected allowedRoles={["student"]}><FeedbackHistory /></Protected>} />

          <Route path="/faculty" element={<Protected allowedRoles={["faculty"]}><FacultyDashboard /></Protected>} />
          <Route path="/faculty/courses" element={<Protected allowedRoles={["faculty"]}><FacultyDashboard view="courses" /></Protected>} />
          <Route path="/faculty/create" element={<Protected allowedRoles={["faculty"]}><CreateFeedback /></Protected>} />
          <Route path="/faculty/analytics" element={<Protected allowedRoles={["faculty"]}><FacultyAnalyticsPage /></Protected>} />
          <Route path="/faculty/responses/:id" element={<Protected allowedRoles={["faculty","department_admin","system_admin"]}><FacultyResponses /></Protected>} />

          <Route path="/department" element={<Protected allowedRoles={["department_admin"]}><DepartmentDashboard /></Protected>} />
          <Route path="/department/courses" element={<Protected allowedRoles={["department_admin"]}><DepartmentDashboard view="courses" /></Protected>} />
          <Route path="/department/faculty" element={<Protected allowedRoles={["department_admin"]}><DepartmentDashboard view="faculty" /></Protected>} />

          <Route path="/admin" element={<Protected allowedRoles={["system_admin"]}><AdminDashboard /></Protected>} />
          <Route path="/admin/overview" element={<Protected allowedRoles={["system_admin"]}><AdminDashboard view="overview" /></Protected>} />
          <Route path="/admin/users" element={<Protected allowedRoles={["system_admin"]}><AdminDashboard view="users" /></Protected>} />
          <Route path="/admin/bulk-create" element={<Protected allowedRoles={["system_admin"]}><BulkUserCreation /></Protected>} />
          <Route path="/admin/settings" element={<Protected allowedRoles={["system_admin"]}><AdminDashboard view="settings" /></Protected>} />

          <Route path="*" element={<div style={{ padding: 20 }}>Page not found</div>} />
        </Routes>
      </Box>
    </Box>
  );
}