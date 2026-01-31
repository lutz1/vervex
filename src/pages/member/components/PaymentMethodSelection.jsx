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
      className="modal-overlay"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        p: 2,
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 500,
          background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
          color: '#fff',
          border: '1px solid rgba(212, 175, 55, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              onClick={onClose}
              disabled={isLoading}
              sx={{
                color: '#d4af37',
                minWidth: 'auto',
                p: 0,
                fontSize: '1.5rem',
                '&:disabled': {
                  color: 'rgba(212, 175, 55, 0.5)',
                },
              }}
            >
              ✕
            </Button>
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#d4af37',
              textAlign: 'center',
            }}
          >
            SELECT PAYMENT METHOD
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#9fa9a3',
              mb: 3,
              fontSize: '0.95rem',
              textAlign: 'center',
            }}
          >
            Please choose how the new member will complete their registration payment.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', mb: 3 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mb: 2,
            }}
          >
            {/* Over the Counter Payment Option */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => onSelectPaymentMethod('over-the-counter')}
              disabled={isLoading}
              sx={{
                py: 3,
                px: 2,
                borderColor: 'rgba(212, 175, 55, 0.5)',
                color: '#d4af37',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#d4af37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                },
                '&:disabled': {
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  color: 'rgba(212, 175, 55, 0.5)',
                },
              }}
            >
              <Typography sx={{ fontSize: '1.5rem' }}>🏪</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Over the Counter
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#9fa9a3' }}>
                Payment at physical location
              </Typography>
            </Button>

            {/* Online Payment Option */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => onSelectPaymentMethod('online')}
              disabled={isLoading}
              sx={{
                py: 3,
                px: 2,
                borderColor: 'rgba(212, 175, 55, 0.5)',
                color: '#d4af37',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#d4af37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                },
                '&:disabled': {
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  color: 'rgba(212, 175, 55, 0.5)',
                },
              }}
            >
              <Typography sx={{ fontSize: '1.5rem' }}>💳</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Online
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#9fa9a3' }}>
                Digital payment method
              </Typography>
            </Button>
          </Box>

          <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', my: 3 }} />

          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={isLoading}
            sx={{
              color: '#9fa9a3',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              '&:hover': {
                borderColor: 'rgba(212, 175, 55, 0.5)',
              },
              '&:disabled': {
                color: 'rgba(159, 169, 163, 0.5)',
                borderColor: 'rgba(212, 175, 55, 0.2)',
              },
            }}
          >
            CANCEL
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
