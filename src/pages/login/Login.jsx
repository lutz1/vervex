import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserRole } from '../../utils/firestore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailIcon from '@mui/icons-material/Email';
import './Login.css';
import logo from '../../assets/logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role
      const role = await getUserRole(user.uid);
      
      console.log('Authentication successful, role:', role);
      
      // Redirect based on role
      if (role === 'superadmin') {
        navigate('/superadmin/users');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-bg">
      <Container component="main" maxWidth="sm">

        <Box className="login-container">
          {/* Main Card */}
          <Paper elevation={0} className="login-paper">
            {/* Header with Logo (moved inside card) */}
            <Box className="login-header">
              <img src={logo} alt="Vervex Logo" className="login-logo-img" />
              <Typography variant="subtitle1" className="luxury-tagline">
                Exclusive Access
              </Typography>
              {/* Centered Divider below tagline */}
              <Box className="gold-divider gold-divider-header" />
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" className="error-alert">
                {error}
              </Alert>
            )}

            {/* Title */}
            <Typography component="h1" variant="h5" className="login-title">
              SIGN IN
            </Typography>

            <Typography variant="body2" className="login-subtitle">
              Welcome back to luxury
            </Typography>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                className="luxury-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon className="input-icon" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                className="luxury-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon className="input-icon" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="luxury-button"
                disabled={loading}
              >
                {loading ? 'PROCESSING...' : 'SIGN IN'}
              </Button>
            </Box>

            {/* Divider */}
            <Box className="gold-divider-bottom" />
          </Paper>

          {/* Footer */}
          <Typography variant="caption" className="luxury-footer">
            © 2026 VERVEX. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
