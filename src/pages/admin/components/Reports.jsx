import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function Reports() {
  const [reportData, setReportData] = useState({
    earningsByRole: {},
    usersByRole: {},
    totalStats: {
      totalUsers: 0,
      totalEarnings: 0,
      totalTransactions: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const transactionsSnapshot = await getDocs(collection(db, 'transactions'));

        let earningsByRole = {};
        let usersByRole = {};
        let totalEarnings = 0;

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const role = userData.role || 'user';

          // Count users by role
          usersByRole[role] = (usersByRole[role] || 0) + 1;

          // Sum earnings by role
          earningsByRole[role] = (earningsByRole[role] || 0) + (userData.directInviteEarnings || 0);
          totalEarnings += userData.balance || 0;
        });

        setReportData({
          earningsByRole,
          usersByRole,
          totalStats: {
            totalUsers: usersSnapshot.size,
            totalEarnings: totalEarnings,
            totalTransactions: transactionsSnapshot.size,
          },
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading report data:', error);
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  if (loading) {
    return (
      <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <CardContent>
          <Typography sx={{ color: '#9fa9a3' }}>Loading reports...</Typography>
        </CardContent>
      </Card>
    );
  }

  const roleStats = Object.entries(reportData.earningsByRole).map(([role, earnings]) => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    earnings: earnings,
    users: reportData.usersByRole[role] || 0,
  }));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#d4a574', marginBottom: 3, fontWeight: 700 }}>
              System Overview
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(74, 222, 128, 0.1)', borderRadius: 1, border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                  <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem', mb: 1 }}>TOTAL USERS</Typography>
                  <Typography sx={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 700 }}>{reportData.totalStats.totalUsers}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(212, 175, 55, 0.1)', borderRadius: 1, border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                  <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem', mb: 1 }}>TOTAL EARNINGS</Typography>
                  <Typography sx={{ color: '#d4a574', fontSize: '1.5rem', fontWeight: 700 }}>₱{reportData.totalStats.totalEarnings.toLocaleString()}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(96, 165, 250, 0.1)', borderRadius: 1, border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                  <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem', mb: 1 }}>TRANSACTIONS</Typography>
                  <Typography sx={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 700 }}>{reportData.totalStats.totalTransactions}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(126, 168, 255, 0.1)', borderRadius: 1, border: '1px solid rgba(126, 168, 255, 0.3)' }}>
                  <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem', mb: 1 }}>AVG EARNINGS</Typography>
                  <Typography sx={{ color: '#7ea8ff', fontSize: '1.5rem', fontWeight: 700 }}>
                    ₱{reportData.totalStats.totalUsers > 0 ? Math.round(reportData.totalStats.totalEarnings / reportData.totalStats.totalUsers).toLocaleString() : 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#d4a574', marginBottom: 3, fontWeight: 700 }}>
              Earnings by Role
            </Typography>

            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minHeight: 300, width: '100%' }}>
                {roleStats.length > 0 ? (
                  <Box>
                    {roleStats.map((stat) => (
                      <Box key={stat.role} sx={{ mb: 2, p: 2, background: 'rgba(212, 175, 55, 0.05)', borderRadius: 1, border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                        <Typography sx={{ color: '#d4a574', fontWeight: 600, mb: 1 }}>{stat.role}</Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Users</Typography>
                            <Typography sx={{ color: '#4ade80', fontWeight: 700 }}>{stat.users}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Total Earnings</Typography>
                            <Typography sx={{ color: '#60a5fa', fontWeight: 700 }}>₱{stat.earnings.toLocaleString()}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#9fa9a3' }}>No data available</Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
