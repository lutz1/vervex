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
} from '@mui/material';
import { getCodeRequestPrice } from '../../../utils/firestore';
import './InviteNewMember.css';

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
    firstName,
    middleName,
    surname,
    username,
    birthdate,
    contactNumber,
    email,
    fullAddress,
    role = 'vip',
  } = inviteData;

  const roles = ['vip', 'ambassador', 'supreme'];
  
  const selectedPrice = useMemo(() => {
    return getCodeRequestPrice(role);
  }, [role]);

  const isOverTheCounter = paymentMethod === 'over-the-counter';

  if (!inviteSlot) return null;

  const modalContent = (
    <Box
      className="invite-modal-overlay"
      onClick={onClose}
    >
      <Card className="invite-modal-card" onClick={(e) => e.stopPropagation()}>
        <Box className="invite-modal-header">
          <Box>
            <Typography className="invite-modal-title">
              INVITE NEW MEMBER
            </Typography>
            <Typography className="invite-modal-subtitle">
              Payment Method:{' '}
              <span className="invite-modal-subtitle-highlight">
                {paymentMethod === 'over-the-counter' ? 'Over the Counter' : 'Online'}
              </span>
            </Typography>
          </Box>
          <button
            className="invite-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </Box>

        <CardContent className="invite-modal-content">
          <Typography className="invite-modal-description">
            Enter the details below to send an invitation link to add a new member to this position.
          </Typography>

          {/* Role Selection with Price Display */}
          <Box className="invite-role-price-container">
            <FormControl fullWidth size="small" className="invite-role-select">
              <InputLabel>Select Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => onInviteDataChange('role', e.target.value)}
                label="Select Role"
                disabled={isLoading}
              >
                {roles.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box className="invite-price-box">
              <Typography className="invite-price-label">
                {isOverTheCounter ? 'Amount to Pay' : 'Registration Price'}
              </Typography>
              <Typography className="invite-price-value">
                ₱{selectedPrice.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Box className="invite-form-grid">
            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                placeholder="First Name"
                value={firstName}
                onChange={(e) =>
                  onInviteDataChange('firstName', e.target.value)
                }
                disabled={isLoading}
                size="small"
              />
            </Box>

            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="Middle Name"
                variant="outlined"
                placeholder="Middle Name"
                value={middleName}
                onChange={(e) =>
                  onInviteDataChange('middleName', e.target.value)
                }
                disabled={isLoading}
                size="small"
              />
            </Box>

            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="Surname"
                variant="outlined"
                placeholder="Surname"
                value={surname}
                onChange={(e) =>
                  onInviteDataChange('surname', e.target.value)
                }
                disabled={isLoading}
                size="small"
              />
            </Box>

            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  onInviteDataChange('username', e.target.value)
                }
                disabled={isLoading}
                size="small"
              />
            </Box>

            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="Birthdate"
                variant="outlined"
                type="date"
                value={birthdate}
                onChange={(e) =>
                  onInviteDataChange('birthdate', e.target.value)
                }
                disabled={isLoading}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box className="invite-form-input">
              <TextField
                fullWidth
                label="Contact #"
                variant="outlined"
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) =>
                  onInviteDataChange('contactNumber', e.target.value)
                }
                disabled={isLoading}
                size="small"
              />
            </Box>
          </Box>

          <Box className="invite-form-input-full">
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              placeholder="member@example.com"
              value={email}
              onChange={(e) =>
                onInviteDataChange('email', e.target.value)
              }
              disabled={isLoading}
              size="small"
            />
          </Box>

          <Box className="invite-form-input-full">
            <TextField
              fullWidth
              label="Full Address"
              variant="outlined"
              placeholder="Complete Address"
              value={fullAddress}
              onChange={(e) =>
                onInviteDataChange('fullAddress', e.target.value)
              }
              disabled={isLoading}
              size="small"
              multiline
              rows={2}
            />
          </Box>

          <Divider className="invite-modal-divider" />

          <Box className="invite-modal-actions">
            <button
              className="invite-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Close
            </button>
            <button
              className="invite-btn-submit"
              onClick={onSendInvite}
              disabled={isLoading}
            >
              {isLoading 
                ? (isOverTheCounter ? 'REQUESTING...' : 'SENDING...') 
                : (isOverTheCounter ? 'REQUEST CODE' : 'SEND INVITE')}
            </button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return createPortal(modalContent, document.body);
}
