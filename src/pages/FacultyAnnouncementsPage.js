import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import {
  Campaign,
  Add,
  Edit,
  Archive,
  CheckCircle,
  PriorityHigh,
  Schedule,
  People
} from '@mui/icons-material';
import { announcementService } from '../services/api';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import { useAuth } from '../context/AuthContext';

export default function FacultyAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase().includes('failed to fetch')
        ? 'Cannot reach the server. Please make sure the backend is running on http://localhost:5000.'
        : (err.message || 'Failed to load announcements');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (window.confirm('Are you sure you want to archive this announcement?')) {
      try {
        await announcementService.archiveAnnouncement(id);
        loadAnnouncements();
      } catch (err) {
        console.error('Error archiving announcement:', err);
      }
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Campaign sx={{ fontSize: 40, mr: 2, color: '#667eea' }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              My Announcements
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Create and manage improvement actions based on student feedback
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 3,
            py: 1.5
          }}
        >
          Create Announcement
        </Button>
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
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Campaign sx={{ fontSize: 80, color: '#ddd', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No announcements yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first announcement to communicate improvements to students
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setModalOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Create Announcement
          </Button>
        </Card>
      ) : (
        <Box>
          {announcements.map((announcement) => (
            <Card 
              key={announcement._id} 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getPriorityColor(announcement.priority)}`,
                opacity: announcement.status === 'archived' ? 0.6 : 1
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
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
                      {announcement.status === 'archived' && (
                        <Chip 
                          label="ARCHIVED"
                          size="small"
                          sx={{ bgcolor: '#757575', color: 'white' }}
                        />
                      )}
                      {announcement.targetSections && announcement.targetSections.length > 0 && (
                        <Chip 
                          label={`Sections: ${announcement.targetSections.join(', ')}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {announcement.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 500, mb: 1 }}>
                      By {announcement.createdBy.name}
                    </Typography>
                  </Box>
                  {announcement.status === 'active' && (
                    <IconButton 
                      onClick={() => handleArchive(announcement._id)}
                      sx={{ color: '#f44336' }}
                    >
                      <Archive />
                    </IconButton>
                  )}
                </Box>

                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {announcement.message}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {announcement.courseName && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
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

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People sx={{ fontSize: 20, color: '#666' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {announcement.acknowledgments?.length || 0} Acknowledgments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <CreateAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadAnnouncements}
      />
    </Container>
  );
}
