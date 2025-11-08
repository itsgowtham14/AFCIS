import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating
} from '@mui/material';
import {
  History,
  ExpandMore,
  CheckCircle,
  Star,
  TextFields,
  CalendarToday
} from '@mui/icons-material';
import { feedbackService } from '../services/api';

export default function FeedbackHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getMyFeedbackHistory();
      console.log('Feedback History:', data);
      setHistory(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your feedback history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <History sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
          My Feedback History
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {history.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            You haven't submitted any feedback yet.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/student')}
            sx={{
              mt: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            View Active Feedback Forms
          </Button>
        </Card>
      ) : (
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<CheckCircle />}
              label={`${history.length} Feedback${history.length !== 1 ? 's' : ''} Submitted`}
              color="success"
              sx={{ fontWeight: 'bold', px: 2, py: 3 }}
            />
          </Box>

          <Grid container spacing={3}>
            {history.map((item, idx) => (
              <Grid item xs={12} key={item._id}>
                <Accordion
                  expanded={expanded === `panel${idx}`}
                  onChange={handleAccordionChange(`panel${idx}`)}
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    '&:before': { display: 'none' },
                    mb: 2
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: expanded === `panel${idx}` ? '12px 12px 0 0' : '12px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                      }
                    }}
                  >
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {item.courseName} ({item.courseCode})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {item.averageRating && (
                          <Chip
                            icon={<Star />}
                            label={`${item.averageRating.toFixed(1)} / 5.0`}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                        <Chip
                          label={item.type.toUpperCase()}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 4, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 20, color: '#667eea' }} />
                      <Typography variant="body2" color="text.secondary">
                        Submitted on: {new Date(item.submittedAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#667eea' }}>
                      Your Responses:
                    </Typography>

                    <Grid container spacing={2}>
                      {item.responses.map((resp, qIdx) => {
                        const resolvedAnswer = resp.answer ?? (resp.type === 'rating'
                          ? resp.rating
                          : resp.type === 'multiple_choice'
                            ? resp.selectedOption
                            : resp.textResponse);

                        return (
                          <Grid item xs={12} key={qIdx}>
                            <Card sx={{ bgcolor: 'white', borderRadius: 2 }}>
                              <CardContent>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}
                                >
                                  Q{qIdx + 1}: {resp.questionText}
                                </Typography>

                                {resp.type === 'rating' ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Rating
                                      value={Number(resolvedAnswer) || 0}
                                      readOnly
                                      max={5}
                                      size="large"
                                      sx={{
                                        '& .MuiRating-iconFilled': {
                                          color: '#667eea'
                                        }
                                      }}
                                    />
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 'bold', color: '#667eea' }}
                                    >
                                      {resolvedAnswer ?? 'N/A'} / 5
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      bgcolor: '#f5f5f5',
                                      p: 2,
                                      borderRadius: 2,
                                      borderLeft: '4px solid #667eea'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <TextFields sx={{ fontSize: 20, color: '#667eea' }} />
                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        Your Response:
                                      </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                      "{resolvedAnswer || 'No response provided'}"
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/student')}
          sx={{ px: 4 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
}
