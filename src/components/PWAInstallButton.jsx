import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function PWAInstallButton({ inline = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true || 
                           document.referrer.includes('android-app://');
    
    setIsStandalone(checkStandalone);

    if (checkStandalone) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
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

    // If no beforeinstallprompt after 2 seconds and inline mode, show button anyway
    const timer = setTimeout(() => {
      if (inline && !deferredPrompt && !isStandalone) {
        setShowButton(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [inline, deferredPrompt, isStandalone]);

  const handleInstallClick = async () => {
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        console.log('Showing install prompt...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowButton(false);
        }
        setDeferredPrompt(null);
      } else {
        // Show manual installation instructions
        const message = 'To install Vervex:\n\n' +
                       '📱 Chrome/Edge (Android):\n' +
                       'Tap menu (⋮) → "Add to Home screen"\n\n' +
                       '💻 Chrome/Edge (Desktop):\n' +
                       'Click install icon (⊕) in address bar\n\n' +
                       '🍎 Safari (iOS):\n' +
                       'Tap Share → "Add to Home Screen"';
        alert(message);
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!showButton || isStandalone) return null;

  if (inline) {
    return (
      <Button
        fullWidth
        variant="contained"
        startIcon={<GetAppIcon />}
        onClick={handleInstallClick}
        disabled={isInstalling}
        sx={{
          background: 'linear-gradient(135deg, #d4af37, #e8d5a1)',
          color: '#000000',
          fontWeight: 700,
          fontSize: '0.9rem',
          padding: '12px 16px',
          marginTop: '16px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #e8d5a1, #d4af37)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.3)',
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #999999, #bbbbbb)',
            color: '#666666',
          },
        }}
      >
        {isInstalling ? 'Installing...' : 'Install Vervex App'}
      </Button>
    );
  }

  return null;
}
