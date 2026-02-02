import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './Admin.css';
import AdminSidebar from './components/AdminSidebar';
import EarningsOverview from './components/EarningsOverview';
import UserManagement from './components/UserManagement';
import TransactionLogs from './components/TransactionLogs';
import Reports from './components/Reports';
import CodeRequests from './components/CodeRequests';

export default function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEarnings: 0,
    totalTransactions: 0,
    activeInvitations: 0,
  });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Fetch admin stats
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
        const invitationsSnapshot = await getDocs(collection(db, 'invitations'));

        let totalEarnings = 0;
        usersSnapshot.forEach((doc) => {
          totalEarnings += doc.data().balance || 0;
        });

        setStats({
          totalUsers: usersSnapshot.size,
          totalEarnings: totalEarnings,
          totalTransactions: transactionsSnapshot.size,
          activeInvitations: invitationsSnapshot.docs.filter((d) => d.data().status === 'pending').length,
        });

      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);

  return (
    <Box className="admin-main-container">
      {/* Admin Header */}
      <Box className="admin-header">
        <Box className="admin-header-content">
          <Typography variant="h3" className="admin-title">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" className="admin-subtitle">
            Manage users, earnings, and network overview
          </Typography>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Box className="admin-stats-section">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Typography className="stat-label">Total Users</Typography>
                <Typography className="stat-value">{stats.totalUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Typography className="stat-label">Total Earnings</Typography>
                <Typography className="stat-value">₱{stats.totalEarnings.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Typography className="stat-label">Transactions</Typography>
                <Typography className="stat-value">{stats.totalTransactions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="stat-card">
              <CardContent>
                <Typography className="stat-label">Pending Invites</Typography>
                <Typography className="stat-value">{stats.activeInvitations}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Sidebar and Content Layout */}
      <Box className="admin-layout">
        {/* Vertical Sidebar Navigation */}
        <AdminSidebar activeTab={tabValue} onTabChange={setTabValue} />

        {/* Content Section */}
        <Box className="admin-content-section">
          {tabValue === 0 && <EarningsOverview />}
          {tabValue === 1 && <UserManagement />}
          {tabValue === 2 && <CodeRequests />}
          {tabValue === 3 && <TransactionLogs />}
          {tabValue === 4 && <Reports />}
        </Box>
      </Box>
    </Box>
  );
}
