import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  Chip,
  IconButton,
  Slider,
  Tab,
  Tabs,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import './ManageTree.css';
import { db, storage } from '../../firebaseConfig';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ROLES = ['VIP', 'admin', 'ambassador', 'supreme', 'cashier'];

export default function ManageTree() {
  const [treeStructure, setTreeStructure] = useState({
    root: { id: 1, name: 'Root Avatar', initials: 'R', color: '#d4af37' },
    level1: [
      { id: 2, name: 'Direct 1', initials: 'D1', color: '#4caf50' },
      { id: 3, name: 'Direct 2', initials: 'D2', color: '#4caf50' },
      { id: 4, name: 'Direct 3', initials: 'D3', color: '#4caf50' },
    ],
  });

  const [treeConfig, setTreeConfig] = useState({
    level2Count: 9,
    level3Count: 27,
    level4Count: 81,
  });

  const [frames, setFrames] = useState([
    { id: 1, name: 'VIP Frame', role: 'VIP', color: '#d4af37', image: null },
    { id: 2, name: 'Admin Frame', role: 'admin', color: '#4caf50', image: null },
    { id: 3, name: 'Ambassador Frame', role: 'ambassador', color: '#2196f3', image: null },
  ]);

  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({ name: '', initials: '' });
  const [editingFrame, setEditingFrame] = useState(null);
  const [frameDialogOpen, setFrameDialogOpen] = useState(false);
  const [frameFormData, setFrameFormData] = useState({ name: '', role: 'VIP' });

  // Load frames from Firestore on mount
  useEffect(() => {
    const loadFrames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'frames'));
        const loadedFrames = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setFrames(loadedFrames);
      } catch (error) {
        console.error('Error loading frames:', error);
      }
    };

    loadFrames();
  }, []);

  const levelColors = {
    root: { bg: 'rgba(212, 175, 55, 0.1)', border: '2px solid #d4af37', label: 'YOU - Root Avatar', count: 1 },
    level1: { bg: 'rgba(76, 175, 80, 0.1)', border: '2px solid rgba(76, 175, 80, 0.5)', label: 'Direct Members', count: 3 },
  };

  const handleOpenDialog = (avatar, level) => {
    setEditingAvatar(avatar);
    setEditingLevel(level);
    if (avatar) {
      setFormData({ name: avatar.name, initials: avatar.initials });
    } else {
      setFormData({ name: '', initials: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAvatar(null);
    setEditingLevel(null);
    setFormData({ name: '', initials: '' });
  };

  const handleSaveAvatar = () => {
    if (!formData.name || !formData.initials) {
      alert('Please fill in all fields');
      return;
    }

    if (editingLevel === 'root') {
      setTreeStructure({
        ...treeStructure,
        root: {
          ...treeStructure.root,
          name: formData.name,
          initials: formData.initials.toUpperCase(),
        },
      });
    } else if (editingLevel === 'level1') {
      const updatedLevel1 = treeStructure.level1.map((item) =>
        item.id === editingAvatar.id
          ? { ...item, name: formData.name, initials: formData.initials.toUpperCase() }
          : item
      );
      setTreeStructure({ ...treeStructure, level1: updatedLevel1 });
    }

    handleCloseDialog();
  };

  const handleDeleteAvatar = (avatar, level) => {
    if (level === 'root') return; // Can't delete root
    if (window.confirm(`Delete ${avatar.name}?`)) {
      if (level === 'level1') {
        setTreeStructure({
          ...treeStructure,
          level1: treeStructure.level1.filter((item) => item.id !== avatar.id),
        });
      }
    }
  };

  const handleOpenFrameDialog = (frame = null) => {
    if (frame) {
      setEditingFrame(frame);
      setFrameFormData({ name: frame.name, role: frame.role });
    } else {
      setEditingFrame(null);
      setFrameFormData({ name: '', role: 'VIP' });
    }
    setFrameDialogOpen(true);
  };

  const handleCloseFrameDialog = () => {
    setFrameDialogOpen(false);
    setEditingFrame(null);
    setFrameFormData({ name: '', role: 'VIP' });
  };

  const handleSaveFrame = async () => {
    if (!frameFormData.name || !frameFormData.role) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingFrame) {
        // Update existing frame
        const frameRef = doc(db, 'frames', editingFrame.id);
        await setDoc(frameRef, {
          name: frameFormData.name,
          role: frameFormData.role,
          color: editingFrame.color,
          image: editingFrame.image || null,
          updatedAt: new Date(),
        });

        setFrames(
          frames.map((frame) =>
            frame.id === editingFrame.id
              ? { 
                  ...frame, 
                  name: frameFormData.name, 
                  role: frameFormData.role,
                  updatedAt: new Date(),
                }
              : frame
          )
        );
      } else {
        // Add new frame
        const newFrameId = `frame-${Date.now()}`;
        const frameRef = doc(db, 'frames', newFrameId);
        await setDoc(frameRef, {
          name: frameFormData.name,
          role: frameFormData.role,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        setFrames([
          ...frames,
          {
            id: newFrameId,
            name: frameFormData.name,
            role: frameFormData.role,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            image: null,
            createdAt: new Date(),
          },
        ]);
      }

      handleCloseFrameDialog();
    } catch (error) {
      console.error('Error saving frame:', error);
      alert('Failed to save frame: ' + error.message);
    }
  };

  const handleDeleteFrame = (frameId) => {
    if (window.confirm('Delete this frame?')) {
      try {
        deleteDoc(doc(db, 'frames', frameId));
        setFrames(frames.filter((frame) => frame.id !== frameId));
      } catch (error) {
        console.error('Error deleting frame:', error);
        alert('Failed to delete frame: ' + error.message);
      }
    }
  };

  const handleFrameImageUpload = async (frameId, file) => {
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `frames/${frameId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update frame in Firestore
      const frameRef = doc(db, 'frames', frameId);
      await setDoc(frameRef, {
        image: downloadURL,
        updatedAt: new Date(),
      }, { merge: true });

      // Update local state
      setFrames(
        frames.map((frame) =>
          frame.id === frameId
            ? { ...frame, image: downloadURL, updatedAt: new Date() }
            : frame
        )
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
    }
  };

  const renderAvatarCard = (avatar, level) => {
    const levelColor = levelColors[level];
    return (
      <Card
        key={avatar.id}
        sx={{
          background: levelColor.bg,
          border: levelColor.border,
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${avatar.color}40`,
          },
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 2 }}>
          <Avatar
            sx={{
              width: level === 'root' ? 72 : level === 'level1' ? 56 : 44,
              height: level === 'root' ? 72 : level === 'level1' ? 56 : 44,
              margin: '0 auto 12px',
              background: `linear-gradient(135deg, ${avatar.color} 0%, ${avatar.color}dd 100%)`,
              color: '#fff',
              fontWeight: 700,
              fontSize: level === 'root' ? '1.5rem' : level === 'level1' ? '1.1rem' : '0.9rem',
              border: `3px solid ${avatar.color}`,
            }}
          >
            {avatar.initials}
          </Avatar>

          <Typography
            sx={{
              fontWeight: 700,
              color: '#fff',
              mb: 0.5,
              fontSize: level === 'root' ? '0.9rem' : '0.8rem',
              wordBreak: 'break-word',
            }}
          >
            {avatar.name}
          </Typography>

          <Chip
            label={`ID: ${avatar.id}`}
            size="small"
            sx={{
              background: `${avatar.color}20`,
              color: avatar.color,
              fontWeight: 600,
              mb: 1,
            }}
          />

          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(avatar, level)}
              sx={{ color: '#d4af37' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {level !== 'root' && (
              <IconButton
                size="small"
                onClick={() => handleDeleteAvatar(avatar, level)}
                sx={{ color: '#f44336' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f1419 0%, #1a2a2a 100%)',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Manage Tree Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: '#a8a8a8' }}>
            Customize avatars, frames, and tree structure for the genealogy display
          </Typography>
        </Box>

        {/* Tab Navigation */}
        <Paper
          sx={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            mb: 4,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#d4af37',
              },
              '& .MuiTab-root': {
                color: '#a8a8a8',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#d4af37',
                },
              },
            }}
          >
            <Tab label="👥 Avatars" />
            <Tab label="⚙️ Configuration" />
            <Tab label="🎨 Frames" />
          </Tabs>
        </Paper>

        {/* Tab 1: Avatars */}
        {selectedTab === 0 && (
          <Box>

        {/* Tree Overview */}
        <Paper
          sx={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            p: 3,
            mb: 4,
            borderRadius: '12px',
          }}
        >
          <Typography variant="h6" sx={{ color: '#d4af37', mb: 2, fontWeight: 700 }}>
            📊 Trinary Tree Structure
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ color: '#d4af37', fontWeight: 700, fontSize: '1.1rem' }}>1</Typography>
              <Typography sx={{ color: '#a8a8a8', fontSize: '0.9rem' }}>Root (You)</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: '1.1rem' }}>3</Typography>
              <Typography sx={{ color: '#a8a8a8', fontSize: '0.9rem' }}>Direct Members</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#2196f3', fontWeight: 700, fontSize: '1.1rem' }}>∞</Typography>
              <Typography sx={{ color: '#a8a8a8', fontSize: '0.9rem' }}>User Invites (Dynamic)</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Root Avatar Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#d4af37', fontWeight: 700 }}>
              👑 YOU - Root Avatar (1)
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={() => handleOpenDialog(treeStructure.root, 'root')}
              sx={{
                color: '#d4af37',
                borderColor: '#d4af37',
                fontWeight: 600,
              }}
              variant="outlined"
            >
              Edit
            </Button>
          </Box>
          <Grid container spacing={2}>
            {renderAvatarCard(treeStructure.root, 'root')}
          </Grid>
        </Box>

        <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', my: 4 }} />

        {/* Level 1 - Direct Members */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700 }}>
              👥 Direct Members - Level 1 ({treeStructure.level1.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog(null, 'level1')}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Add Avatar
            </Button>
          </Box>
          <Grid container spacing={2}>
            {treeStructure.level1.map((avatar) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={avatar.id}>
                {renderAvatarCard(avatar, 'level1')}
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', my: 4 }} />

        {/* Info Box */}
        <Paper
          sx={{
            background: 'rgba(33, 150, 243, 0.08)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            p: 3,
            mb: 4,
            borderRadius: '12px',
          }}
        >
          <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600, mb: 1 }}>
            💡 How It Works
          </Typography>
          <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
            Users will freely decide where they want to place their invites in the tree. When they invite someone
            to an empty slot, that person becomes part of the network. The avatars you create here are templates that
            superadmins can customize and manage.
          </Typography>
        </Paper>
          </Box>
        )}

        {/* Tab 2: Tree Configuration */}
        {selectedTab === 1 && (
          <Box>
            {/* Configuration Overview */}
            <Paper
              sx={{
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                p: 4,
                mb: 4,
                borderRadius: '12px',
              }}
            >
              <Typography variant="h6" sx={{ color: '#d4af37', fontWeight: 700, mb: 3 }}>
                🌳 Configure Tree Levels
              </Typography>

              {/* Level 1 */}
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#d4af37', fontWeight: 700 }}>
                      📍 Level 1 - Direct Members
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
                      Fixed at 3 direct members (controlled by avatars)
                    </Typography>
                  </Box>
                  <Chip label="3 Avatars" sx={{ background: '#d4af37', color: '#1a5f3f', fontWeight: 700 }} />
                </Box>
              </Box>

              {/* Level 2 */}
              <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#4caf50', fontWeight: 700 }}>
                      📍 Level 2 - Team Members
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
                      Customize how many avatars under each direct member
                    </Typography>
                  </Box>
                  <Chip label={`${treeConfig.level2Count} Avatars`} sx={{ background: '#4caf50', color: '#fff', fontWeight: 700 }} />
                </Box>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={treeConfig.level2Count}
                    onChange={(e, newValue) => setTreeConfig({ ...treeConfig, level2Count: newValue })}
                    min={3}
                    max={27}
                    marks={[
                      { value: 3, label: '3' },
                      { value: 9, label: '9' },
                      { value: 27, label: '27' },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ color: '#4caf50' }}
                  />
                </Box>
              </Box>

              {/* Level 3 */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: '#2196f3', fontWeight: 700 }}>
                      📍 Level 3 - Sub-Teams
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
                      Customize how many avatars under each team member
                    </Typography>
                  </Box>
                  <Chip label={`${treeConfig.level3Count} Avatars`} sx={{ background: '#2196f3', color: '#fff', fontWeight: 700 }} />
                </Box>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={treeConfig.level3Count}
                    onChange={(e, newValue) => setTreeConfig({ ...treeConfig, level3Count: newValue })}
                    min={9}
                    max={81}
                    marks={[
                      { value: 9, label: '9' },
                      { value: 27, label: '27' },
                      { value: 81, label: '81' },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ color: '#2196f3' }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Tree Structure Visualization */}
            <Paper
              sx={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                p: 3,
                borderRadius: '12px',
              }}
            >
              <Typography variant="h6" sx={{ color: '#d4af37', fontWeight: 700, mb: 2 }}>
                📊 Current Tree Structure
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px' }}>
                    <Typography sx={{ color: '#d4af37', fontWeight: 700, fontSize: '1.5rem' }}>1</Typography>
                    <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Root</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
                    <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: '1.5rem' }}>3</Typography>
                    <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Level 1</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
                    <Typography sx={{ color: '#4caf50', fontWeight: 700, fontSize: '1.5rem' }}>{treeConfig.level2Count}</Typography>
                    <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Level 2</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
                    <Typography sx={{ color: '#2196f3', fontWeight: 700, fontSize: '1.5rem' }}>{treeConfig.level3Count}</Typography>
                    <Typography sx={{ color: '#a8a8a8', fontSize: '0.85rem' }}>Level 3</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Tab 3: Frames */}
        {selectedTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#d4af37', fontWeight: 700, mb: 1 }}>
                  🎨 Avatar Frames by Role
                </Typography>
                <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
                  Create role-specific frames that will display in the genealogy tree when users log in with that role
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOpenFrameDialog()}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                  color: '#1a5f3f',
                  fontWeight: 700,
                }}
              >
                Add Frame
              </Button>
            </Box>

            {/* Frames grouped by role */}
            {ROLES.map((role) => {
              const roleFrames = frames.filter((f) => f.role === role);
              return (
                <Box key={role} sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: role === 'VIP' ? '#d4af37' : role === 'admin' ? '#4caf50' : role === 'ambassador' ? '#2196f3' : '#9c27b0',
                      fontWeight: 700,
                      mb: 2,
                      pb: 1,
                      borderBottom: `2px solid ${role === 'VIP' ? '#d4af37' : role === 'admin' ? '#4caf50' : role === 'ambassador' ? '#2196f3' : '#9c27b0'}20`,
                    }}
                  >
                    {role.toUpperCase()} Frame
                  </Typography>
                  <Grid container spacing={2}>
                    {roleFrames.length > 0 ? (
                      roleFrames.map((frame) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={frame.id}>
                  <Card
                    sx={{
                      background: `linear-gradient(135deg, ${frame.color}15 0%, ${frame.color}05 100%)`,
                      border: `2px solid ${frame.color}50`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${frame.color}40`,
                      },
                    }}
                  >
                    <CardContent>
                      {/* Frame Preview */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          mb: 2,
                          background: frame.image ? `url(${frame.image})` : `${frame.color}20`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '8px',
                          border: `3px solid ${frame.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!frame.image && (
                          <Box sx={{ textAlign: 'center' }}>
                            <CloudUploadIcon sx={{ color: frame.color, fontSize: '2rem', mb: 1 }} />
                            <Typography sx={{ color: frame.color, fontSize: '0.75rem', fontWeight: 600 }}>
                              Click Edit to Upload
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Typography sx={{ fontWeight: 700, color: '#fff', mb: 2, wordBreak: 'break-word' }}>
                        {frame.name}
                      </Typography>

                      <Chip
                        label={`ID: ${frame.id}`}
                        size="small"
                        sx={{
                          background: `${frame.color}20`,
                          color: frame.color,
                          fontWeight: 600,
                          mb: 2,
                          display: 'block',
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenFrameDialog(frame)}
                          sx={{ color: '#d4af37', flex: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteFrame(frame.id)}
                          sx={{ color: '#f44336', flex: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Paper
                          sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px dashed rgba(212, 175, 55, 0.3)',
                            p: 3,
                            textAlign: 'center',
                          }}
                        >
                          <Typography sx={{ color: '#a8a8a8' }}>No frame created for {role.toUpperCase()} yet</Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Frame Dialog */}
        <Dialog
          open={frameDialogOpen}
          onClose={handleCloseFrameDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
              color: '#fff',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: '#d4af37' }}>
            {editingFrame ? 'Edit Frame' : 'Add New Frame'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Frame Name"
              value={frameFormData.name}
              onChange={(e) => setFrameFormData({ ...frameFormData, name: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d4af37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d4af37',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              select
              label="Role"
              value={frameFormData.role}
              onChange={(e) => setFrameFormData({ ...frameFormData, role: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d4af37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d4af37',
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: '#d4af37',
                },
              }}
            >
              {ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>

            {editingFrame && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    color: '#d4af37',
                    borderColor: '#d4af37',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'rgba(212, 175, 55, 0.1)',
                    },
                  }}
                >
                  Upload Frame Image
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFrameImageUpload(editingFrame.id, e.target.files[0]);
                      }
                    }}
                  />
                </Button>
              </Box>
            )}

            <Typography variant="caption" sx={{ color: '#a8a8a8' }}>
              Upload a custom frame image (PNG, JPG, etc.) to use as avatar borders in the genealogy tree.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseFrameDialog} sx={{ color: '#a8a8a8' }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFrame}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                color: '#1a5f3f',
                fontWeight: 700,
              }}
            >
              Save Frame
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit/Add Avatar Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
              color: '#fff',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: '#d4af37' }}>
            {editingAvatar ? 'Edit Avatar' : 'Add New Avatar'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Avatar Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d4af37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d4af37',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Initials (max 2 characters)"
              value={formData.initials}
              onChange={(e) =>
                setFormData({ ...formData, initials: e.target.value.slice(0, 2).toUpperCase() })
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d4af37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d4af37',
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#a8a8a8' }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAvatar}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                color: '#1a5f3f',
                fontWeight: 700,
              }}
            >
              Save Avatar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
