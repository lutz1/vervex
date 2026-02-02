import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { db, auth } from '../../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generatePaymentCode, updateInviteSlotWithCode } from '../../../utils/firestore';

export default function CodeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);

  useEffect(() => {
    loadCodeRequests();
  }, []);

  const loadCodeRequests = async () => {
    try {
      const codeRequestsRef = collection(db, 'codeRequests');
      const snapshot = await getDocs(codeRequestsRef);
      const data = [];

      for (const doc of snapshot.docs) {
        const requestData = doc.data();
        // Get inviter name
        let inviterName = 'Unknown';
        if (requestData.inviterId) {
          const userSnap = await getDocs(collection(db, 'users'));
          userSnap.forEach((userDoc) => {
            if (userDoc.id === requestData.inviterId) {
              inviterName = userDoc.data().fullName || userDoc.data().name || 'Unknown';
            }
          });
        }

        data.push({
          id: doc.id,
          ...requestData,
          inviterName,
          createdAt: requestData.createdAt?.toDate?.() || new Date(),
        });
      }

      // Sort by created date, newest first
      data.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(data);
    } catch (error) {
      console.error('Error loading code requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = (request) => {
    setSelectedRequest(request);
    const code = generatePaymentCode(request.role);
    setGeneratedCode(code);
    setShowCodeDialog(true);
  };

  const handleConfirmCode = async () => {
    try {
      const requestRef = doc(db, 'codeRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        generatedCode: generatedCode,
        codeGeneratedAt: serverTimestamp(),
        codeGeneratedBy: auth.currentUser.uid,
        status: 'code generated',
        updatedAt: serverTimestamp(),
      });

      // Update the invite slot with the generated code
      if (selectedRequest.inviteSlotId) {
        await updateInviteSlotWithCode(selectedRequest.inviteSlotId, generatedCode);
      }

      alert('Code generated and saved!');
      setShowCodeDialog(false);
      setSelectedRequest(null);
      setGeneratedCode('');
      await loadCodeRequests();
    } catch (error) {
      console.error('Error saving code:', error);
      alert('Error saving code: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting for payment':
        return '#ff9800'; // orange
      case 'code generated':
        return '#4caf50'; // green
      case 'completed':
        return '#2196f3'; // blue
      default:
        return '#757575'; // gray
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'waiting for payment':
        return 'rgba(255, 152, 0, 0.1)';
      case 'code generated':
        return 'rgba(76, 175, 80, 0.1)';
      case 'completed':
        return 'rgba(33, 150, 243, 0.1)';
      default:
        return 'rgba(117, 117, 117, 0.1)';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading code requests...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card
        sx={{
          background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
          color: '#fff',
          border: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: '#d4af37',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            📋 Payment Code Requests ({requests.length})
          </Typography>

          {requests.length === 0 ? (
            <Typography sx={{ color: '#9fa9a3' }}>
              No code requests at this time.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Inviter</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Client Name</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ color: '#d4af37', fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      sx={{
                        borderColor: 'rgba(212, 175, 55, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.05)' },
                      }}
                    >
                      <TableCell sx={{ color: '#9fa9a3' }}>
                        {request.inviterName}
                      </TableCell>
                      <TableCell sx={{ color: '#9fa9a3' }}>
                        {request.inviteData?.fullName || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: '#9fa9a3' }}>
                        <Chip
                          label={request.role?.toUpperCase()}
                          size="small"
                          sx={{
                            background: 'rgba(212, 175, 55, 0.2)',
                            color: '#d4af37',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#4ade80', fontWeight: 600 }}>
                        ₱{request.price?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status?.toUpperCase()}
                          size="small"
                          sx={{
                            background: getStatusBgColor(request.status),
                            color: getStatusColor(request.status),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: request.generatedCode ? '#4ade80' : '#9fa9a3' }}>
                        {request.generatedCode ? (
                          <Typography
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              background: 'rgba(74, 222, 128, 0.1)',
                              p: 1,
                              borderRadius: '4px',
                              display: 'inline-block',
                            }}
                          >
                            {request.generatedCode}
                          </Typography>
                        ) : (
                          'Not generated'
                        )}
                      </TableCell>
                      <TableCell>
                        {!request.generatedCode && (request.status === 'waiting for payment' || request.status === 'waiting for code generation') ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGenerateCode(request)}
                            sx={{
                              background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                              color: '#1a5f3f',
                              fontWeight: 700,
                              '&:hover': {
                                background: 'linear-gradient(135deg, #e8d5a1 0%, #d4af37 100%)',
                              },
                            }}
                          >
                            Generate Code
                          </Button>
                        ) : request.generatedCode ? (
                          <Chip label="Code Generated" size="small" sx={{ color: '#4ade80' }} />
                        ) : (
                          <Typography sx={{ color: '#9fa9a3', fontSize: '0.85rem' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Code Generation Dialog */}
      <Dialog
        open={showCodeDialog}
        onClose={() => setShowCodeDialog(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
            color: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#d4af37', fontWeight: 700 }}>
          Generate Payment Code
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: '#9fa9a3', mb: 2 }}>
            Client: <span style={{ color: '#d4af37' }}>{selectedRequest?.inviteData?.fullName}</span>
          </Typography>
          <Typography sx={{ color: '#9fa9a3', mb: 2 }}>
            Amount Due: <span style={{ color: '#4ade80', fontWeight: 700 }}>₱{selectedRequest?.price?.toLocaleString()}</span>
          </Typography>
          <TextField
            fullWidth
            label="Generated Code"
            value={generatedCode}
            onChange={(e) => setGeneratedCode(e.target.value)}
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(212, 175, 55, 0.3)',
              },
            }}
            InputProps={{
              sx: {
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.2rem',
              },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              const newCode = generatePaymentCode(selectedRequest?.role);
              setGeneratedCode(newCode);
            }}
            sx={{
              background: 'rgba(212, 175, 55, 0.2)',
              color: '#d4af37',
              fontWeight: 700,
              mb: 2,
            }}
          >
            Regenerate Code
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setShowCodeDialog(false)}
            sx={{ color: '#9fa9a3' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCode}
            sx={{
              background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
              color: '#1a5f3f',
              fontWeight: 700,
            }}
          >
            Confirm & Save Code
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
