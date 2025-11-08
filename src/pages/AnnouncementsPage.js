import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Button
} from '@mui/material';
import {
  Campaign,
  CheckCircle,
  PriorityHigh,
  Schedule,
  School
} from '@mui/icons-material';
import { announcementService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements({ status: 'active' });
      setAnnouncements(data);
    } catch (err) {
      // Normalize connection errors
      const msg = (err?.message || '').toLowerCase().includes('failed to fetch')
        ? 'Cannot reach the server. Please make sure the backend is running on http://localhost:5000.'
        : (err.message || 'Failed to load announcements');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await announcementService.acknowledgeAnnouncement(id);
      loadAnnouncements(); // Reload to show updated state
    } catch (err) {
      console.error('Error acknowledging announcement:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'improvement_action': return 'Improvement Action';
      case 'acknowledgment': return 'Acknowledgment';
      case 'general_announcement': return 'General';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: '#666' }}>
          Loading Announcements...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Campaign sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            Announcements & Improvements
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Faculty and department updates on continuous improvement actions based on your feedback
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <Button size="small" variant="outlined" color="inherit" onClick={loadAnnouncements}>
            Retry
          </Button>
        </Alert>
      )}

      {announcements.length === 0 ? (
        <Alert severity="info">
          No announcements available at the moment.
        </Alert>
      ) : (
        <Box>
          {announcements.map((announcement) => (
            <Card 
              key={announcement._id} 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getPriorityColor(announcement.priority)}`
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={getTypeLabel(announcement.type)}
                        size="small"
                        sx={{ 
                          bgcolor: '#e3f2fd',
                          fontWeight: 'bold'
                        }}
                      />
                      <Chip 
                        label={announcement.priority.toUpperCase()}
                        size="small"
                        icon={<PriorityHigh />}
                        sx={{ 
                          bgcolor: getPriorityColor(announcement.priority),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      {announcement.targetSections && announcement.targetSections.length > 0 && (
                        <Chip 
                          label={`Section: ${announcement.targetSections.join(', ')}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {announcement.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 500 }}>
                      By {announcement.createdBy.name}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {announcement.message}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <School sx={{ fontSize: 20, color: '#667eea' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {announcement.createdBy.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({announcement.createdBy.role.replace('_', ' ')})
                      </Typography>
                    </Box>
                    {announcement.courseName && (
                      <Typography variant="caption" color="text.secondary">
                        Course: {announcement.courseName}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Schedule sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => handleAcknowledge(announcement._id)}
                    disabled={announcement.acknowledgments?.some(ack => String(ack.userId) === String(user?._id))}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:disabled': {
                        background: '#e0e0e0',
                        color: '#999'
                      }
                    }}
                  >
                    {announcement.acknowledgments?.some(ack => String(ack.userId) === String(user?._id)) 
                      ? 'Acknowledged' 
                      : 'Acknowledge'
                    }
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
