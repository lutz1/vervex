import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, TextField } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#d4a574', marginBottom: 3, fontWeight: 700 }}>
          User Management
        </Typography>

        <TextField
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            marginBottom: 3,
            '& .MuiOutlinedInput-root': {
              color: '#f5f7ff',
              '& fieldset': {
                borderColor: 'rgba(212, 175, 55, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(212, 175, 55, 0.5)',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: '#9fa9a3',
              opacity: 1,
            },
          }}
        />

        {loading ? (
          <Typography sx={{ color: '#9fa9a3' }}>Loading...</Typography>
        ) : filteredUsers.length === 0 ? (
          <Typography sx={{ color: '#9fa9a3' }}>No users found</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid rgba(212, 175, 55, 0.2)' }}>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', '&:hover': { background: 'rgba(212, 175, 55, 0.05)' } }}>
                    <TableCell sx={{ color: '#f5f7ff' }}>{user.name}</TableCell>
                    <TableCell sx={{ color: '#7ea8ff' }}>{user.email}</TableCell>
                    <TableCell sx={{ color: '#f5f7ff' }}>{user.username || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#f5f7ff', textTransform: 'capitalize' }}>{user.role}</TableCell>
                    <TableCell sx={{ color: '#4ade80' }}>{user.status || 'active'}</TableCell>
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
