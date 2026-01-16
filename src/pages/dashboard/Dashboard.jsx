import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Dashboard({ user }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: '#d4af37', mb: 2 }}>
        Welcome to Vervex
      </Typography>
      <Typography variant="body1" sx={{ color: '#f5f5f5' }}>
        You are logged in as <strong>{user.email}</strong>
      </Typography>
    </Box>
  );
}
