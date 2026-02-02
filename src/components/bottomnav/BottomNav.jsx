import React, { useState } from 'react';
import './BottomNav.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const mapPathToIndex = (path) => {
    if (path.startsWith('/member/dashboard') || path === '/member') return 0; // Home / Dashboard
    if (path.startsWith('/member/genealogy')) return 1; // Network
    if (path.startsWith('/member/profile')) return 3;
    if (path.startsWith('/superadmin')) return 0;
    if (path === '/' || path === '/login') return 0;
    // fallback: use pathname to guess
    return 0;
  };

  const indexToPath = (i) => {
    switch (i) {
      case 0:
        return '/member/dashboard';
      case 1:
        return '/member/genealogy';
      case 2:
        return '/member/bonuses';
      case 3:
        return '/member/profile';
      default:
        return '/member/dashboard';
    }
  };

  const [value, setValue] = React.useState(() => mapPathToIndex(location.pathname));

  React.useEffect(() => {
    setValue(mapPathToIndex(location.pathname));
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    // Show coming soon for bonuses tab (index 2)
    if (newValue === 2) {
      setShowComingSoon(true);
      return;
    }
    
    setValue(newValue);
    const p = indexToPath(newValue);
    navigate(p);
  };

  return (
    <Box className="pv-bottomnav-root">
      <BottomNavigation showLabels value={value} onChange={handleChange} className="pv-bottomnav">
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Network" icon={<GroupsIcon />} />
        <BottomNavigationAction label="Bonuses" icon={<LocalAtmIcon />} />
        <BottomNavigationAction label="Profile" icon={<AccountCircleIcon />} />
      </BottomNavigation>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onClose={() => setShowComingSoon(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          color: '#d4af37',
          fontWeight: 700,
          fontSize: '1.3rem',
          textAlign: 'center',
          borderBottom: '2px solid #d4af37',
        }}>
          🎁 Coming Soon
        </DialogTitle>
        <DialogContent sx={{ 
          background: '#000000',
          py: 3,
        }}>
          <Typography sx={{ 
            color: '#f5f5f5',
            textAlign: 'center',
            fontSize: '1rem',
            mb: 2,
          }}>
            The Bonuses feature is coming soon!
          </Typography>
          <Typography sx={{ 
            color: '#d4af37',
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: 600,
          }}>
            Please patiently wait for this exciting feature to be released.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          background: '#000000',
          borderTop: '2px solid #d4af37',
          p: 2,
          gap: 1,
        }}>
          <Button
            onClick={() => setShowComingSoon(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
              color: '#000000',
              fontWeight: 700,
              width: '100%',
              '&:hover': {
                background: 'linear-gradient(135deg, #e8d5a1 0%, #d4af37 100%)',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.5)',
              },
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
