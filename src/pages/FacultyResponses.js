import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Box,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import { feedbackService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';

export default function FacultyResponses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [formData, responsesData, analyticsData] = await Promise.all([
        feedbackService.getFeedbackFormById(id),
        feedbackService.getFeedbackResponses(id),
        feedbackService.getFeedbackAnalytics(id)
      ]);
      
      console.log('Form:', formData);
      console.log('Responses:', responsesData);
      console.log('Analytics:', analyticsData);
      
      setForm(formData);
      setResponses(responsesData || []);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      console.error('Error loading form data:', err);
      setError(err.message || 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading responses...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/faculty')}>Back to Dashboard</Button>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Feedback form not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/faculty')}>Back to Dashboard</Button>
      </Container>
    );
  }

  const canSeeStudent = user?.role === 'department_admin' || user?.role === 'system_admin';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
          Responses — {form.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {form.courseName} ({form.courseCode}) - {form.targetSections.join(', ')}
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {analytics?.totalResponses || 0}
              </Typography>
              <Typography variant="body1">Total Responses</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {analytics?.averageRating?.toFixed(2) || 'N/A'}
              </Typography>
              <Typography variant="body1">Average Rating</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Status
              </Typography>
              <Chip 
                label={form.status.toUpperCase()} 
                color={form.status === 'active' ? 'success' : 'default'}
                sx={{ fontWeight: 'bold' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Individual Responses */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Individual Responses ({responses.length})
      </Typography>
      
      {responses.length === 0 ? (
        <Alert severity="info">No responses received yet</Alert>
      ) : (
        <Grid container spacing={3}>
          {responses.map((r, idx) => (
            <Grid item xs={12} md={6} key={r._id || idx}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Response #{idx + 1}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(r.submittedAt).toLocaleString()}
                    </Typography>
                  </Box>

                  {canSeeStudent && (
                    <Typography variant="body2" sx={{ mb: 2, color: '#667eea' }}>
                      Student: {r.studentId?.personalInfo?.firstName} {r.studentId?.personalInfo?.lastName}
                    </Typography>
                  )}

                  <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                    {r.responses.map((resp, qIdx) => {
                      const resolvedAnswer = resp.answer ?? (resp.type === 'rating'
                        ? resp.rating
                        : resp.type === 'multiple_choice'
                          ? resp.selectedOption
                          : resp.textResponse);

                      return (
                        <Box key={qIdx} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Q{qIdx + 1}: {resp.questionText || 'Question'}
                          </Typography>
                          
                          {resp.type === 'rating' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <RatingStars value={Number(resolvedAnswer) || 0} />
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                              {resolvedAnswer ?? 'N/A'}/5
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', pl: 2 }}>
                            "{resolvedAnswer || 'No response provided'}"
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/faculty')}
          sx={{ px: 4 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
