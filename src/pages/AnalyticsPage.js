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
  LinearProgress
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
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

const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

const formatDateLabel = (dateString) => {
  if (!dateString || dateString === 'Unknown') return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function AnalyticsPage() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [responseVisibilityMessage, setResponseVisibilityMessage] = useState('');

  useEffect(() => {
    loadFeedbackForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      loadFormAnalytics(selectedForm);
    }
  }, [selectedForm]);

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

  const loadFormAnalytics = async (formId) => {
    try {
      setLoadingCharts(true);
      setError(null);
      setResponseVisibilityMessage('');

      const [analyticsData, responsesData] = await Promise.all([
        feedbackService.getFeedbackAnalytics(formId),
        feedbackService.getFeedbackResponses(formId).catch((err) => {
          console.warn('Unable to load detailed responses:', err);
          const message = err?.message || 'Unable to load responses.';
          if (message.toLowerCase().includes('visible') || message.toLowerCase().includes('authorize')) {
            setResponseVisibilityMessage('Individual responses are hidden until they are released by the department.');
            return [];
          }
          setResponseVisibilityMessage('Detailed responses are unavailable at the moment.');
          return [];
        })
      ]);

      setAnalytics(analyticsData);
      setResponses(responsesData || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoadingCharts(false);
    }
  };

  const selectedFormData = useMemo(
    () => forms.find((form) => form._id === selectedForm),
    [forms, selectedForm]
  );

  const ratingQuestions = useMemo(
    () => analytics?.questionAnalytics?.filter((q) => q.type === 'rating') || [],
    [analytics]
  );

  const questionAverages = useMemo(
    () => ratingQuestions.map((q, idx) => ({
      question: `Q${idx + 1}`,
      average: Number(q.average || 0)
    })),
    [ratingQuestions]
  );

  const distributionData = useMemo(() => {
    if (!ratingQuestions.length) return [];
    const buckets = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      label: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: ratingQuestions.reduce((total, question) => {
        const distribution = question.distribution || {};
        return total + (Number(distribution[rating]) || 0);
      }, 0)
    }));
    return buckets.filter((bucket) => bucket.count > 0);
  }, [ratingQuestions]);

  const trendData = useMemo(() => {
    if (!responses.length) return [];
    const dailyMap = new Map();

    responses.forEach((response) => {
      const submissionDate = response?.metadata?.submissionDate
        ? new Date(response.metadata.submissionDate).toISOString().slice(0, 10)
        : 'Unknown';

      const ratings = (response.responses || [])
        .map((ans) => ans.rating)
        .filter((value) => typeof value === 'number');

      const entry = dailyMap.get(submissionDate) || {
        date: submissionDate,
        responses: 0,
        ratingSum: 0,
        ratingCount: 0
      };

      entry.responses += 1;

      if (ratings.length > 0) {
        entry.ratingSum += ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        entry.ratingCount += 1;
      }

      dailyMap.set(submissionDate, entry);
    });

    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        date: item.date,
        responses: item.responses,
        averageRating: item.ratingCount > 0 ? Number((item.ratingSum / item.ratingCount).toFixed(2)) : 0
      }));
  }, [responses]);

  const sectionData = useMemo(() => {
    if (!selectedFormData) return [];

    const sectionCounts = new Map();
    responses.forEach((response) => {
      const sectionInfo = response?.studentId?.academicInfo;
      const section = sectionInfo?.section || sectionInfo?.fullSection || sectionInfo?.classSection || 'Unknown';
      sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
    });

    if (sectionCounts.size === 0 && Array.isArray(selectedFormData.targetSections)) {
      selectedFormData.targetSections.forEach((section) => {
        sectionCounts.set(section, 0);
      });
    }

    return Array.from(sectionCounts.entries()).map(([section, count]) => ({
      section,
      responses: count
    }));
  }, [responses, selectedFormData]);

  const totalResponses = analytics?.totalResponses || 0;
  const responseRateRaw = analytics?.responseRate;
  const responseRateValue = responseRateRaw !== undefined && responseRateRaw !== null ? Number(responseRateRaw) : null;
  const responseRateLabel = Number.isFinite(responseRateValue) ? `${responseRateValue.toFixed(1)}%` : 'N/A';
  const derivedAverageRating = ratingQuestions.length
    ? Number(
        (
          ratingQuestions.reduce((sum, question) => sum + Number(question.average || 0), 0) /
          ratingQuestions.length
        ).toFixed(2)
      )
    : null;
  const estimatedTotalStudents = responseRateValue && responseRateValue > 0
    ? Math.round(totalResponses / (responseRateValue / 100))
    : null;
  const pendingResponses = estimatedTotalStudents !== null
    ? Math.max(estimatedTotalStudents - totalResponses, 0)
    : null;

  const hasResponses = totalResponses > 0;

  if (loadingForms) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Assessment sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea' }}>
          Feedback Analytics
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {forms.length === 0 ? (
        <Alert severity="info">
          No feedback forms available. Create a feedback form to see analytics.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
          </Grid>

          {loadingCharts && <LinearProgress sx={{ mb: 3 }} />}

          {selectedFormData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: 3
                }}>
                  <CardContent>
                    <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {totalResponses}
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
                    <Assessment sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {derivedAverageRating !== null ? derivedAverageRating : 'N/A'}
                    </Typography>
                    <Typography variant="body1">Average Rating</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  color: '#333',
                  borderRadius: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Response Rate
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4facfe' }}>
                      {responseRateLabel}
                    </Typography>
                    <Typography variant="body2">
                      {selectedFormData.targetSections?.join(', ') || 'No sections assigned'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {estimatedTotalStudents !== null && (
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {estimatedTotalStudents}
                      </Typography>
                      <Typography variant="body1">Students Targeted</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {pendingResponses !== null && (
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                    color: '#333',
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {pendingResponses}
                      </Typography>
                      <Typography variant="body1">Responses Pending</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3, mt: 1 }}>
                  <Tabs
                    value={tabValue}
                    onChange={(event, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab icon={<BarChartIcon />} iconPosition="start" label="Question Analysis" />
                    <Tab icon={<TrendingUp />} iconPosition="start" label="Trend Analysis" />
                    <Tab icon={<PieChartIcon />} iconPosition="start" label="Response Distribution" />
                    <Tab icon={<Assessment />} iconPosition="start" label="Section-wise" />
                  </Tabs>

                  <CardContent sx={{ p: 4 }}>
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
                                <XAxis dataKey="question" />
                                <YAxis domain={[0, 5]} tickCount={6} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="average" fill="#667eea" radius={[8, 8, 0, 0]} name="Average Rating" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        ) : (
                          <Alert severity="warning">
                            No rating question responses available yet. Please wait for students to submit feedback.
                          </Alert>
                        )}
                      </Box>
                    )}

                    {tabValue === 1 && (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#764ba2' }}>
                          Response Trends Over Time
                        </Typography>
                        {trendData.length ? (
                          <Box sx={{ height: 340 }}>
                            <ResponsiveContainer>
                              <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                                <YAxis yAxisId="left" orientation="left" allowDecimals domain={[0, 'auto']} />
                                <YAxis yAxisId="right" orientation="right" allowDecimals domain={[0, 5]} />
                                <RechartsTooltip
                                  formatter={(value, name) => {
                                    if (name === 'responses') return [value, 'Responses'];
                                    return [value, 'Average Rating'];
                                  }}
                                  labelFormatter={(label) => formatDateLabel(label)}
                                />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="responses"
                                  stroke="#667eea"
                                  strokeWidth={3}
                                  yAxisId="left"
                                  name="Responses"
                                  dot
                                />
                                <Line
                                  type="monotone"
                                  dataKey="averageRating"
                                  stroke="#f093fb"
                                  strokeWidth={3}
                                  yAxisId="right"
                                  name="Average Rating"
                                  dot
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>
                        ) : (
                          <Alert severity="info">
                            Trend analytics will appear once students start submitting responses.
                          </Alert>
                        )}
                      </Box>
                    )}

                    {tabValue === 2 && (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#f5576c' }}>
                          Overall Response Distribution
                        </Typography>
                        {distributionData.length ? (
                          <Box sx={{ height: 340, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="60%">
                              <PieChart>
                                <Pie data={distributionData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={110} label>
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
                          <Alert severity="warning">
                            Rating responses are not available yet. Encourage students to submit their feedback.
                          </Alert>
                        )}
                      </Box>
                    )}

                    {tabValue === 3 && (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#38f9d7' }}>
                          Section-wise Response Overview
                        </Typography>
                        {sectionData.length ? (
                          <Box sx={{ height: 340 }}>
                            <ResponsiveContainer>
                              <BarChart data={sectionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="section" />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="responses" fill="#43e97b" radius={[8, 8, 0, 0]} name="Responses" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        ) : (
                          <Alert severity="info">
                            Section-wise analytics will appear once detailed responses are available.
                          </Alert>
                        )}

                        {responseVisibilityMessage && (
                          <Alert severity="info" sx={{ mt: 3 }}>
                            {responseVisibilityMessage}
                          </Alert>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {analytics?.questionAnalytics?.length ? (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                      Detailed Question Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      {analytics.questionAnalytics.map((question, index) => (
                        <Grid item xs={12} key={question.questionId || index}>
                          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Q{index + 1}: {question.questionText}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip label={`Type: ${question.type}`} size="small" />
                              <Chip label={`Responses: ${question.totalResponses || 0}`} color="primary" size="small" />
                              {question.type === 'rating' && (
                                <Chip
                                  label={`Average: ${question.average?.toFixed?.(2) || question.average || 'N/A'} / 5`}
                                  color="success"
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Card>
                </Grid>
              ) : (
                !loadingCharts && (
                  <Grid item xs={12}>
                    <Alert severity="info">No analytics available for this form yet.</Alert>
                  </Grid>
                )
              )}

              {!hasResponses && !loadingCharts && (
                <Grid item xs={12}>
                  <Alert severity="info">No student responses recorded for this form so far.</Alert>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
