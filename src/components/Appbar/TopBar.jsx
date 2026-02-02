import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Avatar, IconButton, Menu, MenuItem, Tooltip, ListItemIcon, Divider } from '@mui/material';
import { Person as PersonIcon, Logout as LogoutIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import { getFrameByRole } from '../../utils/firestore';

export default function TopBar({ title, user, userProfile, role, onLogout, isAdminSidebarCollapsed, onToggleAdminSidebar }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const [frameUrl, setFrameUrl] = useState(null);

  const handleOpen = (e) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(e.currentTarget);
    }
  };
  const handleClose = () => setAnchorEl(null);
  const handleProfile = () => {
    handleClose();
    // Navigate based on role
    if (role === 'superadmin') {
      navigate('/superadmin/profile');
    } else if (role === 'admin') {
      navigate('/admin/profile');
    } else {
      navigate('/member/profile');
    }
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const roleColor = (r) => {
    if (!r) return '#d4af37';
    const map = {
      superadmin: '#d4af37',
      vip: '#4ade80',
      ambassador: '#bfa14a',
      supreme: '#d4af37',
      admin: '#d4af37',
      cashier: '#bfa14a',
    };
    return map[r] || '#d4af37';
  };

  const displayName = userProfile?.username || userProfile?.displayName || userProfile?.fullName || '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    let mounted = true;
    const loadFrame = async () => {
      if (!role) return;
      try {
        const f = await getFrameByRole(role);
        if (!mounted || !f) return;

        const url = f.imageUrl || f.url || f.image || f.src;
        if (url) {
          setFrameUrl(url);
          return;
        }

        const storagePath = f.storagePath || f.path || f.filePath || f.filename || f.storageRef || f.storage || f.storage_path;
        if (storagePath) {
          try {
            const variants = [storagePath, `frames/${storagePath}`, storagePath.replace(/^\//, ''), `/${storagePath.replace(/^\//, '')}`];
            let download = null;
            for (const p of variants) {
              try {
                const ref = storageRef(storage, p);
                download = await getDownloadURL(ref);
                if (download) {
                  break;
                }
              } catch (innerErr) {
                // try next
              }
            }
            if (download) {
              if (mounted) setFrameUrl(download);
              return;
            }
          } catch (err) {
            console.error('Failed to resolve frame storage path:', storagePath, err);
          }
        }
      } catch (e) {
        console.error('Failed to load frame for role', role, e);
      }
    };
    loadFrame();
    return () => { mounted = false; };
  }, [role]);

  return (
    <AppBar position="fixed" sx={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', borderBottom: '2px solid #d4af37', top: 0, zIndex: 1400 }}>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Admin Sidebar Toggle Button */}
        {title.includes('ADMIN') && (
          <Tooltip title={isAdminSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              onClick={() => onToggleAdminSidebar(!isAdminSidebarCollapsed)}
              sx={{
                color: '#d4af37',
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                }
              }}
            >
              {isAdminSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}

        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 900,
            letterSpacing: '3px',
            background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>

        <Typography variant="body2" sx={{ mr: 2, color: '#d4af37' }}>
          {displayName}
        </Typography>

        <Tooltip title="Account">
          <IconButton onClick={handleOpen} size="small" sx={{ ml: 1, position: 'relative' }}>
            <Avatar
              src={user?.photoURL || userProfile?.avatar || ''}
              sx={{
                width: 36,
                height: 36,
                bgcolor: (user?.photoURL || userProfile?.avatar) ? 'transparent' : 'transparent',
                color: roleColor(role),
                fontWeight: 700,
                position: 'relative',
                zIndex:2,
              }}
            >
              {initial}
            </Avatar>
            {frameUrl ? (
              <img
                src={frameUrl}
                alt="frame"
                style={{
                  position: 'absolute',
                  top: -20,
                  left: -23,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  objectFit: 'cover',
                  zIndex: 1,
                }}
              />
            ) : (
              <span style={{
                position: 'absolute',
                top: -12,
                left: -12,
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: `3px solid ${roleColor(role)}`,
                boxSizing: 'border-box',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            )}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          PaperProps={{
            sx: {
              backgroundColor: '#000000',
              backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
              color: '#d4af37',
              border: '2px solid #d4af37',
              borderRadius: '4px',
              minWidth: '180px',
              mt: 8,
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }
          }}
        >
          <MenuItem
            onClick={handleProfile}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                color: '#e8d5a1',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', mr: 1 }}>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <Divider sx={{ borderColor: '#d4af37', opacity: 0.3 }} />
          <MenuItem
            onClick={() => { handleClose(); onLogout(); }}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                color: '#e8d5a1',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', mr: 1 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
