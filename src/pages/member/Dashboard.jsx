import React, { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import PerformanceStats from './components/genealogycomponents/PerformanceStats';
import './Dashboard.css';
import './Genealogy.css';

export default function Dashboard({ user, userRole }) {
  const [directInviteEarnings, setDirectInviteEarnings] = useState(0);
  const [directInviteCount, setDirectInviteCount] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const displayName = user?.displayName || user?.name || 'Member';
  
  // Real-time listener for direct invite earnings from completed invites
  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setDirectInviteEarnings(data.directInviteEarnings || 0);
        setDirectInviteCount(data.directInviteCount || 0);
      }
    }, (error) => {
      console.error('Error fetching user data:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time listener for pending code request earnings
  useEffect(() => {
    if (!user?.uid) return;

    const codeRequestsRef = collection(db, 'codeRequests');
    const q = query(
      codeRequestsRef,
      where('inviterId', '==', user.uid),
      where('status', 'in', ['pending receipt', 'waiting for payment', 'waiting for code generation'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let pending = 0;
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        count += 1;
        if (data.price) {
          pending += data.price;
        }
      });
      setPendingEarnings(pending);
      setPendingInvitesCount(count);
    }, (error) => {
      console.error('Error fetching pending earnings:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);
  
  const getRankDisplay = (role) => {
    if (!role) return 'PRO RANK';
    const roleStr = role.toLowerCase();
    if (roleStr === 'vip') return 'VIP RANK';
    if (roleStr === 'ambassador') return 'AMBASSADOR RANK';
    if (roleStr === 'supreme') return 'SUPREME RANK';
    if (roleStr === 'company_account') return 'COMPANY ACCOUNT RANK';
    if (roleStr === 'cashier') return 'CASHIER RANK';
    return 'PRO RANK';
  };
  
  const rank = getRankDisplay(userRole);
  const initials = (displayName || 'V').charAt(0).toUpperCase();

  return (
    <div className="genealogy-main-container dashboard-page">
      <div className="genealogy-content-wrapper">
        <header className="dash-header">
          <div className="dash-brand">
            <p className="dash-brand-title">Vervex - Member</p>
            <p className="dash-brand-sub">Exclusive Access</p>
          </div>

          <div className="dash-user">
            <div className="dash-user-meta">
              <p className="dash-user-name">{displayName}</p>
              <p className="dash-user-rank">{rank}</p>
            </div>
            <div className="dash-user-badge" aria-label="Member badge">
              <span className="badge-letter">{initials}</span>
              <div className="badge-stars" aria-hidden>
                <span>*</span>
                <span>*</span>
                <span>*</span>
              </div>
              <span className="badge-tier">VIP</span>
            </div>
          </div>
        </header>

        <Container disableGutters maxWidth={false} sx={{ py: 2 }} className="pv-dashboard-root">
          <Box sx={{ mb: 2 }} className="dash-heading">
            <Typography variant="h5" className="dash-title">Dashboard</Typography>
            <Typography variant="body2" className="dash-sub">Overview & performance</Typography>
          </Box>

          <PerformanceStats 
            directInviteEarnings={directInviteEarnings + pendingEarnings}
            directInviteCount={directInviteCount}
            pendingEarnings={pendingEarnings}
            pendingInvitesCount={pendingInvitesCount}
          />
          <div className="dash-bottom-spacer" aria-hidden />
        </Container>
      </div>
    </div>
  );
}
