import React, { useState, useEffect } from 'react';
import { Container, Box, TextField, Button, Typography, Link, Card, CardContent, Avatar, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { School, LockOpen } from '@mui/icons-material';
import { authService } from '../services/api';

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [cpEmail, setCpEmail] = useState('');
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [cpSuccess, setCpSuccess] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const roleMap = {
        'student': '/student',
        'faculty': '/faculty',
        'department_admin': '/department',
        'system_admin': '/admin'
      };
      navigate(roleMap[user.role] || '/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Navigate based on user role
        const roleMap = {
          'student': '/student',
          'faculty': '/faculty',
          'department_admin': '/department',
          'system_admin': '/admin'
        };
        navigate(roleMap[result.data.role] || '/', { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Container maxWidth="sm">
        <Card sx={{ 
          borderRadius: 4, 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, backgroundColor: 'white', color: '#667eea' }}>
              <School sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Academic Feedback
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Continuous Improvement Platform
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleLogin}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField 
                label="Email Address" 
                fullWidth 
                margin="normal" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <TextField 
                label="Password" 
                type="password" 
                fullWidth 
                margin="normal" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setShowChange((s) => !s);
                    // reset messages
                    setCpError('');
                    setCpSuccess('');
                    setCpEmail(email);
                  }}
                  sx={{ color: '#667eea', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {showChange ? 'Cancel Change Password' : 'Change Password'}
                </Link>
              </Box>

              {showChange && (
                <Box sx={{ mb: 2, p: 2, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: '600' }}>Change Password</Typography>
                  {cpError && <Alert severity="error" sx={{ mb: 1 }}>{cpError}</Alert>}
                  {cpSuccess && <Alert severity="success" sx={{ mb: 1 }}>{cpSuccess}</Alert>}

                  <TextField
                    label="Email Address"
                    fullWidth
                    margin="dense"
                    type="email"
                    value={cpEmail}
                    onChange={(e) => setCpEmail(e.target.value)}
                    required
                    disabled={cpLoading}
                  />

                  <TextField
                    label="Current Password"
                    type="password"
                    fullWidth
                    margin="dense"
                    value={cpCurrent}
                    onChange={(e) => setCpCurrent(e.target.value)}
                    required
                    disabled={cpLoading}
                  />

                  <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    margin="dense"
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    required
                    disabled={cpLoading}
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    margin="dense"
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    required
                    disabled={cpLoading}
                  />

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={async () => {
                      setCpError('');
                      setCpSuccess('');
                      if (!cpEmail || !cpCurrent || !cpNew || !cpConfirm) {
                        setCpError('Please fill all fields');
                        return;
                      }
                      if (cpNew !== cpConfirm) {
                        setCpError('New password and confirmation do not match');
                        return;
                      }
                      if (cpNew.length < 6) {
                        setCpError('New password must be at least 6 characters long');
                        return;
                      }

                      setCpLoading(true);
                      try {
                        // First authenticate user to get token
                        const loginRes = await login(cpEmail, cpCurrent);
                        if (!loginRes.success) {
                          setCpError(loginRes.error || 'Authentication failed with current password');
                          setCpLoading(false);
                          return;
                        }

                        const loggedUser = loginRes.data;
                        // Disallow system_admin
                        if (loggedUser.role === 'system_admin') {
                          setCpError('Change password from UI is not allowed for system administrators');
                          // Log out the admin session we just created locally
                          logout();
                          setCpLoading(false);
                          return;
                        }

                        // Call protected endpoint to change password
                        await authService.changePassword(cpCurrent, cpNew);
                        setCpSuccess('Password changed successfully. Please login with your new password.');
                        // clear local session to force re-login
                        logout();
                        setShowChange(false);
                      } catch (err) {
                        setCpError(err.message || 'Failed to change password');
                      } finally {
                        setCpLoading(false);
                      }
                    }}
                    disabled={cpLoading}
                  >
                    {cpLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              )}

              <Button 
                type="submit"
                variant="contained" 
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOpen />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Logging in...' : 'Login to Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
