import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  LinearProgress, 
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { AddCircle, Assessment, TrendingUp, School, Assignment, RateReview, Edit, Delete, BarChart } from '@mui/icons-material';
import { courseService, feedbackService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FacultyDashboard({ view: propView = 'default' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlView = searchParams.get('view') || 'default';
  const currentView = propView !== 'default' ? propView : urlView;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [feedbackForms, setFeedbackForms] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, form: null });
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalForms: 0,
    totalResponses: 0,
    averageRating: 0
  });

  useEffect(() => {
    loadFacultyData();
  }, []);

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch faculty's courses directly from User model (Excel data)
      const facultyInfo = await userService.getFacultyCourseInfo(user._id);
      console.log('Faculty Course Info from Excel:', facultyInfo);
      
      // Transform courses data
      const transformedCourses = (facultyInfo.courses || []).map(course => ({
        courseName: course.courseName,
        courseCode: course.courseCode || 'N/A',
        sections: course.sections || [],
        department: facultyInfo.department,
        totalSections: course.sections?.length || 0
      }));

      setCourses(transformedCourses);

      // Fetch feedback forms created by this faculty
      // Backend automatically filters by facultyId for faculty role
      const formsData = await feedbackService.getFeedbackForms();
      console.log('Feedback Forms:', formsData);
      setFeedbackForms(formsData || []);

      // Calculate statistics
      let totalResponses = 0;
      let totalRatings = 0;
      let ratingCount = 0;

      if (formsData && formsData.length > 0) {
        for (const form of formsData) {
          try {
            const analytics = await feedbackService.getFeedbackAnalytics(form._id);
            if (analytics) {
              totalResponses += analytics.totalResponses || 0;

              // Calculate average rating from analytics (backend returns questionAnalytics)
              if (analytics.questionAnalytics && Array.isArray(analytics.questionAnalytics)) {
                analytics.questionAnalytics.forEach(q => {
                  if (q.type === 'rating' && typeof q.average === 'number') {
                    totalRatings += q.average;
                    ratingCount++;
                  }
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching analytics for form ${form._id}:`, err);
          }
        }
      }

      setStats({
        totalCourses: transformedCourses?.length || 0,
        totalForms: formsData?.length || 0,
        totalResponses,
        averageRating: ratingCount > 0 ? (totalRatings / ratingCount).toFixed(1) : 0
      });

    } catch (err) {
      console.error('Error loading faculty data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteDialog.form) return;

    try {
      setDeleting(true);
      await feedbackService.deleteFeedbackForm(deleteDialog.form._id);
      
      // Remove the form from the local state
      setFeedbackForms(prev => prev.filter(form => form._id !== deleteDialog.form._id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalForms: prev.totalForms - 1
      }));
      
      setDeleteDialog({ open: false, form: null });
    } catch (err) {
      console.error('Error deleting form:', err);
      setError('Failed to delete feedback form');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditForm = (form) => {
    // Navigate to create form page with edit mode
    navigate(`/faculty/create?edit=${form._id}`);
  };

  const canEditForm = (form) => {
    // Faculty can edit their own forms, department admins can edit all forms
    // Support both populated facultyId objects and raw ObjectId strings
    const formFaculty = form?.facultyId;
    const formFacultyId = formFaculty?._id ? formFaculty._id : formFaculty;
    if (user.role === 'faculty') {
      return formFacultyId?.toString() === user._id?.toString();
    }
    return ['department_admin', 'system_admin'].includes(user.role);
  };

  const canDeleteForm = (form) => {
    // Same permissions as edit
    return canEditForm(form);
  };

  if (loading && courses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: '#666' }}>
          Loading Faculty Dashboard...
        </Typography>
      </Container>
    );
  }

  // Default welcome view
  if (currentView === 'default') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Avatar sx={{ 
            width: 120, 
            height: 120, 
            mx: 'auto', 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          }}>
            <School sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            mb: 2 
          }}>
            Welcome, {`${user?.personalInfo?.title || ''} ${user?.personalInfo?.firstName || ''} ${user?.personalInfo?.lastName || ''}`.trim() || 'Faculty'}!
          </Typography>
          <Typography variant="h5" sx={{ color: '#666', mb: 4, fontWeight: 300 }}>
            Manage your courses and track student feedback effectively
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            flexWrap: 'wrap',
            mt: 4 
          }}>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            }}>
              <School sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.totalCourses}
              </Typography>
              <Typography variant="body1">Active Courses</Typography>
            </Card>

            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
            }}>
              <Assignment sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.totalForms}
              </Typography>
              <Typography variant="body1">Feedback Forms</Typography>
            </Card>

            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
            }}>
              <RateReview sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.totalResponses}
              </Typography>
              <Typography variant="body1">Total Responses</Typography>
            </Card>

            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(168, 237, 234, 0.3)',
            }}>
              <TrendingUp sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.averageRating || 'N/A'}
              </Typography>
              <Typography variant="body1">Average Rating</Typography>
            </Card>
          </Box>

          <Box sx={{ mt: 6, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/faculty/create"
              variant="contained"
              size="large"
              startIcon={<AddCircle />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                }
              }}
            >
              Create Feedback Form
            </Button>

            <Button
              component={RouterLink}
              to="/faculty?view=forms"
              variant="outlined"
              size="large"
              startIcon={<Assignment />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                borderColor: '#f093fb',
                color: '#f093fb',
                '&:hover': {
                  borderColor: '#f093fb',
                  background: 'rgba(240, 147, 251, 0.1)',
                }
              }}
            >
              Manage Forms
            </Button>

            <Button
              component={RouterLink}
              to="/faculty/analytics"
              variant="outlined"
              size="large"
              startIcon={<Assessment />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  background: 'rgba(102, 126, 234, 0.1)',
                }
              }}
            >
              View Analytics
            </Button>
          </Box>

          {feedbackForms.length === 0 && (
            <Alert severity="info" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
              You haven't created any feedback forms yet. Click "Create Feedback Form" to get started!
            </Alert>
          )}

          {courses.length === 0 && (
            <Alert severity="warning" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
              No courses assigned yet. Please contact your department administrator.
            </Alert>
          )}

          <Typography variant="body1" sx={{ mt: 6, color: '#999', fontStyle: 'italic' }}>
            👈 Use the side navigation to manage courses and view detailed analytics
          </Typography>
        </Box>
      </Container>
    );
  }

  // Forms management view
  if (currentView === 'forms') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
            My Feedback Forms
          </Typography>
          <Button
            component={RouterLink}
            to="/faculty/create"
            variant="contained"
            startIcon={<AddCircle />}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create New Form
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : feedbackForms.length === 0 ? (
          <Alert severity="info">
            You haven't created any feedback forms yet. Click "Create New Form" to get started!
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Form Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Responses</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbackForms.map((form) => (
                  <TableRow 
                    key={form._id}
                    sx={{ 
                      '&:hover': { bgcolor: '#f9f9f9' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {form.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {form.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {form.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sections: {form.targetSections?.join(', ') || 'None'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={form.status || 'draft'} 
                        color={form.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="body2">
                        {form.responseCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {canEditForm(form) && (
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleEditForm(form)}
                            title="Edit Form"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {canDeleteForm(form) && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteDialog({ open: true, form })}
                            title="Delete Form"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, form: null })}
        >
          <DialogTitle>Delete Feedback Form</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{deleteDialog.form?.title}"? 
              This action cannot be undone and will permanently remove all associated responses.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialog({ open: false, form: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteForm} 
              color="error" 
              variant="contained"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Courses view
  if (currentView === 'courses') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          My Courses
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : courses.length === 0 ? (
          <Alert severity="info">
            No courses assigned yet. Please contact your department administrator to get course assignments.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Course Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Course Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Sections</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Total Sections</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course, idx) => (
                  <TableRow 
                    key={idx}
                    sx={{ 
                      '&:hover': { bgcolor: '#f9f9f9' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {course.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {course.courseName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={course.department || 'N/A'} 
                        size="small" 
                        sx={{ bgcolor: '#e3f2fd' }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {course.sections?.map((section, sIdx) => (
                        <Chip 
                          key={sIdx}
                          label={section} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5, bgcolor: '#f3e5f5' }}
                        />
                      )) || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {course.totalSections}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            component={RouterLink}
            to="/faculty/create"
            variant="contained"
            startIcon={<AddCircle />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create Feedback Form
          </Button>
        </Box>
      </Container>
    );
  }

  return null;
}