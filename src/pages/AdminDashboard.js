import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Button, Box, Avatar, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, Alert, Snackbar, CircularProgress,
  TablePagination, InputAdornment, Tooltip
} from '@mui/material';
import { 
  School, Settings, People, Dashboard, Edit, Delete, Add, Search,
  PersonAdd, Block, CheckCircle, Refresh
} from '@mui/icons-material';
import api from '../services/api';

export default function AdminDashboard({ view = 'default' }) {
  // State for user management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Load users when in users view
  useEffect(() => {
    if (view === 'users') {
      loadUsers();
    }
  }, [view]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.users.getUsers();
      // Backend returns { users: [...], total: X, ... }
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.personalInfo?.firstName || '',
      lastName: user.personalInfo?.lastName || '',
      email: user.email || '',
      role: user.role || '',
      department: user.academicInfo?.department || user.academicInfo?.facultyDepartment || user.academicInfo?.managedDepartment || '',
      designation: user.academicInfo?.designation || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {
        personalInfo: {
          ...selectedUser.personalInfo,
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
        },
        email: editFormData.email,
        academicInfo: {
          ...selectedUser.academicInfo,
        }
      };

      // Update role-specific fields
      if (selectedUser.role === 'student') {
        updateData.academicInfo.department = editFormData.department;
      } else if (selectedUser.role === 'faculty') {
        updateData.academicInfo.facultyDepartment = editFormData.department;
        updateData.academicInfo.designation = editFormData.designation;
      } else if (selectedUser.role === 'department_admin') {
        updateData.academicInfo.managedDepartment = editFormData.department;
      }

      await api.users.updateUser(selectedUser._id, updateData);
      setSuccess('User updated successfully!');
      setEditDialogOpen(false);
      loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.users.deleteUser(selectedUser._id);
      setSuccess('User deleted successfully!');
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      await api.users.toggleUserStatus(userId);
      setSuccess('User status updated successfully!');
      loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.universityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    const colors = {
      student: 'primary',
      faculty: 'secondary',
      department_admin: 'warning',
      system_admin: 'error'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      student: 'Student',
      faculty: 'Faculty',
      department_admin: 'Dept Admin',
      system_admin: 'System Admin'
    };
    return labels[role] || role;
  };

  // Default welcome view
  if (view === 'default') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Avatar sx={{ 
            width: 120, 
            height: 120, 
            mx: 'auto', 
            mb: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          }}>
            <School sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            mb: 2 
          }}>
            Welcome, Administrator!
          </Typography>
          <Typography variant="h5" sx={{ color: '#666', mb: 4, fontWeight: 300 }}>
            Manage system settings and user access
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            <Grid item xs={12} md={6}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Dashboard sx={{ fontSize: 48, mb: 1, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>System Health</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>OK</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <People sx={{ fontSize: 48, mb: 1, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Users</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>150+</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="body1" sx={{ mt: 6, color: '#999', fontStyle: 'italic' }}>
            👈 Use the side navigation to manage system settings
          </Typography>
        </Box>
      </Container>
    );
  }

  // Overview view
  if (view === 'overview') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          System Overview
        </Typography>
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>System Status</Typography>
            <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 3 }}>
              ✓ All systems operational
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Last updated: {new Date().toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // User Management view
  if (view === 'users') {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          User Management
        </Typography>

        {/* Snackbar for success/error messages */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
              <TextField
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Filter by Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                  <MenuItem value="department_admin">Dept Admin</MenuItem>
                  <MenuItem value="system_admin">System Admin</MenuItem>
                </Select>
              </FormControl>

              <Tooltip title="Refresh user list">
                <IconButton 
                  onClick={loadUsers}
                  disabled={loading}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            {loading && !users.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>University ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="textSecondary">
                              No users found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((user) => (
                            <TableRow key={user._id} hover>
                              <TableCell>{user.universityId}</TableCell>
                              <TableCell>
                                {user.personalInfo?.firstName} {user.personalInfo?.lastName}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={getRoleLabel(user.role)} 
                                  color={getRoleColor(user.role)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {user.academicInfo?.department || 
                                 user.academicInfo?.facultyDepartment || 
                                 user.academicInfo?.managedDepartment || 
                                 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={user.isActive ? 'Active' : 'Inactive'}
                                  color={user.isActive ? 'success' : 'default'}
                                  size="small"
                                  icon={user.isActive ? <CheckCircle /> : <Block />}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Edit user">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleEditClick(user)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={user.isActive ? "Deactivate user" : "Activate user"}>
                                  <IconButton 
                                    size="small" 
                                    color="warning"
                                    onClick={() => handleToggleStatus(user._id)}
                                  >
                                    {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete user">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteClick(user)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="First Name"
                value={editFormData.firstName || ''}
                onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                value={editFormData.lastName || ''}
                onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                fullWidth
                required
              />
              <TextField
                label="Email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                fullWidth
                required
              />
              <TextField
                label="Department"
                value={editFormData.department || ''}
                onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                fullWidth
              />
              {selectedUser?.role === 'faculty' && (
                <TextField
                  label="Designation"
                  value={editFormData.designation || ''}
                  onChange={(e) => setEditFormData({...editFormData, designation: e.target.value})}
                  fullWidth
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave} 
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user <strong>{selectedUser?.universityId}</strong> ({selectedUser?.personalInfo?.firstName} {selectedUser?.personalInfo?.lastName})?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone!
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Settings view
  if (view === 'settings') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#667eea' }}>
          System Settings
        </Typography>
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Configure System</Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              System settings and configuration options...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return null;
}
