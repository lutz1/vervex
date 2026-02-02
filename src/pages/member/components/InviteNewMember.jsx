import React, { useMemo, useEffect, useRef, useState } from 'react';
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

// Load Google Maps script
const loadGoogleMapsScript = (callback) => {
  const existingScript = document.getElementById('googleMaps');
  
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBjsINSn3pq6M0_ZhRJLhxGXRE0CTLvD_I&libraries=places`;
    script.id = 'googleMaps';
    document.body.appendChild(script);
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      if (callback) callback();
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
    };
  } else if (window.google && window.google.maps) {
    console.log('Google Maps script already loaded');
    if (callback) callback();
  }
};

// Add CSS for Google Maps autocomplete styling
const addGoogleMapsStyles = () => {
  const existingStyle = document.getElementById('googleMapsAutocompleteStyles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'googleMapsAutocompleteStyles';
    style.textContent = `
      .pac-container {
        background-color: #121212 !important;
        border: 1px solid rgba(212, 175, 55, 0.3) !important;
        border-top: none !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8) !important;
        z-index: 10000 !important;
        font-family: 'Roboto', sans-serif !important;
      }
      .pac-item {
        background-color: #121212 !important;
        color: #ffffff !important;
        border-top: 1px solid #2a2a2a !important;
        padding: 8px 12px !important;
        cursor: pointer !important;
        font-size: 0.85rem !important;
      }
      .pac-item:hover {
        background-color: rgba(212, 175, 55, 0.1) !important;
      }
      .pac-item-selected {
        background-color: rgba(212, 175, 55, 0.15) !important;
      }
      .pac-item-query {
        color: #d4af37 !important;
        font-size: 0.85rem !important;
      }
      .pac-matched {
        color: #ffffff !important;
        font-weight: 600 !important;
      }
      .pac-icon {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

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

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const roles = ['vip', 'ambassador', 'supreme'];
  
  const selectedPrice = useMemo(() => {
    return getCodeRequestPrice(role);
  }, [role]);

  const isOverTheCounter = paymentMethod === 'over-the-counter';

  // Load Google Maps and initialize autocomplete
  useEffect(() => {
    // Only load if not already loaded
    if (!window.google || !window.google.maps) {
      loadGoogleMapsScript(() => {
        setIsGoogleMapsLoaded(true);
        addGoogleMapsStyles();
      });
    } else {
      setIsGoogleMapsLoaded(true);
      addGoogleMapsStyles();
    }
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && addressInputRef.current && window.google && window.google.maps && window.google.maps.places) {
      // Get the actual input element from the TextField
      const inputElement = addressInputRef.current.querySelector('input');
      
      if (!inputElement) {
        console.error('Address input element not found');
        return;
      }

      // Clean up previous instance
      if (autocompleteRef.current) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          console.log('Cleanup not needed');
        }
      }

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputElement,
          {
            types: ['geocode'],
            componentRestrictions: { country: 'ph' },
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            onInviteDataChange('fullAddress', place.formatted_address);
          }
        });

        console.log('Google Maps Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
      }
    }

    return () => {
      if (autocompleteRef.current && window.google && window.google.maps) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isGoogleMapsLoaded, onInviteDataChange]);

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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: { xs: '12px', sm: '16px', md: '20px' },
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: 'calc(100vw - 24px)', sm: '420px', md: '500px' },
          maxHeight: '90vh',
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
              alignItems: 'flex-start',
              padding: { xs: '10px 12px', sm: '14px 16px' },
              paddingBottom: { xs: '8px', sm: '10px' },
              borderBottom: '1px solid #2a2a2a',
              flexShrink: 0,
              gap: '10px',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: 'linear-gradient(135deg, #0a0a0a 0%, #121212 100%)',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#d4af37',
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.2rem' },
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: "'Cinzel', serif",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                INVITE NEW MEMBER
              </Typography>
              <Typography
                sx={{
                  color: '#999999',
                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                  marginTop: '2px',
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
                fontSize: '1.2rem',
                padding: '2px 4px',
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
              padding: { xs: '10px 12px', sm: '12px 14px' },
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
                        backgroundColor: '#121212 !important',
                        color: '#ffffff',
                        maxHeight: 200,
                        border: '1px solid #3a3a3a',
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
                        backgroundColor: '#121212',
                        '&:hover': {
                          backgroundColor: 'rgba(212, 175, 55, 0.1)',
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

            {/* Full Address with Google Maps Autocomplete */}
            <Box
              sx={{
                marginBottom: { xs: '8px', sm: '10px' },
              }}
              ref={addressInputRef}
            >
              <TextField
                fullWidth
                label="Full Address"
                variant="outlined"
                placeholder="Start typing your address..."
                value={inviteData.fullAddress}
                onChange={(e) => onInviteDataChange('fullAddress', e.target.value)}
                disabled={isLoading}
                size="small"
                inputProps={{
                  id: 'google-maps-autocomplete-input',
                  autoComplete: 'off',
                }}
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
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: '8px', sm: '8px' },
                padding: { xs: '8px 12px 10px', sm: '10px 14px 12px' },
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
                  padding: { xs: '10px 8px', sm: '8px 10px' },
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  fontFamily: "'Inter', sans-serif",
                  borderRadius: 0,
                  transition: 'all 0.3s ease',
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
                Close
              </Button>
              <Button
                onClick={onSendInvite}
                disabled={isLoading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                  color: '#000000',
                  padding: { xs: '10px 8px', sm: '8px 10px' },
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
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
