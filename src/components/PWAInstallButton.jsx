import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';

export default function PWAInstallButton({ inline = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true || 
                           document.referrer.includes('android-app://');
    
    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('✓ beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      setShowFallback(false);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('✓ PWA app installed successfully');
      setShowButton(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowFallback(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If no beforeinstallprompt after 3 seconds and inline mode, show fallback button
    const timer = setTimeout(() => {
      if (inline && !deferredPrompt && !isStandalone) {
        console.log('⚠ No beforeinstallprompt detected, showing fallback button');
        setShowButton(true);
        setShowFallback(true);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline]);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    setIsInstalling(true);

    try {
      if (deferredPrompt) {
        console.log('→ Showing native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`✓ User response: ${outcome}`);
        
        if (outcome === 'accepted') {
          console.log('✓ Installation accepted by user');
          setShowButton(false);
          setDeferredPrompt(null);
        }
      } else {
        // Show manual installation instructions
        console.log('→ Showing fallback installation instructions');
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
      console.error('✗ Installation error:', error);
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
          background: showFallback 
            ? 'linear-gradient(135deg, #ff9800, #f57c00)' 
            : 'linear-gradient(135deg, #d4af37, #e8d5a1)',
          color: '#000000',
          padding: '12px 16px',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '1px',
          fontFamily: "'Cinzel', serif",
          borderRadius: '4px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
          transition: 'all 0.3s ease',
          marginTop: '12px',
          marginBottom: '12px',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(212, 175, 55, 0.5)',
            transform: 'translateY(-2px)',
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #4a4a4a, #6a6a6a)',
            color: '#999999',
            boxShadow: 'none',
            cursor: 'not-allowed',
          },
        }}
      >
        {isInstalling ? 'INSTALLING...' : 'INSTALL VERVEX APP'}
      </Button>
    );
  }

  // Floating button for non-inline mode
  return (
    <Button
      variant="contained"
      startIcon={<GetAppIcon />}
      onClick={handleInstallClick}
      disabled={isInstalling}
      sx={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999,
        background: 'linear-gradient(135deg, #d4af37, #e8d5a1)',
        color: '#000000',
        fontWeight: 700,
        textTransform: 'uppercase',
        borderRadius: '50px',
        padding: '10px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
          transform: 'scale(1.05)',
        },
        '&:disabled': {
          background: '#666',
          cursor: 'not-allowed',
        },
      }}
    >
      {isInstalling ? 'INSTALLING...' : 'INSTALL'}
    </Button>
  );
}
