import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* AppBar */}
                <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #1a5f3f 0%, #0f1419 100%)' }}>
                  <Toolbar>
                    <Typography
                      variant="h6"
                      sx={{
                        flexGrow: 1,
                        fontWeight: 900,
                        letterSpacing: '3px',
                        background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      VERVEX
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mr: 2,
                        color: '#d4af37',
                      }}
                    >
                      {user?.email}
                    </Typography>
                    <Button
                      color="inherit"
                      onClick={handleLogout}
                      sx={{
                        color: '#d4af37',
                        fontWeight: 700,
                        '&:hover': {
                          background: 'rgba(212, 175, 55, 0.1)',
                        },
                      }}
                    >
                      LOGOUT
                    </Button>
                  </Toolbar>
                </AppBar>

                {/* Dashboard Content */}
                <Dashboard user={user} />
              </Box>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
