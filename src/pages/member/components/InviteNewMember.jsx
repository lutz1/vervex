import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Divider,
  MenuItem, 
  Select,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import { getCodeRequestPrice } from '../../../utils/firestore';

export default function InviteNewMember({
  inviteSlot,
  onClose,
  onSendInvite,
  isLoading,
  inviteData,
  onInviteDataChange,
  paymentMethod,
}) {
  const {
    role = 'vip',
  } = inviteData;

  const roles = ['vip', 'ambassador', 'supreme'];
  
  const selectedPrice = useMemo(() => {
    return getCodeRequestPrice(role);
  }, [role]);

  const isOverTheCounter = paymentMethod === 'over-the-counter';

  // Handle contact number - only allow numbers
  const handleContactNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    onInviteDataChange('contactNumber', value);
  };

  if (!inviteSlot) return null;

  const modalContent = (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'center',
        zIndex: 999,
        padding: { xs: '0', sm: '16px', md: '20px' },
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '420px', md: '500px' },
          maxHeight: { xs: '100vh', sm: '95vh', md: '90vh' },
          margin: { xs: '0', sm: 'auto' },
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: '#ffffff',
          border: 'none',
          borderLeft: '4px solid #d4af37',
          borderTop: { xs: '4px solid #d4af37', sm: 'none' },
          borderRadius: { xs: 0, sm: '4px' },
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
              padding: { xs: '12px 16px', sm: '14px 16px' },
              paddingBottom: { xs: '10px', sm: '10px' },
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
              gap: { xs: '8px', sm: '10px' },
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#d4af37',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  fontFamily: "'Cinzel', serif",
                  margin: 0,
                  lineHeight: 1.3,
                  textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                }}
              >
                INVITE NEW MEMBER
              </Typography>
              <Typography
                sx={{
                  color: '#999999',
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  marginTop: '4px',
                  letterSpacing: '0.3px',
                }}
              >
                Payment:{' '}
                <span style={{ color: '#d4af37', fontWeight: 600 }}>
                  {paymentMethod === 'over-the-counter' ? 'Counter' : 'Online'}
                </span>
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
                fontSize: { xs: '1.4rem', sm: '1.2rem' },
                padding: { xs: '4px 6px', sm: '2px 4px' },
                minWidth: 'auto',
                transition: 'all 0.3s ease',
                flexShrink: 0,
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
              padding: { xs: '12px 16px', sm: '12px 14px' },
              paddingBottom: { xs: '80px', sm: '12px' },
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(100, 100, 100, 0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#d4af37',
                borderRadius: '3px',
              },
            }}
          >
            <Typography
              sx={{
                color: '#999999',
                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                marginBottom: { xs: '10px', sm: '12px' },
                lineHeight: 1.5,
                letterSpacing: '0.2px',
              }}
            >
              Enter the details below to send an invitation link to add a new member to this position.
            </Typography>

            {/* Role Selection with Price Display */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 0.7fr' },
                gap: { xs: '8px', sm: '10px' },
                marginBottom: { xs: '10px', sm: '12px' },
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: '#999999 !important',
                    '&.Mui-focused': {
                      color: '#d4af37 !important',
                    },
                  }}
                >
                  Select Role
                </InputLabel>
                <Select
                  value={role}
                  onChange={(e) => onInviteDataChange('role', e.target.value)}
                  label="Select Role"
                  disabled={isLoading}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#000000 !important',
                        color: '#ffffff',
                        maxHeight: 200,
                        border: '2px solid #d4af37',
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                  sx={{
                    color: '#ffffff !important',
                    backgroundColor: 'transparent !important',
                    borderBottom: '1px solid #3a3a3a !important',
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#d4af37',
                    },
                    '&:hover': {
                      borderBottomColor: '#555555 !important',
                    },
                    '&.Mui-focused .MuiOutlinedInput-input': {
                      borderBottomColor: '#d4af37 !important',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.8rem',
                      color: '#999999 !important',
                      '&.Mui-focused': {
                        color: '#d4af37 !important',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      fontSize: '0.85rem',
                      padding: '10px 0',
                    },
                  }}
                >
                  {roles.map((r) => (
                    <MenuItem
                      key={r}
                      value={r}
                      sx={{
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        '&:hover': {
                          backgroundColor: 'rgba(212, 175, 55, 0.2)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(212, 175, 55, 0.3)',
                        },
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  padding: { xs: '8px 10px', sm: '10px 12px' },
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <Typography
                  sx={{
                    color: '#999999',
                    fontSize: { xs: '0.55rem', sm: '0.65rem' },
                    fontWeight: 500,
                    letterSpacing: '0.2px',
                  }}
                >
                  {isOverTheCounter ? 'Pay' : 'Price'}
                </Typography>
                <Typography
                  sx={{
                    color: '#d4af37',
                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                    fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  ₱{selectedPrice.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Form Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: '8px', sm: '10px' },
                marginBottom: { xs: '8px', sm: '10px' },
              }}
            >
              {[
                { label: 'First Name', key: 'firstName', placeholder: 'First Name' },
                { label: 'Middle Name', key: 'middleName', placeholder: 'Middle Name' },
                { label: 'Surname', key: 'surname', placeholder: 'Surname' },
                { label: 'Username', key: 'username', placeholder: 'Username' },
                { label: 'Birthdate', key: 'birthdate', type: 'date', shrink: true },
                { label: 'Contact #', key: 'contactNumber', placeholder: 'Contact Number' },
              ].map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  label={field.label}
                  variant="outlined"
                  placeholder={field.placeholder}
                  type={field.type || 'text'}
                  value={inviteData[field.key]}
                  onChange={(e) => field.key === 'contactNumber' ? handleContactNumberChange(e) : onInviteDataChange(field.key, e.target.value)}
                  disabled={isLoading}
                  size="small"
                  inputProps={field.key === 'contactNumber' ? { inputMode: 'numeric', pattern: '[0-9]*' } : {}}
                  InputLabelProps={{ shrink: field.shrink }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff !important',
                      backgroundColor: 'transparent !important',
                      padding: '8px 0',
                      minHeight: '36px',
                      '& fieldset': {
                        border: 'none',
                        borderBottom: '1px solid #3a3a3a',
                      },
                      '&:hover fieldset': {
                        borderBottomColor: '#555555 !important',
                      },
                      '&.Mui-focused fieldset': {
                        borderBottom: '2px solid #d4af37 !important',
                      },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      padding: '8px 0',
                      lineHeight: '1.4',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#555555',
                      opacity: 0.7,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      lineHeight: '1.2',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                  }}
                />
              ))}
            </Box>

            {/* Full Width Fields */}
            {[
              { label: 'Email Address', key: 'email', placeholder: 'member@example.com', type: 'email' },
            ].map((field) => (
              <Box
                key={field.key}
                sx={{
                  marginBottom: { xs: '8px', sm: '10px' },
                }}
              >
                <TextField
                  fullWidth
                  label={field.label}
                  variant="outlined"
                  placeholder={field.placeholder}
                  type={field.type || 'text'}
                  value={inviteData[field.key]}
                  onChange={(e) => onInviteDataChange(field.key, e.target.value)}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    marginBottom: { xs: '2px', sm: '3px' },
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff !important',
                      backgroundColor: 'transparent !important',
                      padding: '10px 0',
                      minHeight: '40px',
                      '& fieldset': {
                        border: 'none',
                        borderBottom: '1px solid #3a3a3a',
                      },
                      '&:hover fieldset': {
                        borderBottomColor: '#555555 !important',
                      },
                      '&.Mui-focused fieldset': {
                        borderBottom: '2px solid #d4af37 !important',
                      },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#555555',
                      opacity: 0.7,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      fontSize: '0.8rem',
                      lineHeight: '1.2',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                  }}
                />
              </Box>
            ))}

            {/* Address Section Header */}
            <Typography
              sx={{
                color: '#d4af37',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                fontWeight: 600,
                marginTop: { xs: '8px', sm: '10px' },
                marginBottom: { xs: '6px', sm: '8px' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Address Details
            </Typography>

            {/* Address Fields Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: '8px', sm: '10px' },
                marginBottom: { xs: '8px', sm: '10px' },
              }}
            >
              {[
                { label: 'Purok/Street', key: 'purokStreet', placeholder: 'Purok or Street' },
                { label: 'Barangay', key: 'barangay', placeholder: 'Barangay' },
                { label: 'City', key: 'city', placeholder: 'City' },
                { label: 'Province', key: 'province', placeholder: 'Province' },
              ].map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  label={field.label}
                  variant="outlined"
                  placeholder={field.placeholder}
                  value={inviteData[field.key] || ''}
                  onChange={(e) => onInviteDataChange(field.key, e.target.value)}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff !important',
                      backgroundColor: 'transparent !important',
                      padding: '8px 0',
                      minHeight: '36px',
                      '& fieldset': {
                        border: 'none',
                        borderBottom: '1px solid #3a3a3a',
                      },
                      '&:hover fieldset': {
                        borderBottomColor: '#555555 !important',
                      },
                      '&.Mui-focused fieldset': {
                        borderBottom: '2px solid #d4af37 !important',
                      },
                    },
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      padding: '8px 0',
                      lineHeight: '1.4',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#555555',
                      opacity: 0.7,
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      lineHeight: '1.2',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                  }}
                />
              ))}
            </Box>

            {/* ZIP Code - Full Width */}
            <Box
              sx={{
                marginBottom: { xs: '8px', sm: '10px' },
              }}
            >
              <TextField
                fullWidth
                label="ZIP Code"
                variant="outlined"
                placeholder="ZIP Code"
                value={inviteData.zipCode || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  onInviteDataChange('zipCode', value);
                }}
                disabled={isLoading}
                size="small"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 4 }}
                sx={{
                  marginBottom: { xs: '2px', sm: '3px' },
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff !important',
                    backgroundColor: 'transparent !important',
                    padding: '10px 0',
                    minHeight: '40px',
                    '& fieldset': {
                      border: 'none',
                      borderBottom: '1px solid #3a3a3a',
                    },
                    '&:hover fieldset': {
                      borderBottomColor: '#555555 !important',
                    },
                    '&.Mui-focused fieldset': {
                      borderBottom: '2px solid #d4af37 !important',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#555555',
                    opacity: 0.7,
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999999',
                    fontSize: '0.8rem',
                    lineHeight: '1.2',
                    '&.Mui-focused': {
                      color: '#d4af37',
                    },
                  },
                }}
              />
            </Box>
          </Box>

          {/* Divider and Actions */}
          <Box 
            sx={{ 
              flexShrink: 0,
              position: { xs: 'fixed', sm: 'relative' },
              bottom: { xs: 0, sm: 'auto' },
              left: { xs: 0, sm: 'auto' },
              right: { xs: 0, sm: 'auto' },
              background: { xs: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', sm: 'transparent' },
              borderTop: { xs: '2px solid #d4af37', sm: 'none' },
              zIndex: { xs: 20, sm: 'auto' },
            }}
          >
            <Divider
              sx={{
                borderColor: '#2a2a2a !important',
                margin: { xs: '0', sm: '10px 0' },
                display: { xs: 'none', sm: 'block' },
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' },
                gap: { xs: '10px', sm: '8px' },
                padding: { xs: '12px 16px', sm: '10px 14px 12px' },
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
                  padding: { xs: '12px 16px', sm: '8px 10px' },
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.7rem', sm: '0.65rem' },
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    color: '#d4af37',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
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
                onClick={onSendInvite}
                disabled={isLoading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                  color: '#000000',
                  padding: { xs: '12px 16px', sm: '8px 10px' },
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.7rem', sm: '0.65rem' },
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  border: '1px solid #d4af37',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
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
                {isLoading ? 'SUBMITTING...' : 'SUBMIT'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return createPortal(modalContent, document.body);
}
