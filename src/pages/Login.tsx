import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Security,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      setError('Failed to log in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 4,
                color: 'white',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: 'white',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                }}
              >
                <Business 
                  sx={{ 
                    fontSize: 40, 
                    color: '#10B981' 
                  }} 
                />
              </Box>
              <Typography 
                component="h1" 
                variant="h3" 
                gutterBottom
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
              >
                Umma Visitors
              </Typography>
              <Typography 
                variant="h6" 
                sx={{
                  opacity: 0.9,
                  fontWeight: 500,
                }}
              >
                Visitor Management System
              </Typography>
            </Box>

            {/* Login Card */}
            <Paper
              elevation={8}
              sx={{
                padding: 4,
                width: '100%',
                borderRadius: 3,
                background: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Welcome Section */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography 
                  component="h2" 
                  variant="h4" 
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: '#1F2937',
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Sign in to manage your visitors
                </Typography>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontWeight: 500,
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                {/* Email Field */}
                <TextField
                  fullWidth
                  required
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#F9FAFB',
                      '&:hover fieldset': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#10B981',
                    },
                  }}
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  required
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          disabled={loading}
                          sx={{ color: '#6B7280' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#F9FAFB',
                      '&:hover fieldset': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#10B981',
                    },
                  }}
                />

                {/* Login Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    backgroundColor: '#10B981',
                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      backgroundColor: '#059669',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      backgroundColor: '#6EE7B7',
                      transform: 'none',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    <>
                      Sign In
                      <Box component="span" sx={{ ml: 1, fontSize: '1.2rem' }}>
                        →
                      </Box>
                    </>
                  )}
                </Button>

                {/* Forgot Password */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="text"
                    sx={{
                      textTransform: 'none',
                      color: '#6B7280',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#10B981',
                      },
                    }}
                  >
                    Forgot your password?
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Security Footer */}
            <Paper
              elevation={1}
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#F0FDF4',
                border: '1px solid #D1FAE5',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Security sx={{ color: '#059669', fontSize: 20, mr: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#059669',
                    fontWeight: 600,
                  }}
                >
                  Secure Visitor Management
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#10B981',
                  fontWeight: 500,
                }}
              >
                Your data is protected and encrypted
              </Typography>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;