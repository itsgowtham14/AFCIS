import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  School,
  Person,
  Assessment,
  TrendingUp,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  Star,
  StarBorder
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { feedbackService } from '../services/api';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DepartmentDashboard() {
  const [loading, setLoading] = useState(true);
  const [departmentData, setDepartmentData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyAnalytics, setFacultyAnalytics] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState('all');

  useEffect(() => {
    loadDepartmentAnalytics();
  }, []);

  const loadDepartmentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getDepartmentAnalytics();
      console.log('📊 Department Analytics Data:', data);
      console.log('📚 Courses:', data?.courses);
      if (data?.courses && data.courses.length > 0) {
        console.log('🔍 First course structure:', JSON.stringify(data.courses[0], null, 2));
      }
      setDepartmentData(data);
    } catch (err) {
      console.error('Error loading department analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAnalytics = async (courseId) => {
    console.log('🔍 Loading course analytics for ID:', courseId);
    
    if (!courseId) {
      console.error('❌ Course ID is undefined!');
      setError('Invalid course selected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getCourseAnalytics(courseId);
      setCourseAnalytics(data);
      setSelectedCourse(courseId);
      setSelectedFaculty(null);
      setFacultyAnalytics(null);
      setSelectedSection('all'); // Reset section filter
    } catch (err) {
      console.error('Error loading course analytics:', err);
      setError(err.message || 'Failed to load course analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyAnalytics = async (facultyId, courseId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getFacultyAnalytics(facultyId, { courseId });
      setFacultyAnalytics(data);
      setSelectedFaculty(facultyId);
    } catch (err) {
      console.error('Error loading faculty analytics:', err);
      setError(err.message || 'Failed to load faculty analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setCourseAnalytics(null);
    setSelectedFaculty(null);
    setFacultyAnalytics(null);
  };

  const handleBackToFaculty = () => {
    setSelectedFaculty(null);
    setFacultyAnalytics(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get available sections from courseAnalytics
  const availableSections = useMemo(() => {
    if (!courseAnalytics?.faculty) return [];
    const sections = new Set();
    courseAnalytics.faculty.forEach(f => {
      f.sections?.forEach(s => sections.add(s));
    });
    return Array.from(sections).sort();
  }, [courseAnalytics]);

  // Filter faculty based on selected section
  const filteredFaculty = useMemo(() => {
    if (!courseAnalytics?.faculty) return [];
    if (selectedSection === 'all') return courseAnalytics.faculty;
    
    // Filter faculty who teach the selected section
    return courseAnalytics.faculty.filter(faculty => 
      faculty.sections?.includes(selectedSection)
    );
  }, [courseAnalytics, selectedSection]);

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= Math.round(rating) ? 
        <Star key={i} sx={{ color: '#ffc107', fontSize: 20 }} /> :
        <StarBorder key={i} sx={{ color: '#e0e0e0', fontSize: 20 }} />
      );
    }
    return <Box sx={{ display: 'flex', gap: 0.25 }}>{stars}</Box>;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#4caf50';
    if (rating >= 3.5) return '#8bc34a';
    if (rating >= 2.5) return '#ff9800';
    if (rating >= 1.5) return '#ff5722';
    return '#f44336';
  };

  const createRatingDistributionChart = (distribution) => {
    return {
      labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      datasets: [{
        label: 'Number of Responses',
        data: [
          distribution[1],
          distribution[2],
          distribution[3],
          distribution[4],
          distribution[5]
        ],
        backgroundColor: [
          '#f44336',
          '#ff9800',
          '#ffc107',
          '#8bc34a',
          '#4caf50'
        ],
        borderRadius: 8
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading && !departmentData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: '#666' }}>
          Loading Department Analytics...
        </Typography>
      </Container>
    );
  }

  if (error && !departmentData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDepartmentAnalytics}>
          Retry
        </Button>
      </Container>
    );
  }

  // Faculty Section View
  if (selectedFaculty && facultyAnalytics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToFaculty}
          sx={{ mb: 3 }}
        >
          Back to Course Details
        </Button>

        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {facultyAnalytics.faculty.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {facultyAnalytics.faculty.universityId} • {facultyAnalytics.faculty.designation}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {facultyAnalytics.faculty.department}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ 
                  fontWeight: 'bold',
                  color: getRatingColor(facultyAnalytics.overall.averageRating)
                }}>
                  {facultyAnalytics.overall.averageRating.toFixed(2)}
                </Typography>
                {renderRatingStars(facultyAnalytics.overall.averageRating)}
                <Typography variant="caption" color="text.secondary">
                  Overall Rating
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {facultyAnalytics.overall.totalForms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Feedback Forms
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                    {facultyAnalytics.overall.totalResponses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Student Responses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f093fb' }}>
                    {facultyAnalytics.overall.sectionsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sections Taught
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Section-wise Feedback Analysis
        </Typography>

        {facultyAnalytics.sections.length === 0 ? (
          <Alert severity="info">
            No feedback data available for this faculty member yet.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {facultyAnalytics.sections.map((section) => (
              <Grid item xs={12} key={section.section}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <CardContent>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleSection(section.section)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={`Section ${section.section}`} 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            px: 2
                          }} 
                        />
                        <Box>
                          <Typography variant="h6" sx={{ 
                            color: getRatingColor(section.averageRating),
                            fontWeight: 'bold'
                          }}>
                            {section.averageRating.toFixed(2)} / 5.0
                          </Typography>
                          {renderRatingStars(section.averageRating)}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Forms
                          </Typography>
                          <Typography variant="h6">{section.totalForms}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Responses
                          </Typography>
                          <Typography variant="h6">{section.totalResponses}</Typography>
                        </Box>
                        <IconButton>
                          {expandedSections[section.section] ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={expandedSections[section.section]}>
                      <Box sx={{ mt: 3 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                              Rating Distribution
                            </Typography>
                            <Box sx={{ height: 200 }}>
                              <Bar 
                                data={createRatingDistributionChart(section.ratingDistribution)} 
                                options={chartOptions}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                              Student Responses ({section.totalResponses})
                            </Typography>
                            {section.feedbackForms.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No feedback forms available
                              </Typography>
                            ) : (
                              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                {section.feedbackForms.map((form) => (
                                  <Card key={form.id} sx={{ mb: 2, borderRadius: 2 }}>
                                    <CardContent sx={{ pb: '16px !important' }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {form.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {form.type} • {form.responseCount} responses
                                      </Typography>
                                      
                                      {/* Student-wise responses for this form */}
                                      {form.responseCount > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                                            Individual Responses ({form.responses?.length || 0}):
                                          </Typography>
                                          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {form.responses?.map((studentResponse, idx) => (
                                              <Card key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f9f9f9' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                                                  {studentResponse.studentName} ({studentResponse.studentId})
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                  Submitted: {new Date(studentResponse.submittedAt).toLocaleDateString()}
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                  {studentResponse.responses.map((ans, ansIdx) => (
                                                    <Box key={ansIdx} sx={{ mb: 0.5 }}>
                                                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                        Q{ansIdx + 1}: {ans.questionText}
                                                      </Typography>
                                                      <Typography variant="caption" display="block" color="text.secondary">
                                                        {ans.type === 'rating' && `Rating: ${ans.rating || ans.answer}/5`}
                                                        {ans.type === 'multiple_choice' && `Answer: ${ans.selectedOption || ans.answer}`}
                                                        {ans.type === 'text' && `Response: ${ans.textResponse || ans.answer || 'N/A'}`}
                                                      </Typography>
                                                    </Box>
                                                  ))}
                                                </Box>
                                              </Card>
                                            )) || (
                                              <Typography variant="caption" color="text.secondary">
                                                Loading student responses...
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </Box>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // Course Analytics View (with Faculty List)
  if (selectedCourse && courseAnalytics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToCourses}
          sx={{ mb: 3 }}
        >
          Back to All Courses
        </Button>

        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <School sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {courseAnalytics.course.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {courseAnalytics.course.code} • {courseAnalytics.course.credits} Credits
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {courseAnalytics.course.department}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ 
                  fontWeight: 'bold',
                  color: getRatingColor(courseAnalytics.overall.averageRating)
                }}>
                  {courseAnalytics.overall.averageRating.toFixed(2)}
                </Typography>
                {renderRatingStars(courseAnalytics.overall.averageRating)}
                <Typography variant="caption" color="text.secondary">
                  Overall Course Rating
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                    {courseAnalytics.overall.totalForms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Feedback Forms
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                    {courseAnalytics.overall.totalResponses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Student Responses
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f093fb' }}>
                    {courseAnalytics.faculty.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Faculty Members
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Overall Rating Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <Bar 
                  data={createRatingDistributionChart(courseAnalytics.overall.ratingDistribution)} 
                  options={chartOptions}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Faculty Performance for this Course
          </Typography>
          
          {availableSections.length > 0 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Filter by Section"
              >
                <MenuItem value="all">All Sections</MenuItem>
                {availableSections.map((section) => (
                  <MenuItem key={section} value={section}>
                    Section {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {filteredFaculty.length === 0 ? (
          <Alert severity="info">
            {selectedSection === 'all' 
              ? 'No faculty data available for this course yet.'
              : `No faculty data available for section ${selectedSection}.`
            }
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredFaculty.map((faculty) => (
              <Grid item xs={12} md={6} lg={4} key={faculty.facultyId}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.15)'
                    }
                  }}
                  onClick={() => loadFacultyAnalytics(faculty.facultyId, selectedCourse)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        width: 50, 
                        height: 50, 
                        mr: 2,
                        bgcolor: getRatingColor(faculty.averageRating)
                      }}>
                        <Person />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {faculty.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {faculty.universityId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 'bold',
                        color: getRatingColor(faculty.averageRating)
                      }}>
                        {faculty.averageRating.toFixed(2)}
                      </Typography>
                      {renderRatingStars(faculty.averageRating)}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Sections
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {faculty.sections.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Forms
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {faculty.totalForms}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Responses
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {faculty.totalResponses}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Sections: {faculty.sections.join(', ')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    );
  }

  // Main Department Overview (Course List)
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
          📊 Department Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {departmentData?.department?.name || 'Department Dashboard'}
        </Typography>
        {departmentData?.department?.admin && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Welcome, {departmentData.department.admin.name}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {departmentData?.message ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {departmentData.message}
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <School sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {departmentData?.summary?.totalCourses || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Person sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {departmentData?.summary?.totalFaculty || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Faculty Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Assessment sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {departmentData?.summary?.totalResponses || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUp sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {departmentData?.summary?.avgSatisfaction || '0.0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Course Performance Overview
      </Typography>

      {!departmentData?.courses || departmentData.courses.length === 0 ? (
        <Alert severity="info">
          No course feedback data available yet. Courses and feedback forms need to be created before analytics can be displayed.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Course Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Course Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Credits</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Total Forms</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Responses</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departmentData.courses.map((course) => {
                console.log('📝 Rendering course:', JSON.stringify(course, null, 2));
                console.log('🔑 Course _id:', course._id);
                // Use courseId or courseName as identifier (avoid N/A)
                const courseIdentifier = course._id || course.courseId || course.courseName;
                return (
                  <TableRow 
                    key={courseIdentifier}
                    sx={{ 
                      '&:hover': { bgcolor: '#f9f9f9', cursor: 'pointer' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {course.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{course.credits}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip 
                        label={`${course.totalForms || 0} Forms`} 
                        size="small" 
                        sx={{ bgcolor: '#e3f2fd' }}
                      />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      {course.totalResponses || 0}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        console.log('🖱️ Clicked course:', course);
                        console.log('🔑 Using identifier:', courseIdentifier);
                        loadCourseAnalytics(courseIdentifier);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
