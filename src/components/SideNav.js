import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider } from '@mui/material';
import { Home, AddCircle, Assessment, People, Settings, ExitToApp, Dashboard, Assignment, School, BarChart, Analytics, GroupAdd, History, Campaign } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    // Use replace to prevent back button issues
    navigate('/login', { replace: true });
  };

  const getMenuItems = () => {
    if (!user) return [];
    
    const role = user.role;
    const menus = {
      student: [
        { text: 'Dashboard', icon: <Home />, path: '/student' },
        { text: 'Feedback Forms', icon: <Assignment />, path: '/student/pending' },
        { text: 'Feedback History', icon: <History />, path: '/student/history' },
        { text: 'My Impact', icon: <Assessment />, path: '/student/impact' },
          { text: 'Announcements', icon: <Campaign />, path: '/student/announcements' },
      ],
      faculty: [
        { text: 'Dashboard', icon: <Home />, path: '/faculty' },
        { text: 'Manage Forms', icon: <Assignment />, path: '/faculty?view=forms' },
        { text: 'My Courses', icon: <School />, path: '/faculty/courses' },
        { text: 'Create Form', icon: <AddCircle />, path: '/faculty/create' },
        { text: 'View Analytics', icon: <Assessment />, path: '/faculty/analytics' },
          { text: 'Announcements', icon: <Campaign />, path: '/faculty/announcements' },
      ],
      department_admin: [
        { text: 'Dashboard', icon: <Dashboard />, path: '/department' },
          { text: 'Announcements', icon: <Campaign />, path: '/department/announcements' },
      ],
      system_admin: [
        { text: 'User Management', icon: <People />, path: '/admin/users' },
        { text: 'Bulk User Creation', icon: <GroupAdd />, path: '/admin/bulk-create' },
      ],
    };

    return menus[role] || [];
  };

  const menuItems = getMenuItems();

  if (!user) return null;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          Academic Feedback
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Portal
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

      <List sx={{ flexGrow: 1, pt: 2, px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname + location.search === item.path}
              sx={{
                borderRadius: 2,
                backgroundColor: location.pathname + location.search === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  transform: 'translateX(5px)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname + location.search === item.path ? 'bold' : 'normal' 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

      <List sx={{ px: 2, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              my: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'translateX(5px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
