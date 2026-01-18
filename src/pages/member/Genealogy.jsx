
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  TextField,
} from '@mui/material';
import PerformanceStats from './components/genealogycomponents/PerformanceStats';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import './Genealogy.css';

export default function Genealogy() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [expandedNode, setExpandedNode] = useState(null);
  const [inviteSlot, setInviteSlot] = useState(null);
  const [genealogyTree, setGenealogyTree] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchGenealogyTree = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return;
      }
      try {
        
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          return;
        }
        const userData = userDocSnap.data();

        // Fetch direct referrals (3 children)
        
        const usersCollection = collection(db, 'users');
        const allUsers = await getDocs(usersCollection);
        
        const directReferrals = [];
        
        allUsers.forEach(userSnap => {
          const user = userSnap.data();
          if (user.referrerId === currentUser.uid) {
            directReferrals.push({
              id: userSnap.id,
              name: user.name || 'Unnamed',
              role: user.role || 'Member',
              avatar: user.avatar || user.name?.[0] || 'U',
              type: 'wing',
              children: [],
            });
          }
        });

        // Fill up to 3 direct referrals with empty slots
        while (directReferrals.length < 3) {
          directReferrals.push({
            id: `empty-direct-${directReferrals.length}`,
            name: null,
            role: null,
            avatar: null,
            type: 'wing',
            isEmpty: true,
            children: [],
          });
        }

        // For each direct referral, fetch their team members (3 per referral)
        for (let i = 0; i < directReferrals.length; i++) {
          const referral = directReferrals[i];
          if (!referral.isEmpty) {
            const teamMembers = [];
            allUsers.forEach(userSnap => {
              const user = userSnap.data();
              if (user.referrerId === referral.id) {
                teamMembers.push({
                  id: userSnap.id,
                  name: user.name || 'Unnamed',
                  role: user.role || 'Member',
                  avatar: user.avatar || user.name?.[0] || 'U',
                  type: 'sub',
                  status: 'ACTIVE',
                });
              }
            });

            // Fill up to 3 team members with empty slots
            while (teamMembers.length < 3) {
              teamMembers.push({
                id: `empty-sub-${referral.id}-${teamMembers.length}`,
                name: null,
                role: null,
                avatar: null,
                type: 'sub',
                status: 'EMPTY',
                isEmpty: true,
              });
            }
            referral.children = teamMembers;
          } else {
            // Add 3 empty sub-nodes for empty referral slots
            const emptyTeam = [];
            for (let j = 0; j < 3; j++) {
              emptyTeam.push({
                id: `empty-sub-${referral.id}-${j}`,
                name: null,
                type: 'sub',
                status: 'EMPTY',
                isEmpty: true,
              });
            }
            referral.children = emptyTeam;
          }
        }

        setGenealogyTree({
          ...userData,
          id: currentUser.uid,
          name: userData.name || userData.email,
          role: userData.role || 'Member',
          email: userData.email,
          avatar: userData.avatar || (userData.name ? userData.name[0] : 'U'),
          type: 'root',
          children: directReferrals,
        });
        
      } catch (error) {
        console.error('Error fetching genealogy tree:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
    };
    fetchGenealogyTree();
  }, []);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!inviteSlot) {
      alert('No slot selected');
      return;
    }

    setInviting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('You must be logged in');
        setInviting(false);
        return;
      }

      // Determine the parent ID for the new user
      const parentId = inviteSlot.type === 'wing' ? genealogyTree.id : inviteSlot.parentId || genealogyTree.id;

      // Create invitation document in separate invitations collection
      const invitationsRef = collection(db, 'invitations');
      await addDoc(invitationsRef, {
        invitedEmail: inviteEmail.toLowerCase(),
        invitedName: inviteName,
        parentId: parentId,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'pending', // 'pending', 'accepted', 'rejected'
        invitationLink: `${window.location.origin}/accept-invitation?inviterId=${currentUser.uid}&parentId=${parentId}`,
      });

      alert('Invitation sent successfully!');
      setInviteEmail('');
      setInviteName('');
      setInviteSlot(null);
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  // Compute performance stats from genealogyTree
  const performanceData = React.useMemo(() => {
    if (!genealogyTree) return {
      directMembers: 0,
      teamMembers: 0,
      revenue: '$0',
      commissionRate: '0%',
      monthlyGrowth: '0%',
      totalCommission: '$0',
    };
    // Direct members: non-empty direct referrals
    const directMembers = (genealogyTree.children || []).filter(m => !m.isEmpty).length;
    // Team members: non-empty sub nodes under each direct referral
    let teamMembers = 0;
    (genealogyTree.children || []).forEach(ref => {
      if (ref.children) {
        teamMembers += ref.children.filter(m => !m.isEmpty).length;
      }
    });
    // Revenue and commission: sum up from all team members (example: $100/member)
    const revenue = `$${(teamMembers * 100 + directMembers * 200).toLocaleString()}`;
    // Commission rate: example static or based on directMembers
    const commissionRate = directMembers >= 3 ? '12.5%' : '5%';
    // Monthly growth: example based on new members this month (not implemented, fallback)
    const monthlyGrowth = teamMembers + directMembers > 0 ? '+28.5%' : '0%';
    // Total commission: example $20 per direct member
    const totalCommission = `$${(directMembers * 20).toLocaleString()}`;
    return {
      directMembers,
      teamMembers,
      revenue,
      commissionRate,
      monthlyGrowth,
      totalCommission,
    };
  }, [genealogyTree]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return '#4caf50';
      case 'Inactive':
        return '#f44336';
      case 'Pending':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Active':
        return 'rgba(76, 175, 80, 0.1)';
      case 'Inactive':
        return 'rgba(244, 67, 54, 0.1)';
      case 'Pending':
        return 'rgba(255, 152, 0, 0.1)';
      default:
        return 'rgba(117, 117, 117, 0.1)';
    }
  };





  const TreeNode = ({ node }) => {
    // Root node
    if (node.type === 'root') {
      return (
        <Box className="node-root">
          <Box className="node-root-box">
            <Avatar className="node-root-avatar">{node.avatar}</Avatar>
            <Typography variant="h6" className="node-root-name">You</Typography>
            <Typography variant="body2" className="node-root-role">{node.role?.toUpperCase() || 'ROOT NODE'}</Typography>
          </Box>
          {/* Connector */}
          <Box className="connector-vertical" />
          {/* Horizontal line */}
          <Box className="connector-horizontal" />
          {/* Children */}
          <Box className="node-children-container">
            {node.children?.map(child => <TreeNode key={child.id} node={child} />)}
          </Box>
        </Box>
      );
    }
    // Wing node
    if (node.type === 'wing') {
      if (node.isEmpty) {
        return (
          <Box className="node-wing">
            <Button
              onClick={() => setInviteSlot(node)}
              className="empty-slot-wing"
            >
              +
            </Button>
            {/* Connector */}
            <Box className="wing-connector" />
            {/* Sub-nodes */}
            <Box className="wing-sub-container">
              {node.children?.map(sub => <TreeNode key={sub.id} node={sub} />)}
            </Box>
          </Box>
        );
      }
      return (
        <Box className="node-wing">
          <Box className="node-wing-box">
            <Avatar className="node-wing-avatar">{node.avatar}</Avatar>
            <Typography variant="subtitle1" className="node-wing-name">{node.name}</Typography>
            <Typography variant="body2" className="node-wing-label">Center Wing</Typography>
          </Box>
          {/* Connector */}
          <Box className="wing-connector" />
          {/* Sub-nodes */}
          <Box className="wing-sub-container">
            {node.children?.map(sub => <TreeNode key={sub.id} node={sub} />)}
          </Box>
        </Box>
      );
    }
    // Sub-node
    if (node.type === 'sub') {
      if (node.isEmpty) {
        return (
          <Button
            onClick={() => setInviteSlot(node)}
            className="empty-slot-sub"
          >
            +
          </Button>
        );
      }
      return (
        <Box className="node-sub-box">
          <Avatar className="node-sub-avatar">{node.avatar}</Avatar>
          <Typography variant="caption" className="node-sub-name">{node.name}</Typography>
          <Typography variant="caption" className="node-sub-label">Left</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="genealogy-main-container">
      <Container maxWidth="lg">
        {/* Header */}
        <Box className="genealogy-header">
          <Box className="genealogy-header-content">
            <Typography variant="h4" className="genealogy-title">
              Network Genealogy
            </Typography>
            <Typography variant="body2" className="genealogy-subtitle">
              Manage and track your network structure
            </Typography>
          </Box>
        </Box>


        {/* Performance Stats */}
        <PerformanceStats performanceData={performanceData} />

        {/* Tree Section */}
        <Box className="tree-container">
          <Box className="tree-content">
            {genealogyTree ? (
              <TreeNode node={genealogyTree} />
            ) : (
              <Typography className="tree-loading">
                Loading genealogy tree...
              </Typography>
            )}
          </Box>
        </Box>

        {/* Member Details Modal */}
        {selectedMember && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              p: 2,
            }}
            onClick={() => setSelectedMember(null)}
          >
            <Card
              sx={{
                width: '100%',
                maxWidth: 500,
                background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
                color: '#fff',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    onClick={() => setSelectedMember(null)}
                    sx={{
                      color: '#d4af37',
                      minWidth: 'auto',
                      p: 0,
                      fontSize: '1.5rem',
                    }}
                  >
                    ✕
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                      color: '#1a5f3f',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                    }}
                  >
                    {selectedMember.avatar}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedMember.name}
                  </Typography>
                  <Chip
                    label={selectedMember.status}
                    sx={{
                      backgroundColor: getStatusBgColor(selectedMember.status),
                      color: getStatusColor(selectedMember.status),
                      fontWeight: 600,
                      mb: 2,
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#a8a8a8', display: 'block', mb: 0.5 }}>
                    Role
                  </Typography>
                  <Typography sx={{ mb: 2 }}>{selectedMember.role}</Typography>

                  <Typography variant="caption" sx={{ color: '#a8a8a8', display: 'block', mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography sx={{ mb: 2, color: '#d4af37' }}>{selectedMember.email}</Typography>

                  <Typography variant="caption" sx={{ color: '#a8a8a8', display: 'block', mb: 0.5 }}>
                    Join Date
                  </Typography>
                  <Typography sx={{ mb: 2 }}>{selectedMember.joinDate}</Typography>

                  <Typography variant="caption" sx={{ color: '#a8a8a8', display: 'block', mb: 0.5 }}>
                    Level
                  </Typography>
                  <Typography>{selectedMember.level === 0 ? 'Root Node' : selectedMember.level === 1 ? 'Direct' : 'Team'}</Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setSelectedMember(null)}
                    sx={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                      color: '#1a5f3f',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e8d5a1 0%, #d4af37 100%)',
                      },
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Expanded Node Modal - Shows Full Subtree */}
        {expandedNode && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              p: 2,
              overflow: 'auto',
            }}
            onClick={() => setExpandedNode(null)}
          >
            <Card
              sx={{
                width: '100%',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: 'linear-gradient(135deg, #1a2a2a 0%, #0f1419 100%)',
                color: '#fff',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#d4af37' }}>
                    {expandedNode.name}'s Network
                  </Typography>
                  <Button
                    onClick={() => setExpandedNode(null)}
                    sx={{
                      color: '#d4af37',
                      minWidth: 'auto',
                      p: 0,
                      fontSize: '1.5rem',
                    }}
                  >
                    ✕
                  </Button>
                </Box>

                <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', mb: 3 }} />

                {/* Expanded Tree */}
                <Box sx={{ overflow: 'auto' }}>
                  <TreeNode node={expandedNode} isRoot={true} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Invite Slot Modal - Add New Member */}
        {inviteSlot && (
          <Box className="modal-overlay" onClick={() => setInviteSlot(null)}>
            <Card className="modal-card" onClick={(e) => e.stopPropagation()}>
              <CardContent sx={{ p: 3 }}>
                <Box className="modal-header">
                  <Typography variant="h6" className="modal-title">
                    Invite New Member
                  </Typography>
                  <Button
                    onClick={() => setInviteSlot(null)}
                    className="modal-close-btn"
                  >
                    ✕
                  </Button>
                </Box>

                <Divider className="modal-divider" />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" className="modal-description">
                    Send an invitation link to add a new member to this position.
                  </Typography>

                  <Box className="form-input">
                    <TextField
                      fullWidth
                      label="Email Address"
                      variant="outlined"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={inviting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(0, 255, 65, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#00ff41',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00ff41',
                          },
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: '#666',
                          opacity: 1,
                        },
                        '& .MuiInputLabel-root': {
                          color: '#8fbc8f',
                        },
                      }}
                    />
                  </Box>

                  <Box className="form-input">
                    <TextField
                      fullWidth
                      label="Full Name"
                      variant="outlined"
                      placeholder="Member Name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      disabled={inviting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'rgba(0, 255, 65, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#00ff41',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00ff41',
                          },
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: '#666',
                          opacity: 1,
                        },
                        '& .MuiInputLabel-root': {
                          color: '#8fbc8f',
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Divider className="modal-divider" />

                <Box className="modal-actions">
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setInviteSlot(null)}
                    className="btn-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleInviteMember}
                    disabled={inviting}
                    className="btn-submit"
                  >
                    {inviting ? 'Inviting...' : 'Send Invite'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
}
