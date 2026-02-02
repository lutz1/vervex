import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
} from '@mui/material';

export default function PaymentMethodSelection({ onClose, onSelectPaymentMethod, isLoading }) {
  return (
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
          maxWidth: { xs: '90vw', sm: '400px', md: '450px' },
          maxHeight: { xs: '80vh', sm: '85vh' },
          background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
          color: '#ffffff',
          border: 'none',
          borderLeft: '4px solid #d4af37',
          borderRadius: 0,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 40px rgba(212, 175, 55, 0.05)',
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
              alignItems: 'center',
              padding: { xs: '12px 14px', sm: '14px 16px' },
              paddingBottom: { xs: '10px', sm: '12px' },
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
              gap: '12px',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                color: '#d4af37',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                fontFamily: "'Cinzel', serif",
                margin: 0,
                flex: 1,
                textAlign: 'center',
              }}
            >
              SELECT PAYMENT METHOD
            </Typography>
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
                  color: '#d4af37',
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
                marginBottom: { xs: '10px', sm: '12px' },
                textAlign: 'center',
                lineHeight: 1.5,
                letterSpacing: '0.2px',
              }}
            >
              Please choose how the new member will complete their registration payment.
            </Typography>

            <Divider
              sx={{
                borderColor: '#2a2a2a !important',
                marginBottom: { xs: '10px', sm: '12px' },
              }}
            />

            {/* Payment Method Options */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: '8px',
                marginBottom: { xs: '10px', sm: '12px' },
              }}
            >
              {/* Over the Counter */}
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onSelectPaymentMethod('over-the-counter')}
                disabled={isLoading}
                sx={{
                  padding: { xs: '12px 10px', sm: '14px 10px' },
                  borderColor: '#2a2a2a',
                  color: '#d4af37',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: 0,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.7rem',
                  '&:hover': {
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    color: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    borderColor: '#2a2a2a',
                    color: '#555555',
                    cursor: 'not-allowed',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1.2rem' }}>🏪</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                  Over the Counter
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: '#666666' }}>
                  Payment at location
                </Typography>
              </Button>

              {/* Online Payment */}
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onSelectPaymentMethod('online')}
                disabled={isLoading}
                sx={{
                  padding: { xs: '12px 10px', sm: '14px 10px' },
                  borderColor: '#2a2a2a',
                  color: '#d4af37',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: 0,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.7rem',
                  '&:hover': {
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    color: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    borderColor: '#2a2a2a',
                    color: '#555555',
                    cursor: 'not-allowed',
                  },
                }}
              >
                <Typography sx={{ fontSize: '1.2rem' }}>💳</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                  Online
                </Typography>
                <Typography sx={{ fontSize: '0.55rem', color: '#666666' }}>
                  Digital payment
                </Typography>
              </Button>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ flexShrink: 0 }}>
            <Divider
              sx={{
                borderColor: '#2a2a2a !important',
                margin: { xs: '8px 0', sm: '10px 0' },
              }}
            />

            <Box
              sx={{
                padding: { xs: '10px 12px', sm: '12px 14px' },
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={onClose}
                disabled={isLoading}
                sx={{
                  color: '#999999',
                  borderColor: 'transparent',
                  background: 'transparent',
                  padding: '8px 10px',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  borderTop: '1px solid #2a2a2a',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    color: '#d4af37',
                    borderColor: 'transparent',
                  },
                  '&:disabled': {
                    color: '#555555',
                    borderColor: 'transparent',
                    cursor: 'not-allowed',
                  },
                }}
              >
                CANCEL
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
