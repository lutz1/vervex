import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import './Genealogy.css';

export default function Genealogy() {
  const [selectedMember, setSelectedMember] = useState(null);

  const genealogyData = {
    id: 'user1',
    name: 'You',
    role: 'Root Node',
    avatar: '👤',
    level: 0,
    children: [
      {
        id: 'member1',
        name: 'Alan Shaw',
        role: 'Parent',
        avatar: '👨',
        level: 1,
        children: [
          { id: 'child1', name: 'Link', role: 'Child', avatar: '👦', level: 2 },
          { id: 'child2', name: '0 Made', role: 'Child', avatar: '👦', level: 2 },
          { id: 'child3', name: '0 Made', role: 'Child', avatar: '👦', level: 2 },
        ],
      },
      {
        id: 'member2',
        name: 'Jericho Smith',
        role: 'Parent',
        avatar: '👨',
        level: 1,
        children: [
          { id: 'child4', name: '0 Made', role: 'Child', avatar: '👨', level: 2 },
          { id: 'child5', name: '0 Made', role: 'Child', avatar: '👩', level: 2 },
          { id: 'child6', name: '0 Made', role: 'Child', avatar: '👨', level: 2 },
        ],
      },
      {
        id: 'member3',
        name: 'Cassidy Lee',
        role: 'Parent',
        avatar: '👩',
        level: 1,
        children: [
          { id: 'child7', name: 'Link', role: 'Child', avatar: '👦', level: 2 },
          { id: 'child8', name: '0 Made', role: 'Child', avatar: '👦', level: 2 },
          { id: 'child9', name: '0 Made', role: 'Child', avatar: '👦', level: 2 },
        ],
      },
    ],
  };

  const performanceData = {
    directMembers: '3/3',
    teamMembers: '2',
    revenue: '$15.8k',
  };

  const TreeNode = ({ node, isRoot = false }) => (
    <Box className={`tree-node ${isRoot ? 'root-node' : ''}`}>
      <Box
        className={`node-card ${node.level === 0 ? 'node-root' : node.level === 1 ? 'node-parent' : 'node-child'}`}
        onClick={() => setSelectedMember(node)}
      >
        <Box className="node-avatar">{node.avatar}</Box>
        <Typography className="node-name">{node.name}</Typography>
        <Typography className="node-role">{node.role}</Typography>
      </Box>

      {node.children && node.children.length > 0 && (
        <Box className="tree-children">
          <Box className="tree-connector" />
          <Grid container spacing={2} justifyContent="center">
            {node.children.map((child) => (
              <Grid item key={child.id}>
                <TreeNode node={child} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );

  return (
    <Box className="genealogy-bg">
      <Container maxWidth="lg" className="genealogy-container">
        {/* Header */}
        <Box className="genealogy-header">
          <Button startIcon={<ArrowBackIcon />} className="back-button">
            Back
          </Button>
          <Typography variant="h4" className="genealogy-title">
            Trinary Genealogy
          </Typography>
          <Button className="help-button">
            <StarIcon />
          </Button>
        </Box>

        {/* Tree Section */}
        <Box className="tree-section">
          <TreeNode node={genealogyData} isRoot={true} />
        </Box>

        {/* Performance Section */}
        <Box className="performance-section">
          <Box className="performance-header">
            <Typography variant="h6" className="performance-title">
              Trinary Performance
            </Typography>
            <Typography className="performance-label">LIVE STATUS</Typography>
          </Box>

          <Grid container spacing={3} justifyContent="center" className="performance-stats">
            <Grid item xs={12} sm={6} md={4}>
              <Paper className="stat-card">
                <Typography className="stat-value">{performanceData.directMembers}</Typography>
                <Typography className="stat-label">Direct Members</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper className="stat-card">
                <Typography className="stat-value">{performanceData.teamMembers}</Typography>
                <Typography className="stat-label">Team Members</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper className="stat-card">
                <Typography className="stat-value">{performanceData.revenue}</Typography>
                <Typography className="stat-label">Revenue</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Member Details Modal */}
        {selectedMember && (
          <Box className="member-modal">
            <Paper className="member-modal-content">
              <Button
                className="modal-close"
                onClick={() => setSelectedMember(null)}
              >
                ✕
              </Button>
              <Box className="modal-avatar">{selectedMember.avatar}</Box>
              <Typography variant="h5" className="modal-name">
                {selectedMember.name}
              </Typography>
              <Typography className="modal-role">{selectedMember.role}</Typography>
              <Box className="modal-details">
                <Typography>ID: {selectedMember.id}</Typography>
                <Typography>Level: {selectedMember.level}</Typography>
              </Box>
              <Button
                variant="contained"
                className="modal-button"
                onClick={() => setSelectedMember(null)}
              >
                Close
              </Button>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}
