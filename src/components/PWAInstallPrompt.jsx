import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the browser's default install prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show the install button
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA app was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: '70px', sm: '20px' },
        right: { xs: '10px', sm: '20px' },
        background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
        border: '2px solid #d4af37',
        borderRadius: { xs: '0', sm: '8px' },
        padding: { xs: '12px 16px', sm: '16px 20px' },
        maxWidth: { xs: 'calc(100% - 20px)', sm: '320px' },
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
        animation: 'slideInUp 0.3s ease-out',
        '@keyframes slideInUp': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Typography
        sx={{
          color: '#1a1a1a',
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          fontWeight: 600,
          marginBottom: '8px',
          letterSpacing: '0.3px',
        }}
      >
        Install Vervex
      </Typography>

      <Typography
        sx={{
          color: '#2a2a2a',
          fontSize: { xs: '0.75rem', sm: '0.85rem' },
          marginBottom: '12px',
          lineHeight: 1.4,
        }}
      >
        Install the Vervex app for quick access and offline functionality.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <Button
          onClick={() => setShowPrompt(false)}
          sx={{
            background: 'rgba(26, 26, 26, 0.1)',
            color: '#1a1a1a',
            border: '1px solid rgba(26, 26, 26, 0.2)',
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(26, 26, 26, 0.2)',
            },
          }}
        >
          Later
        </Button>

        <Button
          onClick={handleInstallClick}
          variant="contained"
          sx={{
            background: '#1a1a1a',
            color: '#d4af37',
            padding: '8px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            borderRadius: '4px',
            border: '1px solid #1a1a1a',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: '#2a2a2a',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Install
        </Button>
      </Box>
    </Box>
  );
}
