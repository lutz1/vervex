import React, { useState } from 'react';
import { Box, Avatar, Typography, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { updateUserProfile } from '../../../../../utils/firestore';

export default function Profile({ user, userProfile, onProfileUpdate }) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(user?.photoURL || userProfile?.avatar || null);
  const [username] = useState(userProfile?.username || '');
  const [fullName, setFullName] = useState(userProfile?.fullName || userProfile?.displayName || '');
  const [birthDate, setBirthDate] = useState(userProfile?.birthDate || '');
  const [contactNumber, setContactNumber] = useState(userProfile?.contactNumber || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [saving, setSaving] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    // NOTE: upload handling should be implemented server-side / via Firebase Storage elsewhere
  };

  const handleSave = async () => {
    if (!user?.uid) return alert('Missing user id');
    setSaving(true);
    const payload = {
      fullName: fullName || null,
      birthDate: birthDate || null,
      contactNumber: contactNumber || null,
      address: address || null,
    };
    const res = await updateUserProfile(user.uid, payload);
    setSaving(false);
    if (res.success) {
      alert('Profile saved');
      // Update App state with new profile data
      if (onProfileUpdate) {
        onProfileUpdate({
          ...userProfile,
          fullName: fullName || null,
          birthDate: birthDate || null,
          contactNumber: contactNumber || null,
          address: address || null,
        });
      }
    } else {
      console.error(res.error);
      alert('Failed to save profile');
    }
  };

  return (
    <Box className="pv-profile-root">
      <Box className="pv-profile-card">
        <Box className="pv-profile-left">
          <Avatar src={preview} alt={username || user?.email} sx={{ width: 120, height: 120 }} />
          <input id="pv-avatar-input" type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <label htmlFor="pv-avatar-input">
            <Button variant="contained" component="span" sx={{ mt: 2 }}>Change Photo</Button>
          </label>
        </Box>

        <Box className="pv-profile-right">
          <Typography variant="h5" sx={{ color: '#d4af37', mb: 1 }}>{username || user?.displayName || 'Unnamed'}</Typography>

          <TextField
            label="Fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#bbb' } }}
          />

          <TextField
            label="Username"
            value={username}
            size="small"
            fullWidth
            disabled
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#ddd', color: '#ddd' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Email"
            value={user?.email || ''}
            size="small"
            fullWidth
            disabled
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#ddd', color: '#ddd' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Birthdate"
            type="date"
            value={birthDate ? (birthDate.length >= 10 ? birthDate.substr(0,10) : birthDate) : ''}
            onChange={(e) => setBirthDate(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            size="small"
            fullWidth
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Role"
            value={userProfile?.role || 'user'}
            size="small"
            fullWidth
            disabled
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#ddd', color: '#ddd' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <TextField
            label="Join Date"
            value={userProfile?.joinDate ? new Date(userProfile.joinDate.seconds ? userProfile.joinDate.seconds * 1000 : userProfile.joinDate).toLocaleDateString() : ''}
            size="small"
            fullWidth
            disabled
            sx={{
              mb: 2,
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#bbb' },
              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#ddd', color: '#ddd' },
              '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="contained"
              sx={{ backgroundColor: '#d4af37', color: '#081014', '&:hover': { backgroundColor: '#e8d5a1' } }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outlined" sx={{ borderColor: '#d4af37', color: '#d4af37' }} onClick={() => {
              try {
                navigate(-1);
              } catch (e) {
                window.location.href = '/member/genealogy';
              }
            }}>Cancel</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
