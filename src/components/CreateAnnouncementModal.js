import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  OutlinedInput,
  Alert,
  CircularProgress
} from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { announcementService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateAnnouncementModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'improvement_action',
    priority: 'medium',
    targetSections: [],
    courseName: '',
    visibility: {
      students: true,
      faculty: false,
      // Ensure department admins can see all announcements by default
      departmentAdmin: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      targetSections: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await announcementService.createAnnouncement(formData);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'improvement_action',
        priority: 'medium',
        targetSections: [],
        courseName: '',
        visibility: {
          students: true,
          faculty: false,
          departmentAdmin: true
        }
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const sections = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Campaign sx={{ color: '#667eea' }} />
        Create Announcement
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Describe the improvement action or announcement..."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Type"
              >
                <MenuItem value="improvement_action">Improvement Action</MenuItem>
                <MenuItem value="acknowledgment">Acknowledgment</MenuItem>
                <MenuItem value="general_announcement">General Announcement</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
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
            >
              {sections.map((section) => (
                <MenuItem key={section} value={section}>
                  {section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {user?.role === 'faculty' && (
            <TextField
              fullWidth
              label="Course Name (Optional)"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              sx={{ mb: 2 }}
              placeholder="e.g., Data Structures"
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Announcement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
