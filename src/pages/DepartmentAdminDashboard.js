import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  Paper,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person,
  TrendingUp,
  TrendingDown,
  School,
  Assessment,
  CheckCircle,
  Group,
  BarChart,
  ArrowBack,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { departmentService as department } from '../services/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

export default function DepartmentAdminDashboard() {
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyPerformance, setFacultyPerformance] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionForms, setSectionForms] = useState([]);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFacultyForCourse, setSelectedFacultyForCourse] = useState('');
  const [selectedSectionForCourse, setSelectedSectionForCourse] = useState('');
  const [loadingCourseAnalytics, setLoadingCourseAnalytics] = useState(false);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const department = userInfo.department;

  // Fetch faculty members in the department
  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    try {
      setLoading(true);
      const data = await department.getAllFaculty(department);
      console.log('Faculty data:', data);

      // Calculate performance metrics for each faculty
      const facultyWithMetrics = data.map(faculty => {
        // This is a simplified calculation - in production you'd want to get this from the backend
        // For now, we'll use placeholder values
        const courses = faculty.academicInfo?.courses || [];
        const totalSections = courses.reduce((sum, course) => sum + (course.sections?.length || 0), 0);

        return {
          ...faculty,
          avgRating: null, // Will be calculated properly later
          totalSections,
          totalForms: 0, // Will be calculated properly later
          totalResponses: 0, // Will be calculated properly later
          sections: courses.flatMap(course => course.sections || [])
        };
      });

      setFacultyList(facultyWithMetrics);
      setError(null);
    } catch (err) {
      console.error('Error loading faculty:', err);
      setError(err.message || 'Failed to load faculty data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch faculty performance and sections
  const handleFacultyClick = async (faculty) => {
    try {
      setLoading(true);
      setSelectedFaculty(faculty);
      setSelectedSection(null);
      setSelectedForm(null);
      
      // Fetch faculty performance from backend
      const response = await department.getFacultyPerformance(faculty._id, department);
      
      // Transform response to match expected format
      const rawPerformanceByForm = response.performance.performanceByForm || [];
      let aggregatedResponses = 0;
      let aggregatedStudents = 0;

      const performanceByForm = rawPerformanceByForm.map((item, index) => {
        const responseCount = Number(item.responseCount || 0);
        const totalStudents = Number(item.totalStudents || 0);
        aggregatedResponses += responseCount;
        aggregatedStudents += totalStudents;

        return {
          ...item,
          avgRating: Number(item.avgRating || 0),
          responseRate: Number(item.responseRate || 0),
          responseCount,
          totalStudents,
          order: index + 1
        };
      });

      const overallResponseRate = aggregatedStudents > 0
        ? Number(((aggregatedResponses / aggregatedStudents) * 100).toFixed(1))
        : 0;

      const performanceData = {
        overallRating: Number(response.performance.overallRating || 0),
        totalForms: response.performance.totalForms,
        totalResponses: response.performance.totalResponses ?? aggregatedResponses,
        overallResponseRate,
        trend: Number(response.performance.trend || 0),
        sections: (response.performance.sections || []).map(s => ({
          section: s.section,
          fullSection: s.fullSection,
          courseId: s.courseId,
          courseCode: s.courseCode,
          courseName: s.courseName,
          offeringId: s.offeringId,
          year: s.year
        })),
        performanceByForm
      };
      
      setFacultyPerformance(performanceData);
      setError('');
    } catch (err) {
      setError('Failed to fetch faculty performance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Handle section click
  const handleSectionClick = async (section) => {
    try {
      setLoading(true);
      setSelectedForm(null);

      // Fetch forms for this section from backend
      const response = await department.getSectionForms(selectedFaculty._id, section.offeringId, section.section);

      // Store section info with response data
      setSelectedSection({
        ...section,
        courseCode: response.section.courseCode,
        courseName: response.section.courseName,
        fullSection: response.section.fullSection,
        totalStudents: response.section.totalStudents
      });
      setSectionForms(response.forms);
      setError('');
    } catch (err) {
      setError('Failed to fetch section forms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form click
  const handleFormClick = async (form) => {
    try {
      setLoading(true);
      setSelectedForm(form);

      // Fetch form responses with visualization from backend
      const response = await department.getFormResponsesVisualization(form._id);
      
      // Transform response to match expected format
      const analysis = {
        formTitle: response.form.title,
        section: response.form.targetSections.join(', '),
        totalStudents: response.summary.totalStudents,
        respondedCount: response.summary.respondedCount,
        responseRate: response.summary.responseRate,
        questionAnalysis: response.questionAnalysis.map(qa => {
          if (qa.type === 'rating') {
            return {
              question: qa.question,
              type: 'rating',
              avgRating: qa.avgRating,
              totalResponses: qa.totalResponses,
              distribution: qa.distribution
            };
          } else if (qa.type === 'multiple_choice') {
            return {
              question: qa.question,
              type: 'mcq',
              totalResponses: qa.totalResponses,
              distribution: qa.distribution
            };
          } else {
            return {
              question: qa.question,
              type: 'text',
              totalResponses: qa.totalResponses,
              responses: qa.responses
            };
          }
        })
      };
      
      setFormResponses(analysis);
      setError('');
    } catch (err) {
      setError('Failed to fetch form responses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Reset to faculty list
  const handleBackToFaculty = () => {
    setSelectedFaculty(null);
    setSelectedSection(null);
    setSelectedForm(null);
    setFacultyPerformance(null);
  };

  // Reset to sections list
  const handleBackToSections = () => {
    setSelectedSection(null);
    setSelectedForm(null);
  };

  // Reset to forms list
  const handleBackToForms = () => {
    setSelectedForm(null);
  };

  // Load course analytics
  const handleCourseAnalytics = async (courseName) => {
    try {
      setLoadingCourseAnalytics(true);
      setSelectedCourse(courseName);
      setSelectedFacultyForCourse('');
      setSelectedSectionForCourse('');
      setError('');

      const response = await feedbackService.getCourseAnalytics(courseName);
      setCourseAnalytics(response);
    } catch (err) {
      setError('Failed to load course analytics');
      console.error(err);
    } finally {
      setLoadingCourseAnalytics(false);
    }
  };

  // Handle faculty filter for course analytics
  const handleFacultyFilter = (facultyId) => {
    setSelectedFacultyForCourse(facultyId);
    // Filter the analytics data by faculty
    if (courseAnalytics && facultyId) {
      const filteredFaculty = courseAnalytics.faculty.find(f => f.facultyId === facultyId);
      if (filteredFaculty) {
        setCourseAnalytics(prev => ({
          ...prev,
          faculty: [filteredFaculty]
        }));
      }
    } else if (courseAnalytics) {
      // Reload full analytics if no faculty selected
      handleCourseAnalytics(selectedCourse);
    }
  };

  // Handle section filter for course analytics
  const handleSectionFilter = (sectionName) => {
    setSelectedSectionForCourse(sectionName);
    // This would require additional backend support for section-specific filtering
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
          📊 Department Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {department} Department - Faculty Performance Analytics
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Course Analytics View */}
      {selectedCourse && courseAnalytics && (
        <>
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={() => setSelectedCourse('')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Chip
              label={`Course Analytics: ${selectedCourse}`}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
          </Box>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Faculty</InputLabel>
                <Select
                  value={selectedFacultyForCourse}
                  onChange={(event) => handleFacultyFilter(event.target.value)}
                  label="Filter by Faculty"
                >
                  <MenuItem value="">
                    <em>All Faculty</em>
                  </MenuItem>
                  {courseAnalytics.faculty?.map((faculty) => (
                    <MenuItem key={faculty.facultyId} value={faculty.facultyId}>
                      {faculty.name} ({faculty.designation})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Section</InputLabel>
                <Select
                  value={selectedSectionForCourse}
                  onChange={(event) => handleSectionFilter(event.target.value)}
                  label="Filter by Section"
                >
                  <MenuItem value="">
                    <em>All Sections</em>
                  </MenuItem>
                  {/* This would need backend support for section-specific analytics */}
                  <MenuItem value="all" disabled>
                    Section filtering coming soon
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Course Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courseAnalytics.overall?.averageRating?.toFixed(1) || 'N/A'}
                  </Typography>
                  <Typography variant="body2">Course Average Rating</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courseAnalytics.overall?.totalResponses || 0}
                  </Typography>
                  <Typography variant="body2">Total Responses</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {courseAnalytics.faculty?.length || 0}
                  </Typography>
                  <Typography variant="body2">Faculty Members</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Faculty Performance in Course */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                👨‍🏫 Faculty Performance in {selectedCourse}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Faculty Name</strong></TableCell>
                      <TableCell><strong>Designation</strong></TableCell>
                      <TableCell><strong>Average Rating</strong></TableCell>
                      <TableCell><strong>Total Responses</strong></TableCell>
                      <TableCell><strong>Sections</strong></TableCell>
                      <TableCell><strong>Response Rate</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseAnalytics.faculty?.map((faculty) => (
                      <TableRow key={faculty.facultyId}>
                        <TableCell>{faculty.name}</TableCell>
                        <TableCell>{faculty.designation}</TableCell>
                        <TableCell>
                          <Chip
                            label={faculty.averageRating?.toFixed(1) || 'N/A'}
                            color={faculty.averageRating >= 4 ? 'success' : faculty.averageRating >= 3 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{faculty.totalResponses}</TableCell>
                        <TableCell>
                          {faculty.sections?.map((section, idx) => (
                            <Chip key={idx} label={section} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {faculty.totalResponses > 0 && faculty.averageRating ?
                              `${((faculty.totalResponses / (faculty.totalResponses / faculty.averageRating * 5)) * 100).toFixed(1)}%` :
                              'N/A'
                            }
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Rating Distribution Chart */}
          {courseAnalytics.overall?.ratingDistribution && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  📊 Overall Rating Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(courseAnalytics.overall.ratingDistribution).map(([rating, count]) => ({
                    rating: `${rating} Star${rating > 1 ? 's' : ''}`,
                    count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Faculty List View */}
      {!selectedFaculty && !selectedCourse && (
        <>
          {/* Course Analytics Overview */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📚 Course Analytics Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                View course-wise performance analytics with faculty and section filtering.
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleCourseAnalytics('All Courses')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  }
                }}
              >
                View Course Analytics
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Faculty Members ({facultyList.length})
              </Typography>
            <Grid container spacing={2}>
              {facultyList.map((faculty) => (
                <Grid item xs={12} sm={6} md={4} key={faculty._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(102,126,234,0.3)',
                      },
                    }}
                    onClick={() => handleFacultyClick(faculty)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: '#667eea',
                            width: 56,
                            height: 56,
                            mr: 2,
                          }}
                        >
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {faculty.firstName} {faculty.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {faculty.universityId}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={faculty.email}
                        size="small"
                        sx={{ mb: 1 }}
                        icon={<Person />}
                      />
                      {faculty.expertise && faculty.expertise.length > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Expertise: {faculty.expertise.join(', ')}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        </>
      )}

      {/* Faculty Performance View */}
      {selectedFaculty && !selectedSection && facultyPerformance && (
        <>
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={handleBackToFaculty} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Chip
              label={`${selectedFaculty.firstName} ${selectedFaculty.lastName}`}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
          </Box>

          {/* Overall Performance Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {Number.isFinite(facultyPerformance.overallRating) ? facultyPerformance.overallRating.toFixed(2) : 'N/A'}
                      </Typography>
                      <Typography variant="body2">Overall Rating</Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 50, opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {Number.isFinite(facultyPerformance.overallResponseRate) ? `${facultyPerformance.overallResponseRate.toFixed(1)}%` : 'N/A'}
                      </Typography>
                      <Typography variant="body2">Response Rate</Typography>
                    </Box>
                    <Group sx={{ fontSize: 50, opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {facultyPerformance.totalResponses}
                      </Typography>
                      <Typography variant="body2">Total Responses</Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 50, opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card
                sx={{
                  background: facultyPerformance.trend >= 0
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {Number.isFinite(facultyPerformance.trend)
                          ? `${facultyPerformance.trend >= 0 ? '+' : ''}${facultyPerformance.trend.toFixed(2)}`
                          : 'N/A'}
                       </Typography>
                      <Typography variant="body2">Performance Trend</Typography>
                    </Box>
                    {facultyPerformance.trend >= 0 ? (
                      <TrendingUp sx={{ fontSize: 50, opacity: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 50, opacity: 0.5 }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Performance Trend Chart */}
          {facultyPerformance.performanceByForm.length > 0 && (
            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  📈 Performance Trend Across Forms
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={facultyPerformance.performanceByForm}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="formTitle"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <RechartsTooltip
                      formatter={(value, name) => {
                        if (name === 'Average Rating') {
                          return [Number(value).toFixed(2), name];
                        }
                        return [Number(value).toFixed(1), name];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgRating"
                      stroke="#667eea"
                      strokeWidth={3}
                      name="Average Rating"
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="responseRate"
                      stroke="#f093fb"
                      strokeWidth={3}
                      name="Response Rate %"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Sections List */}
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                🎓 Sections Teaching ({facultyPerformance.sections.length})
              </Typography>
              <Grid container spacing={2}>
                {facultyPerformance.sections.map((section, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid #e0e0e0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#667eea',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(102,126,234,0.2)',
                        },
                      }}
                      onClick={() => handleSectionClick(section)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <School sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Section {section.fullSection || section.section}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {section.courseCode} - {section.courseName}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* Section Forms View */}
      {selectedSection && !selectedForm && (
        <>
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={handleBackToSections} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Chip
              label={`Section ${selectedSection.fullSection || selectedSection.section} - ${selectedSection.courseCode} ${selectedSection.courseName}`}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
          </Box>

          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📝 Feedback Forms ({sectionForms.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Form Title</strong></TableCell>
                      <TableCell><strong>Created Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Responses</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionForms.map((form) => (
                      <TableRow
                        key={form._id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f0f0f0' },
                        }}
                        onClick={() => handleFormClick(form)}
                      >
                        <TableCell>{form.title}</TableCell>
                        <TableCell>
                          {new Date(form.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={form.status === 'active' ? 'Active' : form.status || 'Inactive'}
                            color={form.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {form.responseCount} / {form.totalStudents} ({form.responseRate}%)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="View Analytics"
                            color="primary"
                            size="small"
                            icon={<BarChart />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Form Responses View */}
      {selectedForm && formResponses && (
        <>
          <Box sx={{ mb: 3 }}>
            <IconButton onClick={handleBackToForms} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Chip
              label={formResponses.formTitle}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
          </Box>

          {/* Response Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formResponses.respondedCount} / {formResponses.totalStudents}
                  </Typography>
                  <Typography variant="body2">Students Responded</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formResponses.responseRate}%
                  </Typography>
                  <Typography variant="body2">Response Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formResponses.totalStudents - formResponses.respondedCount}
                  </Typography>
                  <Typography variant="body2">Not Responded</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Question Analytics */}
          {formResponses.questionAnalysis.map((qa, index) => (
            <Card key={index} sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Q{index + 1}: {qa.question}
                </Typography>

                {qa.type === 'rating' && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#667eea', mr: 2 }}>
                        {qa.avgRating}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        / 5.0 ({qa.totalResponses} responses)
                      </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsBarChart data={qa.distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rating" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#667eea">
                          {qa.distribution.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {qa.type === 'mcq' && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Total Responses: {qa.totalResponses}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={qa.distribution}
                          dataKey="count"
                          nameKey="option"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.option}: ${entry.percentage}%`}
                        >
                          {qa.distribution.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}

                {qa.type === 'text' && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Total Responses: {qa.totalResponses}
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {qa.responses.map((response, i) => (
                        <Paper key={i} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="body2">"{response}"</Typography>
                        </Paper>
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Container>
  );
}
