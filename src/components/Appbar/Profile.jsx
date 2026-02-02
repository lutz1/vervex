import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { updateUserProfile } from '../../utils/firestore';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile({ user, userProfile, userRole, onProfileUpdate }) {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [preview, setPreview] = useState(user?.photoURL || userProfile?.avatar || null);
  const [username] = useState(userProfile?.username || '');
  const [fullName, setFullName] = useState(userProfile?.fullName || userProfile?.displayName || '');
  const [birthDate, setBirthDate] = useState(userProfile?.birthDate || '');
  const [contactNumber, setContactNumber] = useState(userProfile?.contactNumber || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [success, setSuccess] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    console.log('Image preview ready:', url);
  };

  const uploadPhotoToFirebase = async (file) => {
    try {
      if (!user?.uid) throw new Error('Missing user id');
      
      setUploading(true);
      const photoRef = ref(storage, `users/${user.uid}/avatar/${Date.now()}_${file.name}`);
      
      // Upload the file to Firebase Storage
      await uploadBytes(photoRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(photoRef);
      
      setUploading(false);
      return photoURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo: ' + error.message);
      setUploading(false);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user?.uid) {
      setError('Missing user id');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        fullName: fullName || null,
        birthDate: birthDate || null,
        contactNumber: contactNumber || null,
        address: address || null,
      };

      // If a new photo was selected, upload it first
      if (selectedFile) {
        const photoURL = await uploadPhotoToFirebase(selectedFile);
        payload.avatar = photoURL;
      }

      // Update Firestore with the new data
      const res = await updateUserProfile(user.uid, payload);
      
      if (res.success) {
        setSuccess(true);
        setSelectedFile(null); // Clear the selected file after successful upload
        
        // Update App state with new profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...userProfile,
            fullName: fullName || null,
            birthDate: birthDate || null,
            contactNumber: contactNumber || null,
            address: address || null,
            avatar: payload.avatar || userProfile?.avatar,
          });
        }

        // Show success message for 2 seconds then redirect
        setTimeout(() => {
          setSuccess(false);
          try {
            // Navigate back based on user role
            if (userRole === 'superadmin') {
              navigate('/superadmin/users');
            } else if (userRole === 'admin') {
              navigate('/admin');
            } else {
              navigate('/member/dashboard');
            }
          } catch (e) {
            window.location.href = '/member/dashboard';
          }
        }, 2000);
      } else {
        setError('Failed to save profile: ' + (res.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    try {
      // Navigate back based on user role
      if (userRole === 'superadmin') {
        navigate('/superadmin/users');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/member/dashboard');
      }
    } catch (e) {
      window.location.href = '/member/dashboard';
    }
  };

  return (
    <div className="profile-container">
      <main className="profile-main">
        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            backgroundColor: '#16a34a',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ✓ Profile saved successfully! Redirecting...
          </div>
        )}

        {/* Header */}
        <div className="profile-header">
          <button
            onClick={handleCancel}
            className="profile-back-button"
            title="Go back"
          >
            ←
          </button>
          <h1 className="profile-header-title">Edit Profile</h1>
          <div className="profile-spacer"></div>
        </div>

        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {preview ? (
                <img
                  alt="User profile"
                  className="profile-avatar-img"
                  src={preview}
                />
              ) : (
                <span className="profile-avatar-placeholder">👤</span>
              )}
            </div>
            <button
              type="button"
              className="profile-camera-button"
              disabled={uploading}
              title="Change profile photo"
              onClick={() => document.getElementById('avatar-input').click()}
            >
              📷
            </button>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: 'none' }}
              disabled={uploading}
              aria-label="Upload profile photo"
            />
          </div>
          <h2 className="profile-username">
            {username || user?.displayName || 'Unnamed'}
          </h2>
          <p className="profile-employee-id">
            Employee ID: #{user?.uid?.slice(0, 5).toUpperCase() || 'N/A'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="profile-form">
          {/* Full Name */}
          <div className="profile-form-group">
            <label className="profile-label">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="profile-input"
              placeholder="Enter your full name"
            />
          </div>

          {/* Username */}
          <div className="profile-form-group">
            <label className="profile-label">Username</label>
            <div className="profile-input-relative">
              <span className="profile-input-prefix">@</span>
              <input
                type="text"
                value={username}
                disabled
                className="profile-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="profile-form-group">
            <label className="profile-label">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="profile-input"
            />
          </div>

          {/* Birthdate */}
          <div className="profile-form-group">
            <label className="profile-label">Birthdate</label>
            <div className="profile-input-relative">
              <input
                type="date"
                value={birthDate ? (birthDate.length >= 10 ? birthDate.substr(0, 10) : birthDate) : ''}
                onChange={(e) => setBirthDate(e.target.value)}
                className="profile-input"
              />
              <span className="profile-input-suffix">📅</span>
            </div>
          </div>

          {/* Contact Number */}
          <div className="profile-form-group">
            <label className="profile-label">Contact Number</label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="profile-input"
              placeholder="Enter your contact number"
            />
          </div>

          {/* Address */}
          <div className="profile-form-group">
            <label className="profile-label">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows="2"
              className="profile-textarea"
              placeholder="Enter your address"
            />
          </div>

          {/* Role & Join Date */}
          <div className="profile-grid">
            <div className="profile-form-group">
              <label className="profile-label">Role</label>
              <input
                type="text"
                value={userProfile?.role || 'user'}
                disabled
                className="profile-input"
              />
            </div>
            <div className="profile-form-group">
              <label className="profile-label">Join Date</label>
              <input
                type="text"
                value={
                  userProfile?.joinDate
                    ? new Date(
                        userProfile.joinDate.seconds
                          ? userProfile.joinDate.seconds * 1000
                          : userProfile.joinDate
                      ).toLocaleDateString()
                    : ''
                }
                disabled
                className="profile-input"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="profile-buttons-container">
            <button
              type="submit"
              disabled={saving || uploading}
              className="profile-save-button"
            >
              <span>💾</span>
              <span>{saving || uploading ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="profile-cancel-button"
              disabled={saving || uploading}
            >
              CANCEL
            </button>
          </div>
        </form>

        {/* Footer Divider */}
        <div className="profile-divider">
          <div className="profile-divider-line"></div>
        </div>
      </main>
    </div>
  );
}
