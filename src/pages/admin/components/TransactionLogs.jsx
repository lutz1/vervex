import React, { useState, useEffect } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Chip } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export default function TransactionLogs() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
        const transactionsData = transactionsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          })
          .slice(0, 100);

        setTransactions(transactionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'direct_invite_earning':
        return '#4ade80';
      case 'withdrawal':
        return '#f87171';
      case 'bonus':
        return '#60a5fa';
      default:
        return '#d4a574';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate?.() || new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card sx={{ background: 'linear-gradient(135deg, rgba(26, 42, 42, 0.8) 0%, rgba(15, 20, 25, 0.8) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#d4a574', marginBottom: 3, fontWeight: 700 }}>
          Transaction Logs (Latest 100)
        </Typography>

        {loading ? (
          <Typography sx={{ color: '#9fa9a3' }}>Loading...</Typography>
        ) : transactions.length === 0 ? (
          <Typography sx={{ color: '#9fa9a3' }}>No transactions recorded yet</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid rgba(212, 175, 55, 0.2)' }}>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ color: '#d4a574', fontWeight: 700 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', '&:hover': { background: 'rgba(212, 175, 55, 0.05)' } }}>
                    <TableCell>
                      <Chip
                        label={tx.type?.replace(/_/g, ' ').toUpperCase()}
                        size="small"
                        sx={{
                          background: getTransactionTypeColor(tx.type) + '20',
                          color: getTransactionTypeColor(tx.type),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#4ade80', fontWeight: 600 }}>₱{(tx.amount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: '#7ea8ff', textTransform: 'capitalize' }}>{tx.role}</TableCell>
                    <TableCell sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>{formatDate(tx.createdAt)}</TableCell>
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
