import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Chip,
  Button,
  LinearProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  BarChart as BarChartIcon,
  Timeline,
  FilterList,
  School,
  RateReview
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { feedbackService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

const formatDateLabel = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FacultyAnalyticsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [trendsTabValue, setTrendsTabValue] = useState(0);

  useEffect(() => {
    loadFeedbackForms();
    loadTrendsData();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      loadFormAnalytics(selectedForm, selectedSection);
    }
  }, [selectedForm, selectedSection]);

  const loadFeedbackForms = async () => {
    try {
      setLoadingForms(true);
      setError(null);
      const data = await feedbackService.getFeedbackForms();
      setForms(data || []);
      if (data && data.length > 0) {
        setSelectedForm(data[0]._id);
      }
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(err.message || 'Failed to load feedback forms');
    } finally {
      setLoadingForms(false);
    }
  };

  const loadFormAnalytics = async (formId, section = '') => {
    try {
      setLoadingAnalytics(true);
      setError(null);

      console.log('📊 Loading form analytics:', { formId, section, facultyId: user._id });

      const params = {};
      if (section) {
        params.section = section;
      }

      const response = await feedbackService.getFacultyFormAnalytics(user._id, formId, params);
      console.log('📊 Analytics received:', response);
      console.log('  - Total Responses:', response?.summary?.totalResponses);
      console.log('  - Question Analysis:', response?.questionAnalysis?.length);
      console.log('  - Section Filter:', response?.sectionFilter);
      
      setAnalytics(response);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadTrendsData = async () => {
    try {
      setLoadingTrends(true);
      const response = await feedbackService.getFacultyPerformanceTrends(user._id);
      setTrends(response);
    } catch (err) {
      console.error('Error loading trends:', err);
      setError(err.message || 'Failed to load performance trends');
    } finally {
      setLoadingTrends(false);
    }
  };

  const selectedFormData = useMemo(
    () => forms.find((form) => form._id === selectedForm),
    [forms, selectedForm]
  );

  const availableSections = useMemo(() => {
    if (!selectedFormData) return [];
    return selectedFormData.targetSections || [];
  }, [selectedFormData]);

  const ratingQuestions = useMemo(
    () => analytics?.questionAnalysis?.filter((q) => q.type === 'rating') || [],
    [analytics]
  );

  const questionAverages = useMemo(
    () => ratingQuestions.map((q, idx) => ({
      question: `Q${idx + 1}`,
      average: Number(q.avgRating || 0),
      questionText: q.question
    })),
    [ratingQuestions]
  );

  const distributionData = useMemo(() => {
    if (!ratingQuestions.length) return [];
    
    // Aggregate distribution from all rating questions
    const aggregated = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratingQuestions.forEach(q => {
      if (q.distribution && Array.isArray(q.distribution)) {
        q.distribution.forEach(item => {
          // Extract the rating number from "1 Star", "2 Stars", etc.
          const ratingMatch = item.rating?.match(/^(\d+)/);
          if (ratingMatch) {
            const rating = parseInt(ratingMatch[1]);
            if (rating >= 1 && rating <= 5) {
              aggregated[rating] += item.count || 0;
            }
          }
        });
      }
    });

    // Convert to array format for chart
    return Object.entries(aggregated)
      .map(([rating, count]) => ({
        rating: `${rating} Star${rating > 1 ? 's' : ''}`,
        count,
        percentage: 0 // Will calculate after we have total
      }))
      .map((item, _, arr) => {
        const total = arr.reduce((sum, i) => sum + i.count, 0);
        return {
          ...item,
          percentage: total > 0 ? parseFloat(((item.count / total) * 100).toFixed(1)) : 0
        };
      })
      .filter(item => item.count > 0); // Only show ratings that have responses
  }, [ratingQuestions]);

  const trendsData = useMemo(() => {
    if (!trends?.trends) return [];

    return trends.trends.map((item, index) => ({
      ...item,
      date: formatDateLabel(item.createdAt),
      index: index + 1,
      formTypeLabel: item.formType ? item.formType.replace('_', ' ').toUpperCase() : 'General'
    }));
  }, [trends]);

  const trendsByFormType = useMemo(() => {
    if (!trendsData.length) return {};

    const grouped = {};
    trendsData.forEach(item => {
      const type = item.formType || 'general';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(item);
    });

    return grouped;
  }, [trendsData]);

  if (loadingForms) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Faculty Analytics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Assessment sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
          Faculty Analytics Dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Trends Overview */}
      {trends && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {trends.trends?.length || 0}
                </Typography>
                <Typography variant="body2">Total Feedback Forms</Typography>
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
                <RateReview sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {trends.trends?.reduce((sum, t) => sum + (t.totalResponses || 0), 0) || 0}
                </Typography>
                <Typography variant="body2">Total Responses</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <Assessment sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {trends.trends?.length ?
                    (trends.trends.reduce((sum, t) => sum + (t.avgRating || 0), 0) / trends.trends.length).toFixed(1)
                    : 'N/A'
                  }
                </Typography>
                <Typography variant="body2">Average Rating</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Form Analytics Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📊 Form-wise Response Analytics
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Feedback Form</InputLabel>
                    <Select
                      value={selectedForm}
                      onChange={(event) => setSelectedForm(event.target.value)}
                      label="Select Feedback Form"
                    >
                      {forms.map((form) => (
                        <MenuItem key={form._id} value={form._id}>
                          {form.title} - {form.courseName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {availableSections.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Filter by Section (Optional)</InputLabel>
                      <Select
                        value={selectedSection}
                        onChange={(event) => setSelectedSection(event.target.value)}
                        label="Filter by Section (Optional)"
                      >
                        <MenuItem value="">
                          <em>All Sections</em>
                        </MenuItem>
                        {availableSections.map((section) => (
                          <MenuItem key={section} value={section}>
                            Section {section}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              {loadingAnalytics && <LinearProgress sx={{ mb: 3 }} />}

              {analytics && (
                <>
                  {/* Summary Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                          {analytics.summary?.totalResponses || 0}
                        </Typography>
                        <Typography variant="body2">Total Responses</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f093fb' }}>
                          {analytics.summary?.overallAvgRating?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Typography variant="body2">Average Rating</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4facfe' }}>
                          {analytics.summary?.responseRate ? `${analytics.summary.responseRate}%` : 'N/A'}
                        </Typography>
                        <Typography variant="body2">Response Rate</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Tabs
                    value={tabValue}
                    onChange={(event, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab icon={<BarChartIcon />} iconPosition="start" label="Question Analysis" />
                    <Tab icon={<PieChart />} iconPosition="start" label="Rating Distribution" />
                  </Tabs>

                  {tabValue === 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#667eea' }}>
                        Question-wise Average Ratings
                      </Typography>
                      {questionAverages.length ? (
                        <Box sx={{ height: 340 }}>
                          <ResponsiveContainer>
                            <BarChart data={questionAverages}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="question"
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis domain={[0, 5]} tickCount={6} />
                              <RechartsTooltip
                                formatter={(value, name) => [value, 'Average Rating']}
                                labelFormatter={(label) => {
                                  const question = questionAverages.find(q => q.question === label);
                                  return question ? question.questionText : label;
                                }}
                              />
                              <Legend />
                              <Bar dataKey="average" fill="#667eea" radius={[8, 8, 0, 0]} name="Average Rating" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No rating questions available for analysis.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {tabValue === 1 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#f5576c' }}>
                        Overall Rating Distribution
                      </Typography>
                      {distributionData.length ? (
                        <Box sx={{ height: 340, display: 'flex', justifyContent: 'center' }}>
                          <ResponsiveContainer width="60%">
                            <PieChart>
                              <Pie
                                data={distributionData}
                                dataKey="count"
                                nameKey="rating"
                                cx="50%"
                                cy="50%"
                                outerRadius={110}
                                label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                              >
                                {distributionData.map((entry, index) => (
                                  <Cell key={entry.rating} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          Rating distribution data not available.
                        </Alert>
                      )}
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trends Section */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📈 Performance Trends
              </Typography>

              {loadingTrends ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }}>Loading trends...</Typography>
                </Box>
              ) : trendsData.length > 0 ? (
                <>
                  <Tabs
                    value={trendsTabValue}
                    onChange={(event, newValue) => setTrendsTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Tab label="Timeline" />
                    <Tab label="By Type" />
                  </Tabs>

                  {trendsTabValue === 0 && (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={trendsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis domain={[0, 5]} />
                          <RechartsTooltip
                            formatter={(value, name) => [Number(value).toFixed(2), 'Average Rating']}
                            labelFormatter={(label) => `Form ${trendsData.find(t => formatDateLabel(t.createdAt) === label)?.index || ''}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="avgRating"
                            stroke="#667eea"
                            strokeWidth={3}
                            name="Average Rating"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {trendsTabValue === 1 && (
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {Object.entries(trendsByFormType).map(([type, items]) => (
                        <Box key={type} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
                            {type.replace('_', ' ').toUpperCase()} Forms
                          </Typography>
                          {items.map((item, idx) => (
                            <Paper key={idx} sx={{ p: 1, mb: 1, bgcolor: '#f9f9f9' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {item.formTitle}
                                </Typography>
                                <Chip
                                  label={item.avgRating?.toFixed(1) || 'N/A'}
                                  size="small"
                                  color={item.avgRating >= 4 ? 'success' : item.avgRating >= 3 ? 'warning' : 'error'}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateLabel(item.createdAt)} • {item.totalResponses} responses
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  No performance trend data available yet. Trends will appear as you receive more feedback.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Privacy Notice */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Privacy Notice:</strong> All analytics shown are aggregated data only.
          Individual student responses are not visible to maintain academic integrity and privacy.
        </Typography>
      </Alert>
    </Container>
  );
}
