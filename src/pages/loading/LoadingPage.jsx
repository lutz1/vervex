import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import logo from '../../assets/logo.jpg';
import './LoadingPage.css';

export default function LoadingPage() {
  return (
    <Box className="loading-page-bg">
      <Box className="loading-page-container">
        {/* Logo */}
        <Box className="loading-logo-wrapper">
          <img src={logo} alt="Vervex Logo" className="loading-logo" />
        </Box>

        {/* Loading Spinner */}
        <CircularProgress className="loading-spinner" />

        {/* Loading Text */}
        <Typography className="loading-text">
          Loading...
        </Typography>

        {/* Tagline */}
        <Typography className="loading-tagline">
          Exclusive Access to Luxury
        </Typography>
      </Box>

      {/* Animated Background */}
      <Box className="loading-bg-animation" />
    </Box>
  );
}
