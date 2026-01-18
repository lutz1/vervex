import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import PerformanceStats from './components/genealogycomponents/PerformanceStats';
import './Dashboard.css';
import './Genealogy.css';

export default function Dashboard() {
  return (
    <div className="genealogy-main-container">
      <div className="genealogy-content-wrapper">
        <Container sx={{ py: 3 }} className="pv-dashboard-root">
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ color: '#d4af37', fontWeight: 800 }}>Dashboard</Typography>
            <Typography variant="body2" sx={{ color: '#9aa4ad' }}>Overview & performance</Typography>
          </Box>

          <PerformanceStats />
        </Container>
      </div>
    </div>
  );
}
