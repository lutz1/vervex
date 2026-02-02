import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ user, loading, children, requiredRole = null, userRole = null }) => {
  const [showGraceLoading, setShowGraceLoading] = useState(false);

  useEffect(() => {
    // If there's a role mismatch but we have a saved superadmin UID,
    // it means we're in the middle of re-authenticating
    if (requiredRole === 'superadmin' && userRole !== requiredRole && typeof window !== 'undefined') {
      const lastSuperAdminUid = localStorage.getItem('lastSuperAdminUid');
      
      // If the UID changed (session switched), show grace loading for a moment
      if (lastSuperAdminUid && user?.uid !== lastSuperAdminUid) {
        setShowGraceLoading(true);
        
        // Wait a moment to see if the session gets restored
        const timer = setTimeout(() => {
          setShowGraceLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, userRole, requiredRole]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress sx={{ color: '#d4af37' }} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific role is required
  if (requiredRole && userRole !== requiredRole) {
    // Special case: if trying to access superadmin route but role mismatch
    // and we're in the middle of creating a user (new user auto-login), 
    // check if there's a saved superadmin session
    if (requiredRole === 'superadmin' && typeof window !== 'undefined') {
      const lastSuperAdminUid = localStorage.getItem('lastSuperAdminUid');
      console.warn(`⚠️ Role mismatch. Required: ${requiredRole}, Got: ${userRole}`);
      
      // Show grace period loading if session was just switched
      if (lastSuperAdminUid && user?.uid !== lastSuperAdminUid && showGraceLoading) {
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ color: '#d4af37', mb: 2 }} />
              <div style={{ color: '#d4af37' }}>Re-authenticating...</div>
            </Box>
          </Box>
        );
      }
      
      // If the grace period has passed and we still don't have the right user, redirect
      if (lastSuperAdminUid && user?.uid !== lastSuperAdminUid) {
        return <Navigate to="/login" replace />;
      }
    }
    
    // Redirect to appropriate page based on role
    if (userRole === 'superadmin') {
      return <Navigate to="/superadmin/users" replace />;
    }
    if (userRole && ['vip', 'ambassador', 'supreme', 'company_account', 'admin', 'cashier'].includes(userRole)) {
      return <Navigate to="/member/genealogy" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
