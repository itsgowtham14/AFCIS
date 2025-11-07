import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Assignment, TrendingUp, School, EmojiEvents, CheckCircle, PendingActions } from '@mui/icons-material';
import { feedbackService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard({ view = 'default' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFeedback, setActiveFeedback] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    submitted: 0,
    impactScore: 0
  });

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch active feedback forms
      const forms = await feedbackService.getActiveFeedback();
      console.log('Active Feedback:', forms);
      
      setActiveFeedback(forms || []);
      
      // Calculate stats
      const pending = forms ? forms.filter(f => !f.submitted).length : 0;
      const submitted = forms ? forms.filter(f => f.submitted).length : 0;
      
      setStats({
        pending: pending,
        submitted: submitted,
        impactScore: submitted * 10 // Simple calculation
      });
      
    } catch (err) {
      console.error('Error loading student data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your dashboard...</Typography>
      </Container>
    );
  }
  // Default welcome view
  if (view === 'default') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
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
            Welcome, {user?.personalInfo?.firstName || 'Student'}!
          </Typography>
          <Typography variant="h5" sx={{ color: '#666', mb: 4, fontWeight: 300 }}>
            Your feedback shapes better learning experiences
          </Typography>
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
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.pending}</Typography>
              <Typography variant="body1">Pending Feedback</Typography>
            </Card>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.submitted}</Typography>
              <Typography variant="body1">Total Submitted</Typography>
            </Card>
            <Card sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              minWidth: 200,
              boxShadow: '0 8px 24px rgba(168, 237, 234, 0.3)',
            }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{stats.impactScore}</Typography>
              <Typography variant="body1">Impact Score</Typography>
            </Card>
          </Box>
          <Typography variant="body1" sx={{ mt: 6, color: '#999', fontStyle: 'italic' }}>
            👈 Use the side navigation to explore your feedback options
          </Typography>
        </Box>
      </Container>
    );
  }

  // Pending Feedback view
  if (view === 'pending') {
    const pendingForms = activeFeedback.filter(f => !f.submitted);
    
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          Pending Feedback Forms
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      You have {stats.pending} pending feedback form{stats.pending !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ opacity: 0.9 }}>Your input helps improve teaching quality</Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 60, opacity: 0.5 }} />
                </Box>
                <Button 
                  variant="contained" 
                  component={RouterLink} 
                  to="/student/active"
                  sx={{
                    mt: 3,
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  View All Forms
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Impact view
  if (view === 'impact') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          Your Impact
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '100%',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total Feedback</Typography>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>{stats.submitted}</Typography>
                <Typography sx={{ opacity: 0.9 }}>Forms submitted this semester</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              height: '100%',
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Impact Score</Typography>
                  <EmojiEvents sx={{ fontSize: 40, opacity: 0.7, color: '#ffd700' }} />
                </Box>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>{stats.impactScore}</Typography>
                <Typography sx={{ opacity: 0.9 }}>Keep up the great work!</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Courses view
  if (view === 'courses') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          My Courses
        </Typography>
        
        {activeFeedback.length === 0 ? (
          <Alert severity="info">
            No active feedback forms available for your courses at the moment.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {activeFeedback.map((form) => (
              <Grid item xs={12} md={6} key={form._id}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  height: '100%',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {form.courseName || 'Course'}
                      </Typography>
                      {form.submitted ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Submitted" 
                          size="small" 
                          color="success"
                        />
                      ) : (
                        <Chip 
                          icon={<PendingActions />} 
                          label="Pending" 
                          size="small" 
                          color="warning"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                      {form.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      Type: {form.type?.replace('_', ' ').toUpperCase()}
                    </Typography>
                    {!form.submitted && (
                      <Button
                        variant="contained"
                        component={RouterLink}
                        to={`/student/feedback/${form._id}`}
                        fullWidth
                        sx={{ 
                          mt: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        Submit Feedback
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  return null;
}