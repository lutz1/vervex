import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function EarningsOverview() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      } catch (error) {
        console.error('Error loading earnings data:', error);
        setLoading(false);
      }
    };

    loadEarningsData();
  }, []);

  return (
    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#d4a574', marginBottom: 3, fontWeight: 700 }}>
          Direct Invite Earnings Overview
        </Typography>

        {loading ? (
          <Typography sx={{ color: '#9fa9a3' }}>Loading...</Typography>
        ) : users.length === 0 ? (
          <Typography sx={{ color: '#9fa9a3' }}>No earnings recorded yet</Typography>
        ) : (
          <TableContainer>
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
      </CardContent>
    </Card>
  );
}
