import React from 'react';
import './BottomNav.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
    </Box>
  );
}
