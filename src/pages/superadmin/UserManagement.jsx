import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createOrUpdateUser, USER_ROLES, getUsersByRole, ensureSuperAdminExists } from '../../utils/firestore';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import AddressMapPicker from './components/AddressMapPicker';
import './UserManagement.css';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    birthDate: '',
    email: '',
    contactNumber: '',
    address: '',
    password: '',
    role: 'admin',
  });

  // Load all users on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeSuperAdmin = async () => {
      try {
        // Ensure the current superadmin's document exists (only once)
        if (auth.currentUser && isMounted) {
          await ensureSuperAdminExists(auth.currentUser.uid, auth.currentUser.email);
        }
      } catch (err) {
        console.error('Error initializing superadmin:', err);
      }
      
      // Load users regardless of initialization result
      if (isMounted) {
        await loadAllUsers();
      }
    };
    
    initializeSuperAdmin();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const allRoles = Object.values(USER_ROLES);
      const allUsers = [];

      for (const role of allRoles) {
        const roleUsers = await getUsersByRole(role);
        allUsers.push(...roleUsers);
      }

      setUsers(allUsers);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        birthDate: user.birthDate || '',
        email: user.email,
        contactNumber: user.contactNumber || '',
        address: user.address || '',
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        birthDate: '',
        email: '',
        contactNumber: '',
        address: '',
        password: '',
        role: 'admin',
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      username: '',
      fullName: '',
      birthDate: '',
      email: '',
      contactNumber: '',
      address: '',
      password: '',
      role: 'admin',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
        setError('Username, Full Name, Email, and Password are required');
        return;
      }

      setLoading(true);

      // Get ID token from current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in');
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Call Cloud Function via HTTP
      const response = await fetch(
        'https://us-central1-vervex-c5b91.cloudfunctions.net/createUserHttp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            username: formData.username,
            fullName: formData.fullName,
            birthDate: formData.birthDate,
            email: formData.email,
            contactNumber: formData.contactNumber,
            address: formData.address,
            password: formData.password,
            role: formData.role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to create user');
        return;
      }

      // Show verification instructions if email verification is required
      if (result.verificationLink) {
        const verificationMessage = `User ${formData.fullName} created successfully!

User Details:
- Email: ${result.email}
- Password: ${formData.password}

IMPORTANT - Email Verification Required:
The user must verify their email before they can login.

Verification Link has been generated. You can:
1. Share this link with the user: 
${result.verificationLink}

Or the user can:
1. Check their email for a verification link
2. Click the verification link to verify their email
3. Login with their credentials`;
        alert(verificationMessage);
      } else {
        setSuccess(`User ${formData.fullName} created successfully. Email verification required before login.`);
      }

      handleCloseDialog();
      await loadAllUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.username || !formData.fullName || !formData.email) {
        setError('Username, Full Name, and Email are required');
        return;
      }

      setLoading(true);

      // Update user document
      await createOrUpdateUser(editingUser.uid, {
        username: formData.username,
        fullName: formData.fullName,
        birthDate: formData.birthDate,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address,
        role: formData.role,
      });

      setSuccess(`User ${formData.fullName} updated successfully`);
      handleCloseDialog();
      loadAllUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    const user = users.find(u => u.uid === uid);
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setError('');
      setLoading(true);
      
      // Get ID token from current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in');
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Call Cloud Function via HTTP
      const response = await fetch(
        'https://us-central1-vervex-c5b91.cloudfunctions.net/deleteUserHttp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ userId: userToDelete.uid }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to delete user');
        return;
      }
      
      setSuccess('User deleted successfully');
      await loadAllUsers();
    } catch (err) {
      setError('Failed to delete user: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleUpdateRole = async (uid, newRole) => {
    try {
      setError('');
      setSuccess('');
      // Use Firestore utility to update user role
      await createOrUpdateUser(uid, { role: newRole });
      setSuccess('User role updated successfully');
      await loadAllUsers();
    } catch (err) {
      setError('Failed to update user role: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.role !== 'superadmin' && (
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <Box className="user-management-bg">
      <Container maxWidth="lg" className="user-management-container">
        {/* Header */}
        <Box className="management-header">
          <Button startIcon={<ArrowBackIcon />} className="back-button">
            Back
          </Button>
          <Typography variant="h4" className="management-title">
            User Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/superadmin/manage-tree')}
              sx={{
                color: '#d4af37',
                borderColor: '#d4af37',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(212, 175, 55, 0.1)',
                },
              }}
            >
              Manage Tree
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              className="create-button"
              onClick={() => handleOpenDialog()}
            >
              Create User
            </Button>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" className="alert-message" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" className="alert-message" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Search */}
        <Box className="search-section">
          <TextField
            fullWidth
            placeholder="Search by username, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            className="search-input"
          />
        </Box>

        {/* Users Table */}
        {loading && !users.length ? (
          <Box className="loading-container">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} className="users-table-container">
            <Table className="users-table">
              <TableHead>
                <TableRow className="table-header">
                  <TableCell>Username</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="no-users">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.uid} className="table-row">
                      <TableCell className="user-name" title={user.username}>
                        {user.username && user.username.length > 12
                          ? user.username.substring(0, 10) + '...'
                          : user.username}
                      </TableCell>
                      <TableCell title={user.fullName}>
                        {user.fullName && user.fullName.length > 15
                          ? user.fullName.substring(0, 12) + '...'
                          : user.fullName}
                      </TableCell>
                      <TableCell title={user.email}>
                        {user.email.length > 20
                          ? user.email.substring(0, 17) + '...'
                          : user.email}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" className="role-select" fullWidth>
                          <Select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                          >
                            {Object.entries(USER_ROLES).filter(([key, value]) => value !== 'user').map(([key, value]) => (
                              <MenuItem key={`role-${value}`} value={value}>
                                {key}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                          className="edit-button"
                          title="Edit user"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.uid)}
                          className="delete-button"
                          title="Delete user"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle className="dialog-title">
            {editingUser ? '✎ Edit User Information' : '➕ Create New User'}
          </DialogTitle>
          <DialogContent className="dialog-content">
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                fullWidth
                label="User Name"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                variant="outlined"
                size="medium"
              />
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                variant="outlined"
                size="medium"
              />
              <TextField
                fullWidth
                label="Birth Date"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleInputChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                size="medium"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="outlined"
                size="medium"
              />
              <TextField
                fullWidth
                label="Contact #"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                variant="outlined"
                size="medium"
              />
              <AddressMapPicker
                address={formData.address}
                onAddressChange={(newAddress) =>
                  setFormData({ ...formData, address: newAddress })
                }
              />
              {!editingUser && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  variant="outlined"
                  helperText="Minimum 6 characters. User can change it later."
                  size="medium"
                  required
                />
              )}
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#d4af37 !important' }}>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={handleInputChange}
                  sx={{
                    color: '#f5f5f5 !important',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(212, 175, 55, 0.4) !important',
                      borderWidth: '2px !important',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d4af37 !important',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d4af37 !important',
                    },
                  }}
                >
                  {Object.entries(USER_ROLES).filter(([key, value]) => value !== 'user').map(([key, value]) => (
                    <MenuItem key={`dialog-role-${value}`} value={value}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={handleCloseDialog} sx={{ color: 'rgba(212, 175, 55, 0.8)' }}>
              Cancel
            </Button>
            <Button
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              variant="contained"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Processing...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteConfirmOpen}
          onClose={cancelDelete}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(4, 12, 9, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          <DialogTitle
            sx={{
              color: '#d4af37',
              fontWeight: 600,
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              fontSize: '1.1rem',
            }}
          >
            Delete User
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography sx={{ color: '#f5f5f5', mb: 1 }}>
              Are you sure you want to delete <strong>{userToDelete?.fullName || userToDelete?.username}</strong>?
            </Typography>
            <Typography sx={{ color: '#ff6b6b', fontSize: '0.9rem', mt: 2 }}>
              ⚠️ This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              gap: 1,
              padding: '16px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <Button
              onClick={cancelDelete}
              sx={{
                color: '#d4af37',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                '&:hover': {
                  background: 'rgba(212, 175, 55, 0.1)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteUser}
              variant="contained"
              disabled={loading}
              sx={{
                background: '#ff6b6b',
                color: '#fff',
                '&:hover': {
                  background: '#ee5a52',
                },
                '&:disabled': {
                  background: 'rgba(255, 107, 107, 0.5)',
                },
              }}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
