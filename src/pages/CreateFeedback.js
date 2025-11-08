import React, { useState, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  MenuItem, 
  Button, 
  Box, 
  Typography, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { Add, Delete, ArrowBack } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { feedbackService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function CreateFeedback() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editFormId = searchParams.get('edit');
  const isEditMode = !!editFormId;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [facultyCourses, setFacultyCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'lecture',
    courseName: '',
    courseCode: '',
    targetSections: [],
    questions: [
      { questionText: 'How would you rate the overall teaching quality?', type: 'rating', required: true },
      { questionText: 'Was the course content well organized?', type: 'rating', required: true }
    ],
    schedule: {
      openDate: new Date().toISOString().split('T')[0],
      closeDate: '',
      reminderFrequency: 'weekly'
    },
    isAnonymous: true,
    status: 'active'
  });

  useEffect(() => {
    loadFacultyCourses();
  }, []);

  useEffect(() => {
    if (isEditMode && editFormId) {
      loadFormForEdit(editFormId);
    }
  }, [isEditMode, editFormId]);

  const loadFormForEdit = async (formId) => {
    try {
      setLoading(true);
      const form = await feedbackService.getFeedbackFormById(formId);
      
      // Populate form data with existing values
      setFormData({
        title: form.title || '',
        description: form.description || '',
        type: form.type || 'lecture',
        courseName: form.courseName || '',
        courseCode: form.courseCode || '',
        targetSections: form.targetSections || [],
        questions: form.questions || [],
        schedule: {
          openDate: form.schedule?.openDate ? new Date(form.schedule.openDate).toISOString().split('T')[0] : '',
          closeDate: form.schedule?.closeDate ? new Date(form.schedule.closeDate).toISOString().split('T')[0] : '',
          reminderFrequency: form.schedule?.reminderFrequency || 'weekly'
        },
        isAnonymous: form.settings?.isAnonymous ?? true,
        status: form.status || 'active'
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to load form: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyCourses = async () => {
    try {
      setLoading(true);
      const data = await userService.getFacultyCourseInfo(user._id);
      setFacultyCourses(data.courses || []);
      setError(null);
    } catch (err) {
      setError('Failed to load courses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseName) => {
    const selectedCourse = facultyCourses.find(c => c.courseName === courseName);
    setFormData({
      ...formData,
      courseName: courseName,
      courseCode: selectedCourse?.courseCode || '',
      targetSections: [] // Reset sections when course changes
    });
  };

  const handleSectionChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      targetSections: typeof value === 'string' ? value.split(',') : value
    });
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: '',
      type: 'rating',
      required: true
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = formData.questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const deleteQuestion = (index) => {
    if (formData.questions.length > 1) {
      const updatedQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, questions: updatedQuestions });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a form title');
      return;
    }
    if (!formData.courseName) {
      setError('Please select a course');
      return;
    }
    if (formData.targetSections.length === 0) {
      setError('Please select at least one section');
      return;
    }
    if (!formData.schedule.closeDate) {
      setError('Please set a close date');
      return;
    }
    if (formData.questions.some(q => !q.questionText.trim())) {
      setError('All questions must have text');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Format data for backend
      const submitData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        courseName: formData.courseName,
        courseCode: formData.courseCode,
        targetSections: formData.targetSections,
        questions: formData.questions.map(q => ({
          questionText: q.questionText,
          type: q.type,
          required: q.required,
          options: q.options || []
        })),
        schedule: {
          openDate: formData.schedule.openDate,
          closeDate: formData.schedule.closeDate,
          reminderFrequency: formData.schedule.reminderFrequency
        },
        settings: {
          isAnonymous: formData.isAnonymous
        },
        status: formData.status
      };
      
      console.log('Submitting form data:', submitData);
      
      if (isEditMode) {
        await feedbackService.updateFeedbackForm(editFormId, submitData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/faculty?view=forms');
        }, 1500);
      } else {
        await feedbackService.createFeedbackForm(submitData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/faculty');
        }, 2000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} feedback form: ` + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your courses...</Typography>
      </Container>
    );
  }

  const selectedCourse = facultyCourses.find(c => c.courseName === formData.courseName);
  const availableSections = selectedCourse?.sections || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/faculty')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ 
          mb: 3, 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isEditMode ? 'Edit Feedback Form' : 'Create Feedback Form'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Feedback form {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Form Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Mid-Semester Feedback - DSA"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                placeholder="Brief description of this feedback form"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Feedback Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Feedback Type"
                >
                  <MenuItem value="lecture">Lecture Feedback</MenuItem>
                  <MenuItem value="unit">Unit Feedback</MenuItem>
                  <MenuItem value="module">Module Feedback</MenuItem>
                  <MenuItem value="semester">Semester Feedback</MenuItem>
                  <MenuItem value="module_bank">Module Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Course</InputLabel>
                <Select
                  value={formData.courseName}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  label="Course"
                >
                  {facultyCourses.map((course) => (
                    <MenuItem key={course.courseName} value={course.courseName}>
                      {course.courseCode} - {course.courseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!formData.courseName}>
                <InputLabel>Target Sections</InputLabel>
                <Select
                  multiple
                  value={formData.targetSections}
                  onChange={handleSectionChange}
                  input={<OutlinedInput label="Target Sections" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {availableSections.map((section) => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Schedule */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Schedule
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Open Date"
                value={formData.schedule.openDate}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, openDate: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Close Date"
                value={formData.schedule.closeDate}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: { ...formData.schedule, closeDate: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{ min: formData.schedule.openDate }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Reminder Frequency</InputLabel>
                <Select
                  value={formData.schedule.reminderFrequency}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, reminderFrequency: e.target.value }
                  })}
                  label="Reminder Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Questions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Questions
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addQuestion}
                >
                  Add Question
                </Button>
              </Box>
            </Grid>

            {formData.questions.map((question, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        label={`Question ${index + 1}`}
                        value={question.questionText}
                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                        required
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                            label="Type"
                            size="small"
                          >
                            <MenuItem value="rating">Rating (1-5)</MenuItem>
                            <MenuItem value="text">Text Response</MenuItem>
                            <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={question.required}
                              onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                            />
                          }
                          label="Required"
                        />
                      </Box>
                    </Box>
                    
                    {formData.questions.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => deleteQuestion(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}

            {/* Settings */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Settings
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Student Privacy:</strong> Student identities are automatically hidden from faculty. 
                  Only department admins and system admins can view student details.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
                <RadioGroup
                  row
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <FormControlLabel value="active" control={<Radio />} label="Active (visible to students)" />
                  <FormControlLabel value="draft" control={<Radio />} label="Draft (not visible)" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/faculty')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={submitting}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    }
                  }}
                >
                  {submitting ? <CircularProgress size={24} /> : (isEditMode ? 'Update Feedback Form' : 'Create Feedback Form')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
