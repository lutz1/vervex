import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import UserManagement from './pages/superadmin/UserManagement';
import LoadingPage from './pages/loading/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserRole } from './utils/firestore';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If user signed out, clear everything
      if (!currentUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // User is signed in
      setUser(currentUser);
      
      try {
        const role = await getUserRole(currentUser.uid);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Don't reset role on error - keep the previous role to avoid redirects
        // Only set to 'user' if we haven't fetched a role yet
        setUserRole((prevRole) => prevRole || 'user');
      }
      
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

  // Show loading page while initializing
  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<Login />} />

        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute user={user} loading={loading} requiredRole="superadmin" userRole={userRole}>
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
                      VERVEX - SUPERADMIN
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

                {/* SuperAdmin Content */}
                <Routes>
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="*" element={<Navigate to="/superadmin/users" replace />} />
                </Routes>
              </Box>
            </ProtectedRoute>
          }
        />

        {/* Home Route - Redirect based on role */}
        <Route
          path="/"
          element={
            user ? (
              userRole === 'superadmin' ? (
                <Navigate to="/superadmin/users" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
