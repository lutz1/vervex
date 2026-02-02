import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone || 
                           document.referrer.includes('android-app://');
    
    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      return; // Don't show button if already installed
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      // Prevent the browser's default install prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show the install button
      setShowButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA app was installed');
      setShowButton(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      // Fallback: Show installation instructions for browsers that don't support the prompt
      alert('To install:\n\n' +
            'Chrome/Edge (Android): Tap menu (⋮) → "Add to Home screen"\n' +
            'Chrome (Desktop): Click install icon (⊕) in address bar\n' +
            'Safari (iOS): Tap Share → "Add to Home Screen"');
      return;
    }

    try {
      console.log('Showing install prompt...');
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowButton(false);
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  if (!showButton || isStandalone) return null;

  return (
    <Tooltip title="Install Vervex App">
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: '20px', sm: '30px' },
          right: { xs: '20px', sm: '30px' },
          zIndex: 999,
        }}
      >
        <IconButton
          onClick={handleInstallClick}
          sx={{
            background: 'linear-gradient(135deg, #d4af37, #e8d5a1)',
            color: '#000000',
            width: '56px',
            height: '56px',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #e8d5a1, #d4af37)',
              transform: 'scale(1.1) translateY(-4px)',
              boxShadow: '0 6px 25px rgba(212, 175, 55, 0.5)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <GetAppIcon sx={{ fontSize: '28px', fontWeight: 'bold' }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
