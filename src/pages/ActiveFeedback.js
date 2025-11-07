import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Assignment, CheckCircle, Schedule } from '@mui/icons-material';
import { feedbackService } from '../services/api';

export default function ActiveFeedback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackForms, setFeedbackForms] = useState([]);

  useEffect(() => {
    loadActiveFeedback();
  }, []);

  const loadActiveFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getActiveFeedback();
      console.log('Active Feedback Forms:', data);
      setFeedbackForms(data || []);
      if (Array.isArray(data)) {
        const noMatch = data.filter(f => f && f.sectionMatch === false);
        if (noMatch.length > 0) {
          console.warn('⚠️ Some forms returned via safety fallback (no section match):', noMatch.map(f => f.title));
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError(err.message || 'Failed to load active feedback forms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading feedback forms...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
          Active Feedback Forms
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {feedbackForms.length === 0 ? (
        <Alert severity="info">
          No active feedback forms available at the moment. Check back later!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {feedbackForms.map((form) => (
            <Grid item xs={12} md={6} key={form._id}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {form.title}
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
                        icon={<Schedule />}
                        label="Pending" 
                        size="small" 
                        color="warning" 
                      />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Course:</strong> {form.courseName} ({form.courseCode || 'N/A'})
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    <strong>Type:</strong> {form.type?.replace('_', ' ').toUpperCase()}
                  </Typography>

                  {form.description && (
                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                      {form.description}
                    </Typography>
                  )}

                  {form.sectionMatch === false && (
                    <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mb: 1 }}>
                      (Diagnostic: Section fallback – not directly targeted to your section)
                    </Typography>
                  )}

                  {form.schedule?.closeDate && (
                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 2 }}>
                      Due: {new Date(form.schedule.closeDate).toLocaleDateString()}
                    </Typography>
                  )}

                  {!form.submitted && (
                    <Button 
                      variant="contained" 
                      component={RouterLink} 
                      to={`/student/feedback/${form._id}`}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        }
                      }}
                    >
                      Fill Feedback
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
