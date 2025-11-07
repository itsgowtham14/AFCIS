import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Slider, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { feedbackService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FeedbackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const getQuestionKey = (question, index) => {
    const raw = question.questionId || question._id || index;
    return raw ? raw.toString() : String(index);
  };

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getFeedbackFormById(id);
      console.log('Form loaded:', data);
      setForm(data);
      
      // Initialize responses
      const initialResponses = {};
      data.questions.forEach((q, idx) => {
        const key = getQuestionKey(q, idx);
        if (q.type === 'rating') {
          initialResponses[key] = 3;
        } else if (q.type === 'multiple_choice') {
          initialResponses[key] = '';
        } else {
          initialResponses[key] = '';
        }
      });
      setResponses(initialResponses);
      setError(null);
      setValidationError('');
    } catch (err) {
      console.error('Error loading form:', err);
      setError(err.message || 'Failed to load feedback form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setValidationError('');
       
      const formattedResponses = [];
      const missingRequired = [];

      form.questions.forEach((q, idx) => {
        const key = getQuestionKey(q, idx);
        const questionId = (q.questionId || q._id || key).toString();
        const rawValue = responses[key];

        const payload = {
          questionId,
          questionText: q.questionText,
          type: q.type
        };

        if (q.type === 'rating') {
          const numericValue = Number(rawValue);
          if (Number.isFinite(numericValue)) {
            const bounded = Math.min(5, Math.max(1, Math.round(numericValue)));
            payload.rating = bounded;
            payload.answer = bounded;
          }

          if (q.required && (payload.rating === undefined || payload.rating === null)) {
            missingRequired.push(idx + 1);
          }
        } else if (q.type === 'multiple_choice') {
          const selected = rawValue ? String(rawValue) : '';
          if (selected) {
            payload.selectedOption = selected;
            payload.answer = selected;

            if (Array.isArray(q.options) && q.options.length && !q.options.includes(selected)) {
              missingRequired.push(idx + 1);
            }
          }

          if (q.required && !selected) {
            missingRequired.push(idx + 1);
          }
        } else {
          const text = typeof rawValue === 'string' ? rawValue.trim() : rawValue ? String(rawValue) : '';
          payload.textResponse = text;
          payload.answer = text;

          if (q.required && (!text || text.length === 0)) {
            missingRequired.push(idx + 1);
          }
        }

        formattedResponses.push(payload);
      });

      if (missingRequired.length > 0) {
        const uniqueMissing = Array.from(new Set(missingRequired)).sort((a, b) => a - b);
        setValidationError(`Please complete required questions: ${uniqueMissing.join(', ')}`);
        setSubmitting(false);
        return;
      }
 
      const submitData = {
        formId: form._id,
        responses: formattedResponses
      };

      console.log('Submitting:', submitData);
      await feedbackService.submitFeedbackResponse(submitData);
      
      alert('Feedback submitted successfully!');
      navigate('/student');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setValidationError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading feedback form...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/student')}>Back to Dashboard</Button>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Feedback form not found</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/student')}>Back to Dashboard</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
            {form.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {form.courseName} ({form.courseCode})
          </Typography>
          {form.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {form.description}
            </Typography>
          )}

          {validationError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {validationError}
            </Alert>
          )}

          <Box sx={{ mt: 4 }}>
            {form.questions.map((q, idx) => (
              <Box key={getQuestionKey(q, idx)} sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {idx + 1}. {q.questionText}
                </Typography>

                {q.type === 'rating' ? (
                  <>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        value={Number(responses[getQuestionKey(q, idx)] ?? 3)}
                        min={1}
                        max={5}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                          { value: 3, label: '3' },
                          { value: 4, label: '4' },
                          { value: 5, label: '5' }
                        ]}
                        onChange={(e, v) => setResponses({ ...responses, [getQuestionKey(q, idx)]: v })}
                        sx={{
                          '& .MuiSlider-thumb': {
                            backgroundColor: '#667eea'
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: '#667eea'
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                      Selected: {responses[getQuestionKey(q, idx)] || 3}/5
                    </Typography>
                  </>
                ) : q.type === 'multiple_choice' ? (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Choose an option</FormLabel>
                    <RadioGroup
                      value={responses[getQuestionKey(q, idx)] || ''}
                      onChange={(event) => setResponses({
                        ...responses,
                        [getQuestionKey(q, idx)]: event.target.value
                      })}
                    >
                      {Array.isArray(q.options) && q.options.length > 0 ? (
                        q.options.map((option, optionIdx) => (
                          <FormControlLabel
                            key={`${getQuestionKey(q, idx)}-option-${optionIdx}`}
                            value={option}
                            control={<Radio />}
                            label={option}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No options provided for this question.
                        </Typography>
                      )}
                    </RadioGroup>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Enter your response..."
                    value={responses[getQuestionKey(q, idx)] || ''}
                    onChange={(e) => setResponses({ ...responses, [getQuestionKey(q, idx)]: e.target.value })}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            ))}

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/student')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={submitting}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                  }
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
