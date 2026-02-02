import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Box, Grid, Chip, Tabs, Tab } from '@mui/material';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import './AdminComponentsStyles.css';

export default function EarningsOverview() {
  const [users, setUsers] = useState([]);
  const [codeRequestLogs, setCodeRequestLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadEarningsData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.directInviteEarnings > 0)
          .sort((a, b) => (b.directInviteEarnings || 0) - (a.directInviteEarnings || 0));

        setUsers(usersData);
      } catch (error) {
        console.error('Error loading earnings data:', error);
      }
    };

    loadEarningsData();
  }, []);

  // Real-time listener for code request logs
  useEffect(() => {
    const codeRequestsRef = collection(db, 'codeRequests');
    
    const unsubscribe = onSnapshot(codeRequestsRef, async (snapshot) => {
      const logs = [];
      
      // For each code request, fetch the inviter's name
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get inviter name
        let inviterName = 'Unknown';
        if (data.inviterId) {
          try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach((userDoc) => {
              if (userDoc.id === data.inviterId) {
                inviterName = userDoc.data().fullName || userDoc.data().name || 'Unknown';
              }
            });
          } catch (err) {
            console.error('Error fetching inviter name:', err);
          }
        }
        
        logs.push({
          id: doc.id,
          ...data,
          inviterName,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      }
      
      // Sort by created date, newest first
      logs.sort((a, b) => b.createdAt - a.createdAt);
      setCodeRequestLogs(logs);
      setLoading(false);
    }, (error) => {
      console.error('Error loading code request logs:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending receipt':
      case 'waiting for payment':
        return 'warning';
      case 'waiting for code generation':
        return 'error';
      case 'code generated':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending receipt':
      case 'waiting for payment':
        return 'rgba(255, 193, 7, 0.15)';
      case 'waiting for code generation':
        return 'rgba(244, 67, 54, 0.15)';
      case 'code generated':
        return 'rgba(76, 175, 80, 0.15)';
      default:
        return 'rgba(212, 175, 55, 0.15)';
    }
  };

  if (loading) {
    return (
      <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <CardContent>
          <Typography sx={{ color: '#9fa9a3' }}>Loading...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(212, 175, 55, 0.2)' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': { color: '#9fa9a3' },
              '& .MuiTab-root.Mui-selected': { color: '#d4af37' },
              '& .MuiTabs-indicator': { backgroundColor: '#d4af37' },
            }}
          >
            <Tab label="Direct Invite Earnings" />
            <Tab label="Code Request Logs" />
          </Tabs>
        </Box>

        {/* Tab 1: Direct Invite Earnings */}
        {tabValue === 0 && (
          <Box sx={{ pt: 3 }}>
            {users.length === 0 ? (
              <Typography sx={{ color: '#9fa9a3' }}>No earnings recorded yet</Typography>
            ) : isMobile ? (
              // Mobile card layout
              <Grid container spacing={2}>
                {users.map((user) => (
                  <Grid item xs={12} sm={6} key={user.id}>
                    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <CardContent>
                        <Typography sx={{ color: '#f5f7ff', fontWeight: 600, marginBottom: 1 }}>{user.name}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Role:</Typography>
                          <Typography sx={{ color: '#7ea8ff', textTransform: 'capitalize', fontSize: '0.85rem' }}>{user.role}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Earnings:</Typography>
                          <Typography sx={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem' }}>₱{(user.directInviteEarnings || 0).toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Balance:</Typography>
                          <Typography sx={{ color: '#d4a574', fontWeight: 600, fontSize: '0.85rem' }}>₱{(user.balance || 0).toLocaleString()}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop table layout
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid rgba(212, 175, 55, 0.2)' }}>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>User Name</TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }} align="right">
                        Total Earnings
                      </TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }} align="right">
                        Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', '&:hover': { background: 'rgba(212, 175, 55, 0.05)' } }}>
                        <TableCell sx={{ color: '#f5f7ff' }}>{user.name}</TableCell>
                        <TableCell sx={{ color: '#7ea8ff', textTransform: 'capitalize' }}>{user.role}</TableCell>
                        <TableCell sx={{ color: '#4ade80', fontWeight: 600 }} align="right">
                          ₱{(user.directInviteEarnings || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: '#d4a574', fontWeight: 600 }} align="right">
                          ₱{(user.balance || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 2: Code Request Logs */}
        {tabValue === 1 && (
          <Box sx={{ pt: 3 }}>
            {codeRequestLogs.length === 0 ? (
              <Typography sx={{ color: '#9fa9a3' }}>No code request logs yet</Typography>
            ) : isMobile ? (
              // Mobile card layout for logs
              <Grid container spacing={2}>
                {codeRequestLogs.map((log) => (
                  <Grid item xs={12} key={log.id}>
                    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <CardContent>
                        <Typography sx={{ color: '#f5f7ff', fontWeight: 600, marginBottom: 1 }}>
                          {log.inviteData?.fullName || log.inviterName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Inviter:</Typography>
                          <Typography sx={{ color: '#7ea8ff', fontSize: '0.85rem' }}>{log.inviterName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Amount:</Typography>
                          <Typography sx={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem' }}>₱{log.price?.toLocaleString() || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Role:</Typography>
                          <Typography sx={{ color: '#d4a574', textTransform: 'capitalize', fontSize: '0.85rem' }}>{log.role}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>Status:</Typography>
                          <Chip
                            label={log.status?.toUpperCase()}
                            size="small"
                            sx={{
                              background: getStatusBgColor(log.status),
                              color: getStatusColor(log.status) === 'success' ? '#4ade80' : getStatusColor(log.status) === 'error' ? '#f44336' : '#ff9800',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop table layout for logs
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '2px solid rgba(212, 175, 55, 0.2)' }}>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Invited Member</TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Inviter</TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }} align="center">
                        Status
                      </TableCell>
                      <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {codeRequestLogs.map((log) => (
                      <TableRow key={log.id} sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', '&:hover': { background: 'rgba(212, 175, 55, 0.05)' } }}>
                        <TableCell sx={{ color: '#f5f7ff' }}>
                          {log.inviteData?.fullName || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#7ea8ff' }}>{log.inviterName}</TableCell>
                        <TableCell sx={{ color: '#d4a574', textTransform: 'capitalize' }}>{log.role}</TableCell>
                        <TableCell sx={{ color: '#4ade80', fontWeight: 600 }} align="right">
                          ₱{log.price?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={log.status?.toUpperCase()}
                            size="small"
                            sx={{
                              background: getStatusBgColor(log.status),
                              color: getStatusColor(log.status) === 'success' ? '#4ade80' : getStatusColor(log.status) === 'error' ? '#f44336' : '#ff9800',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>
                          {log.createdAt?.toLocaleDateString?.() || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
