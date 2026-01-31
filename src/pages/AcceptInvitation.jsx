import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { addDirectInviteEarnings } from '../utils/firestore';
import './AcceptInvitation.css';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const inviterId = searchParams.get('inviterId');
  const invitationId = searchParams.get('invitationId');

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        if (!inviterId || !invitationId) {
          setError('Invalid invitation link');
          setLoading(false);
          return;
        }

        // Find the invitation by ID
        const invRef = doc(db, 'invitations', invitationId);
        const invSnap = await getDoc(invRef);

        if (!invSnap.exists()) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const invData = invSnap.data();

        // Check if invitation is still pending
        if (invData.status !== 'pending') {
          setError(`This invitation has already been ${invData.status}`);
          setLoading(false);
          return;
        }

        setInvitation({ id: invitationId, ...invData });
        setLoading(false);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Failed to load invitation');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [inviterId, invitationId]);

  const handleAcceptInvitation = async () => {
    try {
      setLoading(true);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.invitedEmail,
        generateDefaultPassword()
      );

      const newUserId = userCredential.user.uid;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', newUserId), {
        uid: newUserId,
        email: invitation.invitedEmail,
        name: invitation.invitedName,
        firstName: invitation.firstName,
        middleName: invitation.middleName,
        surname: invitation.surname,
        username: invitation.username,
        birthdate: invitation.birthdate,
        fullAddress: invitation.fullAddress,
        contactNumber: invitation.contactNumber,
        referrerId: inviterId,
        role: 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        balance: 0,
        directInviteEarnings: 0,
      });

      // Update invitation status
      await setDoc(doc(db, 'invitations', invitation.id), invitation, { merge: true });
      await setDoc(
        doc(db, 'invitations', invitation.id),
        {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: newUserId,
        },
        { merge: true }
      );

      // Add earnings to inviter
      await addDirectInviteEarnings(inviterId, newUserId);

      setSuccess(true);
      setError(null);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
      setLoading(false);
    }
  };

  const generateDefaultPassword = () => {
    // Generate a temporary password (user should change this after first login)
    return Math.random().toString(36).slice(-12);
  };

  if (loading) {
    return (
      <Box className="accept-invitation-container">
        <Card className="invitation-card">
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading invitation...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="accept-invitation-container">
        <Card className="invitation-card error">
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2 }}>
              ❌ Error
            </Typography>
            <Typography sx={{ color: '#fff', mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ background: 'linear-gradient(135deg, #d4a574 0%, #e8d5a1 100%)' }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (success) {
    return (
      <Box className="accept-invitation-container">
        <Card className="invitation-card success">
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h5" sx={{ color: '#4ade80', mb: 2 }}>
              ✅ Invitation Accepted!
            </Typography>
            <Typography sx={{ color: '#fff', mb: 3 }}>
              Your account has been created successfully.
            </Typography>
            <Typography sx={{ color: '#a8a8a8', fontSize: '0.9rem' }}>
              Redirecting to login...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="accept-invitation-container">
      <Card className="invitation-card">
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ color: '#d4a574', mb: 2, fontWeight: 700 }}>
            Accept Invitation
          </Typography>

          <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem', mb: 1 }}>
              FROM
            </Typography>
            <Typography sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
              {invitation?.createdByName || 'A member'}
            </Typography>
          </Box>

          <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem', mb: 1 }}>
              INVITED EMAIL
            </Typography>
            <Typography sx={{ color: '#d4a574', fontSize: '1rem' }}>
              {invitation?.invitedEmail}
            </Typography>
          </Box>

          <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem', mb: 1 }}>
              NAME
            </Typography>
            <Typography sx={{ color: '#fff', fontSize: '1rem' }}>
              {invitation?.invitedName}
            </Typography>
          </Box>

          <Box sx={{ mb: 4, p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <Typography sx={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>
              ✓ All your information has been pre-filled based on the invitation
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ flex: 1, color: '#d4a574', borderColor: '#d4a574' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAcceptInvitation}
              disabled={loading}
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #d4a574 0%, #e8d5a1 100%)',
                color: '#1a5f3f',
                fontWeight: 700,
              }}
            >
              {loading ? 'Creating Account...' : 'Accept & Create Account'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
