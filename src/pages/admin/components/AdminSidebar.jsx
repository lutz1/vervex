import React from 'react';
import { Box, Button } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import '../AdminSidebar.css';

export default function AdminSidebar({ activeTab, onTabChange }) {
  const menuItems = [
    { id: 0, label: 'Earnings Overview', icon: <MonetizationOnIcon /> },
    { id: 1, label: 'User Management', icon: <PeopleIcon /> },
    { id: 2, label: 'Code Requests', icon: <ReceiptIcon /> },
    { id: 3, label: 'Transactions', icon: <BarChartIcon /> },
    { id: 4, label: 'Reports', icon: <AssignmentIcon /> },
  ];

  return (
    <Box className="admin-sidebar">
      {menuItems.map((item) => (
        <Button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`admin-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
          startIcon={item.icon}
          fullWidth
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
}
