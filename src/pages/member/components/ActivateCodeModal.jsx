import React from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
} from '@mui/material';

export default function ActivateCodeModal({
  isOpen,
  onClose,
  code,
  inviteSlot,
  onActivate,
  isLoading,
}) {
  if (!isOpen || !code) return null;

  const modalContent = (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: '56px', sm: '64px' },
        left: 0,
        right: 0,
        bottom: { xs: '56px', sm: '56px' },
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: { xs: '8px', sm: '16px', md: '20px' },
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '90vw', sm: '420px', md: '500px' },
          maxHeight: { xs: '80vh', sm: '85vh' },
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: '#ffffff',
          border: 'none',
          borderLeft: '4px solid #d4af37',
          borderRadius: 0,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(212, 175, 55, 0.1)',
          animation: 'slideUp 0.35s ease-out',
          display: 'flex',
          flexDirection: 'column',
          '@keyframes slideUp': {
            from: { opacity: 0, transform: 'translateY(30px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent
          sx={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            '&:last-child': { paddingBottom: 0 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: { xs: '12px 14px', sm: '16px 18px' },
              paddingBottom: { xs: '10px', sm: '12px' },
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#4ade80',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: "'Cinzel', serif",
                  margin: 0,
                }}
              >
                Payment Code Ready
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#999999',
                  mt: '4px',
                  letterSpacing: '0.3px',
                }}
              >
                Your registration code has been generated
              </Typography>
            </Box>
            <Button
              onClick={onClose}
              disabled={isLoading}
              sx={{
                color: '#999999',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '2px 4px',
                minWidth: 'auto',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#4ade80',
                  transform: 'scale(1.2) rotate(90deg)',
                },
                '&:disabled': {
                  color: '#2a2a2a',
                  cursor: 'not-allowed',
                },
              }}
            >
              ✕
            </Button>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              padding: { xs: '12px 14px', sm: '14px 16px' },
            }}
          >
            <Typography
              sx={{
                color: '#999999',
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                marginBottom: { xs: '12px', sm: '14px' },
                textAlign: 'center',
                lineHeight: 1.5,
                letterSpacing: '0.2px',
              }}
            >
              Please use this payment code to complete your registration at the partner location or payment center.
            </Typography>

            {/* Code Display Box */}
            <Box
              sx={{
                background: 'rgba(74, 222, 128, 0.08)',
                border: '2px solid rgba(74, 222, 128, 0.3)',
                padding: { xs: '14px', sm: '16px' },
                borderRadius: '4px',
                marginBottom: { xs: '12px', sm: '14px' },
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  color: '#999999',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Your Payment Code
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                  color: '#4ade80',
                  letterSpacing: '2px',
                  wordBreak: 'break-all',
                }}
              >
                {code}
              </Typography>
            </Box>

            <Divider
              sx={{
                borderColor: '#2a2a2a !important',
                margin: { xs: '10px 0', sm: '12px 0' },
              }}
            />

            {/* Instructions */}
            <Box
              sx={{
                background: 'rgba(99, 102, 241, 0.05)',
                padding: { xs: '10px 12px', sm: '12px 14px' },
                borderRadius: '4px',
                marginBottom: { xs: '12px', sm: '14px' },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#d4af37',
                  lineHeight: 1.6,
                }}
              >
                <strong>Next Steps:</strong>
                <br />
                1. Copy this code
                <br />
                2. Visit your nearest partner payment center
                <br />
                3. Pay the required amount
                <br />
                4. Provide this code as reference
                <br />
                5. Return here to activate your membership
              </Typography>
            </Box>
          </Box>

          {/* Divider and Actions */}
          <Box sx={{ flexShrink: 0 }}>
            <Divider
              sx={{
                borderColor: '#2a2a2a !important',
                margin: { xs: '8px 0', sm: '10px 0' },
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: { xs: '10px 12px', sm: '12px 14px' },
              }}
            >
              <Button
                onClick={onClose}
                disabled={isLoading}
                variant="outlined"
                sx={{
                  color: '#999999',
                  borderColor: 'transparent',
                  background: 'transparent',
                  padding: '8px 10px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    color: '#4ade80',
                    borderColor: 'transparent',
                  },
                  '&:disabled': {
                    color: '#555555',
                    borderColor: 'transparent',
                    cursor: 'not-allowed',
                  },
                }}
              >
                Close
              </Button>
              <Button
                onClick={onActivate}
                disabled={isLoading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #4ade80, #86efac, #4ade80)',
                  color: '#000000',
                  padding: '8px 10px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  border: '1px solid #4ade80',
                  boxShadow: '0 2px 8px rgba(74, 222, 128, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #4a4a4a, #6a6a6a, #4a4a4a)',
                    color: '#999999',
                    boxShadow: 'none',
                    cursor: 'not-allowed',
                  },
                }}
              >
                {isLoading ? 'ACTIVATING...' : 'I Have Paid - Activate Now'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return createPortal(modalContent, document.body);
}
