import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import UserManagement from './pages/superadmin/UserManagement';
import ManageTree from './pages/superadmin/ManageTree';
import Genealogy from './pages/member/Genealogy';
import Dashboard from './pages/member/Dashboard';
import Profile from './pages/member/components/Topbar/Profilecomponents/Profile';
import LoadingPage from './pages/loading/LoadingPage';
import AcceptInvitation from './pages/AcceptInvitation';
import Admin from './pages/admin/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { getUserRole, getUserProfile } from './utils/firestore';
import { testFirebaseConnection } from './utils/firebaseTest';
import { Box } from '@mui/material';
import TopBar from './components/Appbar/TopBar';
import BottomNav from './components/bottomnav/BottomNav';


function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prevent scrollbar layout shift by reserving scrollbar space
    document.documentElement.style.scrollbarGutter = 'stable';
    // Prevent horizontal scroll
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    // Hide vertical scrollbar but keep scrolling enabled
    const style = document.createElement('style');
    style.innerHTML = `
      html::-webkit-scrollbar {
        display: none;
      }
      html {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    
    // Test Firebase connection on mount
    testFirebaseConnection();

    let unsubscribeProfile = null;
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
        setUserRole((prevRole) => prevRole || 'user');
      }

      // Load user profile (to get username)
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserProfile(null);
      }

      // Set up real-time listener for profile changes in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({ id: docSnap.id, ...data });
        }
      }, (err) => {
        console.error('Error listening to profile changes:', err);
      });
      
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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

        {/* Public Route - Accept Invitation */}
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} loading={loading} requiredRole="admin" userRole={userRole}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* AppBar */}
                <TopBar title="VERVEX - ADMIN" user={user} userProfile={userProfile} role={userRole} onLogout={handleLogout} />

                {/* Admin Content */}
                <Box sx={{ marginTop: { xs: '56px', sm: '64px' }, flex: 1 }}>
                  <Admin />
                </Box>
              </Box>
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute user={user} loading={loading} requiredRole="superadmin" userRole={userRole}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* AppBar */}
                <TopBar title="VERVEX - SUPERADMIN" user={user} userProfile={userProfile} role={userRole} onLogout={handleLogout} />

                {/* SuperAdmin Content */}
                <Box sx={{ marginTop: { xs: '56px', sm: '64px' }, flex: 1 }}>
                  <Routes>
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/manage-tree" element={<ManageTree />} />
                    <Route path="*" element={<Navigate to="/superadmin/users" replace />} />
                  </Routes>
                </Box>
              </Box>
            </ProtectedRoute>
          }
        />

        {/* Member Routes */}
        <Route
          path="/member/*"
          element={
            <ProtectedRoute user={user} loading={loading} userRole={userRole}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* AppBar */}
                <TopBar title="VERVEX - MEMBER" user={user} userProfile={userProfile} role={userRole} onLogout={handleLogout} />

                {/* Member Content */}
                <Box sx={{ marginTop: { xs: '56px', sm: '64px' }, flex: 1 }}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard user={user} userRole={userRole} />} />
                    <Route path="/genealogy" element={<Genealogy />} />
                    <Route path="/profile" element={<Profile user={user} userProfile={userProfile} onProfileUpdate={setUserProfile} />} />
                    <Route path="*" element={<Navigate to="/member/dashboard" replace />} />
                  </Routes>
                </Box>
                <BottomNav />
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
              ) : userRole === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : userRole && ['vip', 'ambassador', 'supreme', 'cashier'].includes(userRole) ? (
                <Navigate to="/member/dashboard" replace />
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
