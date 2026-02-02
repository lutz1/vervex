
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import { auth, db, storage } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, serverTimestamp, addDoc, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { getFrameByRole } from '../../utils/firestore';
import PaymentMethodSelection from './components/PaymentMethodSelection';
import InviteNewMember from './components/InviteNewMember';
import ActivateCodeModal from './components/ActivateCodeModal';
import ReceiptUploadModal from './components/ReceiptUploadModal';
import './Genealogy.css';

export default function Genealogy() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteSlot, setInviteSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [genealogyTree, setGenealogyTree] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [frameStyle, setFrameStyle] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const treeShellRef = useRef(null);
  const lastDistanceRef = useRef(0);
  const [frameUrl, setFrameUrl] = useState(null);
  const [inviteSlotStatuses, setInviteSlotStatuses] = useState({}); // Track invite slot codes and statuses
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCodeSlot, setSelectedCodeSlot] = useState(null);
  const [activatingCode, setActivatingCode] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [pendingCodeRequest, setPendingCodeRequest] = useState(null);
  const [inviteData, setInviteData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    username: '',
    birthdate: '',
    contactNumber: '',
    email: '',
    fullAddress: '',
    fullName: '',
    role: 'vip',
  });
  
  const BRANCHING = 3;

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

        // Fetch role-based frame definition and image
        try {
          const frame = await getFrameByRole(userData.role || '');
          if (frame) {
            setFrameStyle({
              borderColor: frame.borderColor || frame.color || '#6584ff',
              shadowColor: frame.shadowColor || frame.glowColor || frame.borderColor || 'rgba(101,132,255,0.35)',
            });

            const directUrl = frame.imageUrl || frame.url || frame.image || frame.src;
            if (directUrl) {
              setFrameUrl(directUrl);
            } else {
              const storagePath = frame.storagePath || frame.path || frame.filePath || frame.filename || frame.storageRef || frame.storage || frame.storage_path;
              if (storagePath) {
                const variants = [storagePath, `frames/${storagePath}`, storagePath.replace(/^\//, ''), `/${storagePath.replace(/^\//, '')}`];
                for (const p of variants) {
                  try {
                    const ref = storageRef(storage, p);
                    const download = await getDownloadURL(ref);
                    if (download) {
                      setFrameUrl(download);
                      break;
                    }
                  } catch (innerErr) {
                    // try next variant
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('frames fetch failed, using default frame', err);
        }

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
                  children: [],
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
                children: [],
              });
            }

            // Add third level: 3 nodes under each second-level node (27 total per wing)
            for (let j = 0; j < teamMembers.length; j++) {
              const subNode = teamMembers[j];
              const thirdLevelNodes = [];
              
              if (!subNode.isEmpty) {
                // Try to fetch actual users with this sub-node as parent
                allUsers.forEach(userSnap => {
                  const user = userSnap.data();
                  if (user.referrerId === subNode.id) {
                    thirdLevelNodes.push({
                      id: userSnap.id,
                      name: user.name || 'Unnamed',
                      role: user.role || 'Member',
                      avatar: user.avatar || user.name?.[0] || 'U',
                      type: 'subsub',
                      status: 'ACTIVE',
                    });
                  }
                });
              }

              // Fill up to 3 nodes in third level
              while (thirdLevelNodes.length < 3) {
                thirdLevelNodes.push({
                  id: `empty-subsub-${subNode.id}-${thirdLevelNodes.length}`,
                  name: null,
                  role: null,
                  avatar: null,
                  type: 'subsub',
                  status: 'EMPTY',
                  isEmpty: true,
                });
              }

              subNode.children = thirdLevelNodes;
            }

            referral.children = teamMembers;
          } else {
            // Add 3 empty sub-nodes for empty referral slots
            const emptyTeam = [];
            for (let j = 0; j < 3; j++) {
              const emptySubNode = {
                id: `empty-sub-${referral.id}-${j}`,
                name: null,
                type: 'sub',
                status: 'EMPTY',
                isEmpty: true,
                children: [],
              };

              // Add 3 empty third-level nodes under each empty second-level node
              const emptyThirdLevel = [];
              for (let k = 0; k < 3; k++) {
                emptyThirdLevel.push({
                  id: `empty-subsub-${emptySubNode.id}-${k}`,
                  name: null,
                  role: null,
                  avatar: null,
                  type: 'subsub',
                  status: 'EMPTY',
                  isEmpty: true,
                });
              }
              emptySubNode.children = emptyThirdLevel;
              emptyTeam.push(emptySubNode);
            }
            referral.children = emptyTeam;
          }
        }

        setGenealogyTree({
          ...userData,
          id: currentUser.uid,
          name: userData.name || 'Member',
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

  // Handle pinch zoom on mobile
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (e.touches.length !== 2) return;
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastDistanceRef.current > 0) {
        const scale = distance / lastDistanceRef.current;
        setZoomLevel(prev => {
          const newZoom = Math.max(0.5, Math.min(2, prev * scale));
          return newZoom;
        });
      }
      
      lastDistanceRef.current = distance;
      e.preventDefault();
    };
    
    const handleTouchEnd = () => {
      lastDistanceRef.current = 0;
    };
    
    const treeContainer = treeShellRef.current?.parentElement;
    if (treeContainer) {
      treeContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      treeContainer.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        treeContainer.removeEventListener('touchmove', handleTouchMove);
        treeContainer.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  // Fetch invite slot statuses (for code display) - with real-time updates
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Set up real-time listener for code requests
    const codeRequestsRef = collection(db, 'codeRequests');
    const q = query(codeRequestsRef, where('inviterId', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statuses = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.inviteSlotId) {
          // Store code request data with invite slot ID as key
          statuses[data.inviteSlotId] = {
            ...statuses[data.inviteSlotId],
            code: data.generatedCode,
            status: data.status,
            inviteData: data.inviteData,
            role: data.role,
            codeRequestId: doc.id,
            receiptUrl: data.receiptUrl,
          };
        }
      });

      setInviteSlotStatuses(statuses);
    }, (error) => {
      console.error('Error listening to invite slot statuses:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleInviteMember = async () => {
    const { email, firstName, middleName, surname, username, birthdate, contactNumber, fullAddress, role } = inviteData;

    if (!email.trim() || !firstName.trim() || !surname.trim() || !username.trim() || !contactNumber.trim() || !fullAddress.trim()) {
      alert('Please fill in all required fields');
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

      // If over-the-counter, create a pending code request
      if (paymentMethod === 'over-the-counter') {
        // Create code request document in Firebase
        const codeRequestsRef = collection(db, 'codeRequests');
        const docRef = await addDoc(codeRequestsRef, {
          inviterId: currentUser.uid,
          inviteData: inviteData,
          inviteSlot: {
            id: inviteSlot.id,
            type: inviteSlot.type,
            parentId: parentId,
          },
          inviteSlotId: inviteSlot.id,
          role: role,
          status: 'pending receipt',
          receiptUrl: null,
          generatedCode: null,
          codeGeneratedAt: null,
          codeGeneratedBy: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Immediately update local state (while real-time listener catches up)
        setInviteSlotStatuses(prev => ({
          ...prev,
          [inviteSlot.id]: {
            codeRequestId: docRef.id,
            status: 'pending receipt',
            inviteData: inviteData,
            role: role,
          },
        }));

        // Close the modal and show alert
        handleCloseInvite();
        alert('Request created! Please upload your payment receipt.');
      } else {
        // Online payment - create invitation directly
        const invitationsRef = collection(db, 'invitations');
        await addDoc(invitationsRef, {
          invitedEmail: email.toLowerCase(),
          invitedName: firstName + ' ' + surname,
          firstName: firstName,
          middleName: middleName,
          surname: surname,
          username: username,
          birthdate: birthdate,
          fullAddress: fullAddress,
          contactNumber: contactNumber,
          paymentMethod: paymentMethod,
          role: role,
          parentId: parentId,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          status: 'pending payment',
          invitationLink: `${window.location.origin}/accept-invitation?inviterId=${currentUser.uid}&parentId=${parentId}`,
        });

        alert('Invitation sent successfully!');
      }

      resetInviteForm();
      setInviteSlot(null);
      setShowPaymentSelection(false);
      setPaymentMethod(null);
    } catch (error) {
      console.error('Error processing invitation:', error);
      alert('Failed to process invitation: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const resetInviteForm = () => {
    setInviteData({
      firstName: '',
      middleName: '',
      surname: '',
      username: '',
      birthdate: '',
      contactNumber: '',
      email: '',
      fullAddress: '',
      fullName: '',
      role: 'vip',
    });
  };

  const handleInviteDataChange = (field, value) => {
    setInviteData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInviteSlotClick = (slot) => {
    setInviteSlot(slot);
    setShowPaymentSelection(true);
    resetInviteForm();
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setShowPaymentSelection(false);
  };

  const handleCloseInvite = () => {
    setInviteSlot(null);
    setShowPaymentSelection(false);
    setPaymentMethod(null);
    resetInviteForm();
  };

  const handleReceiptUploadSuccess = async (receiptUrl) => {
    try {
      if (!pendingCodeRequest) return;

      // Update the code request with receipt URL
      const codeRequestRef = doc(db, 'codeRequests', pendingCodeRequest.id);
      await updateDoc(codeRequestRef, {
        receiptUrl: receiptUrl,
        status: 'waiting for code generation',
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setInviteSlotStatuses(prev => ({
        ...prev,
        [pendingCodeRequest.inviteSlot.id]: {
          ...prev[pendingCodeRequest.inviteSlot.id],
          status: 'Pending Receipt ✓',
          code: null,
          receiptUrl: receiptUrl,
          codeRequestId: pendingCodeRequest.id,
        },
      }));

      alert('Receipt uploaded! Admin will generate your code shortly.');
      setShowReceiptUpload(false);
      setPendingCodeRequest(null);
    } catch (error) {
      console.error('Error updating code request:', error);
      alert('Error saving receipt: ' + error.message);
    }
  };

  const handleShowCodeModal = (slot) => {
    setSelectedCodeSlot(slot);
    setShowCodeModal(true);
  };

  const handleActivateCode = async () => {
    if (!selectedCodeSlot) return;

    setActivatingCode(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('You must be logged in');
        setActivatingCode(false);
        return;
      }

      const slotStatus = inviteSlotStatuses[selectedCodeSlot.id];
      if (!slotStatus || !slotStatus.code) {
        alert('Code not found');
        setActivatingCode(false);
        return;
      }

      // Create invitation document with the code payment method
      const invitationsRef = collection(db, 'invitations');
      const invitationData = {
        invitedEmail: slotStatus.inviteData?.email || '',
        invitedName: `${slotStatus.inviteData?.firstName || ''} ${slotStatus.inviteData?.surname || ''}`,
        firstName: slotStatus.inviteData?.firstName || '',
        middleName: slotStatus.inviteData?.middleName || '',
        surname: slotStatus.inviteData?.surname || '',
        username: slotStatus.inviteData?.username || '',
        birthdate: slotStatus.inviteData?.birthdate || '',
        fullAddress: slotStatus.inviteData?.fullAddress || '',
        contactNumber: slotStatus.inviteData?.contactNumber || '',
        paymentCode: slotStatus.code,
        paymentMethod: 'over-the-counter',
        role: slotStatus.inviteData?.role || 'vip',
        parentId: selectedCodeSlot.parentId || genealogyTree.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'payment completed',
        invitationLink: `${window.location.origin}/accept-invitation?inviterId=${currentUser.uid}&parentId=${selectedCodeSlot.parentId || genealogyTree.id}`,
      };

      await addDoc(invitationsRef, invitationData);

      // Call Cloud Function to register user in Firebase Authentication and Firestore
      const idToken = await currentUser.getIdToken();
      const cloudFunctionUrl = 'https://us-central1-vervex-c5b91.cloudfunctions.net/registerUserFromCodeHttp';
      
      const response = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          invitationData: invitationData,
          codeRequestId: slotStatus.codeRequestId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Cloud function error: ${result.error}`);
      }

      // Send verification email to the new user
      if (result.verificationLink) {
        try {
          // Provide the user with verification instructions
          const verificationMessage = `Code activated successfully!

A verification link has been generated and will be sent to: ${result.email}

User Details:
- Email: ${result.email}
- Default Password: ${result.defaultPassword}

The member needs to:
1. Check their email inbox for the verification link
2. Click the verification link to verify their email
3. Login with their credentials
4. Change their default password

If they don't receive the email within 5 minutes, they can verify by:
- Logging in with the credentials above
- Firebase will automatically send a verification email on login`;
          alert(verificationMessage);
        } catch (error) {
          console.error('Error in verification process:', error);
          alert('Code activated! Member registered in the system.\n\nVerification email will be sent to their registered email address.');
        }
      }

      setShowCodeModal(false);
      setSelectedCodeSlot(null);

      // Refresh the genealogy tree
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('Error activating code:', error);
      alert('Failed to activate code: ' + error.message);
    } finally {
      setActivatingCode(false);
    }
  };

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


  const normalizedWings = useMemo(() => {
    if (!genealogyTree) return [];
    const base = [...(genealogyTree.children || [])];
    while (base.length < BRANCHING) {
      base.push({
        id: `empty-wing-${base.length}`,
        name: null,
        role: null,
        avatar: null,
        isEmpty: true,
        children: [],
      });
    }
    return base.slice(0, BRANCHING).map((wing, wingIndex) => {
      const children = Array.isArray(wing.children) ? [...wing.children] : [];
      while (children.length < BRANCHING) {
        const emptySubNode = {
          id: `empty-sub-${wing.id || wingIndex}-${children.length}`,
          name: null,
          role: null,
          avatar: null,
          status: 'EMPTY',
          isEmpty: true,
          parentId: wing.id,
          children: [],
        };
        // Add empty third-level nodes
        for (let k = 0; k < BRANCHING; k++) {
          emptySubNode.children.push({
            id: `empty-subsub-${emptySubNode.id}-${k}`,
            name: null,
            role: null,
            avatar: null,
            status: 'EMPTY',
            isEmpty: true,
          });
        }
        children.push(emptySubNode);
      }
      
      // Ensure each sub-node has exactly BRANCHING children
      const normalizedChildren = children.slice(0, BRANCHING).map(subChild => {
        const subChildren = Array.isArray(subChild.children) ? [...subChild.children] : [];
        while (subChildren.length < BRANCHING) {
          subChildren.push({
            id: `empty-subsub-${subChild.id}-${subChildren.length}`,
            name: null,
            role: null,
            avatar: null,
            status: 'EMPTY',
            isEmpty: true,
          });
        }
        return { ...subChild, children: subChildren.slice(0, BRANCHING) };
      });
      
      return { ...wing, children: normalizedChildren };
    });
  }, [genealogyTree]);

  

  const renderWingCard = (wing, position) => {
    const isCenter = position === 'center';
    const label = wing?.role || (isCenter ? 'Center Wing' : position === 'left' ? 'Left Wing' : 'Right Wing');
    const isEmpty = !!wing?.isEmpty;
    const slotStatus = inviteSlotStatuses[wing?.id];
    const hasPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt') || slotStatus?.status === 'waiting for code generation';
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    const statusText = hasPendingReceipt ? 'Pending Receipt' : hasCode ? 'Ready to Activate' : isEmpty ? 'Empty' : 'Active';

    if (wing?.isEmpty) {
      return (
        <Box 
          className={`wing-card empty-wing ${position}`}
          onClick={() => {
            if (hasCode) {
              handleShowCodeModal(wing);
            } else if (hasPendingReceipt) {
              setShowReceiptUpload(true);
              setPendingCodeRequest({
                id: slotStatus.codeRequestId,
                inviteSlot: wing,
              });
            } else if (isEmpty) {
              handleInviteSlotClick(wing);
            }
          }}
        >
          <Button className="empty-slot-wing">+</Button>
          <Typography className="wing-empty-text">Add direct member</Typography>
          <Typography className={`wing-status ${isEmpty && !hasPendingReceipt && !hasCode ? 'empty' : hasPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{statusText}</Typography>
          <Typography className="wing-role subtle">{label}</Typography>
        </Box>
      );
    }

    return (
      <Box className={`wing-card ${position}`}>
        <Box className={`wing-avatar-wrap ${isCenter ? 'highlight' : ''}`}>
          {wing.avatar && wing.avatar.startsWith('http') ? (
            <img 
              className="wing-avatar"
              src={wing.avatar}
              alt={wing.name}
            />
          ) : (
            <div className="wing-avatar">
              {wing.avatar || wing.name?.[0] || 'U'}
            </div>
          )}
        </Box>
        <Typography className="wing-name">{wing.name || 'Direct Member'}</Typography>
        <Typography className="wing-role">{label}</Typography>
        {isCenter && (
          <Box className="bonus-badge">Trinary Bonus +$150</Box>
        )}
      </Box>
    );
  };

  const renderSubNode = (node, position, slotIndex) => {
    const key = `${position}-${slotIndex}`;
    const label = slotIndex === 0 ? 'L-Node' : slotIndex === 1 ? 'C-Node' : 'R-Node';
    const isEmpty = !!node?.isEmpty;
    const slotStatus = inviteSlotStatuses[node?.id];
    const hasPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt') || slotStatus?.status === 'waiting for code generation';
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    const statusText = hasPendingReceipt ? 'Pending Receipt' : hasCode ? 'Ready to Activate' : isEmpty ? 'Empty' : 'Active';
    const parentIndex = position === 'left' ? 0 : position === 'center' ? 1 : 2;
    const isCenterWing = position === 'center';

    return (
      <Box
        key={key}
        className={`sub-slot basic-slot ${isCenterWing ? 'center-wing-node' : ''}`}
        onClick={() => {
          if (hasCode) {
            // Show code activation modal
            handleShowCodeModal({ ...node, parentId: normalizedWings[parentIndex]?.id });
          } else if (hasPendingReceipt) {
            // Show receipt upload modal
            setShowReceiptUpload(true);
            setPendingCodeRequest({
              id: slotStatus.codeRequestId,
              inviteSlot: { ...node, parentId: normalizedWings[parentIndex]?.id },
            });
          } else if (isEmpty) {
            handleInviteSlotClick({ ...node, parentId: normalizedWings[parentIndex]?.id });
          } else {
            setSelectedMember(node);
          }
        }}
      >
        <Typography className="basic-title">{label}</Typography>
        <Typography className={`basic-status ${isEmpty && !hasPendingReceipt && !hasCode ? 'empty' : hasPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{statusText}</Typography>
      </Box>
    );
  };

  const renderSubSubNode = (node, slotIndex) => {
    const isEmpty = !!node?.isEmpty;
    const slotStatus = inviteSlotStatuses[node?.id];
    const hasPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt') || slotStatus?.status === 'waiting for code generation';
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    
    return (
      <Box
        key={`subsub-${node.id}`}
        className={`subsub-slot ${isEmpty && !hasCode && !hasPendingReceipt ? 'empty-subsub' : hasCode ? 'pending-subsub' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasCode) {
            handleShowCodeModal(node);
          } else if (isEmpty && !hasCode && !hasPendingReceipt) {
            handleInviteSlotClick(node);
          } else if (!isEmpty) {
            setSelectedMember(node);
          }
        }}
      >
        <Typography className="subsub-title">{slotIndex === 0 ? 'L' : slotIndex === 1 ? 'C' : 'R'}</Typography>
        <Typography className={`subsub-status ${isEmpty && !hasCode && !hasPendingReceipt ? 'empty' : hasPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{isEmpty && !hasCode && !hasPendingReceipt ? '◯' : hasPendingReceipt ? '⧖' : hasCode ? '⦘' : '●'}</Typography>
      </Box>
    );
  };

  return (
    <Box className="genealogy-main-container">
      {/* Header */}
      <Box className="genealogy-header">
        <Box className="genealogy-header-content">
          <Typography variant="h4" className="genealogy-title">
            Trinary Genealogy
          </Typography>
          <Typography variant="body2" className="genealogy-subtitle">
            Manage and track your network structure (Pinch to zoom on mobile)
          </Typography>
        </Box>
      </Box>


      {/* Tree Section */}
      <Box className="tree-container">
        <Box ref={treeShellRef} className="tree-shell" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
            {genealogyTree ? (
              <>
                <Box className="root-row">
                  <Box
                    className="root-card"
                    style={frameStyle ? {
                      '--frame-border': frameStyle.borderColor,
                      '--frame-shadow': frameStyle.shadowColor,
                    } : undefined}
                  >
                    {frameUrl && (
                      <img
                        src={frameUrl}
                        alt="frame"
                        className="root-frame-img"
                      />
                    )}
                    <Box className="root-avatar-wrap">
                      {genealogyTree.avatar && genealogyTree.avatar.startsWith('http') ? (
                        <img 
                          className="root-avatar"
                          src={genealogyTree.avatar}
                          alt={genealogyTree.name}
                        />
                      ) : (
                        <div className="root-avatar">
                          {genealogyTree.avatar || (genealogyTree.name ? genealogyTree.name[0] : 'U')}
                        </div>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box className="root-horizontal" />

                <Box className="wing-row">
                  {renderWingCard(normalizedWings[0], 'left')}
                  {renderWingCard(normalizedWings[1], 'center')}
                  {renderWingCard(normalizedWings[2], 'right')}
                </Box>

                <Box className="mid-connector" />
                <Box className="wings-sub-row">
                  <Box className="wing-sub-group">
                    {(normalizedWings[0]?.children || []).map((child, idx) => renderSubNode(child, 'left', idx))}
                  </Box>
                  <Box className="wing-sub-group">
                    {(normalizedWings[1]?.children || []).map((child, idx) => renderSubNode(child, 'center', idx))}
                  </Box>
                  <Box className="wing-sub-group">
                    {(normalizedWings[2]?.children || []).map((child, idx) => renderSubNode(child, 'right', idx))}
                  </Box>
                </Box>

                <Box className="mid-connector" />
                <Box className="wings-subsub-row">
                  {normalizedWings.flatMap((wing, wingIdx) =>
                    (wing.children || []).map((subNode, subNodeIdx) => (
                      <Box key={`subsub-group-${subNode.id}`} className={`subsub-group-container ${wingIdx === 1 ? 'center-wing-subsub' : ''}`}>
                        <Typography className="subsub-group-label">
                          {subNodeIdx === 0 ? 'L-Node' : subNodeIdx === 1 ? 'C-Node' : 'R-Node'}
                        </Typography>
                        <Box className="subsub-group">
                          {(subNode.children || []).map((subSubNode, idx) => (
                            <Box key={`subsub-${subSubNode.id}`} className={`subsub-item-single ${wingIdx === 1 ? 'center-wing-subsub-node' : ''}`}>
                              {renderSubSubNode(subSubNode, idx)}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </>
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
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      background: selectedMember.avatar && selectedMember.avatar.startsWith('http') ? 'none' : 'linear-gradient(135deg, #d4af37 0%, #e8d5a1 100%)',
                      color: '#1a5f3f',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedMember.avatar && selectedMember.avatar.startsWith('http') ? (
                      <img 
                        src={selectedMember.avatar}
                        alt={selectedMember.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      selectedMember.avatar
                    )}
                  </Box>
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

        {/* Invite Slot Modal - Add New Member */}
        {showPaymentSelection && (
          <PaymentMethodSelection
            onClose={() => setShowPaymentSelection(false)}
            onSelectPaymentMethod={handlePaymentMethodSelect}
            isLoading={inviting}
          />
        )}

        {inviteSlot && paymentMethod && (
          <InviteNewMember
            inviteSlot={inviteSlot}
            onClose={handleCloseInvite}
            onSendInvite={handleInviteMember}
            isLoading={inviting}
            inviteData={inviteData}
            onInviteDataChange={handleInviteDataChange}
            paymentMethod={paymentMethod}
          />
        )}

        {/* Activate Code Modal */}
        <ActivateCodeModal
          isOpen={showCodeModal}
          onClose={() => {
            setShowCodeModal(false);
            setSelectedCodeSlot(null);
          }}
          code={selectedCodeSlot && inviteSlotStatuses[selectedCodeSlot.id]?.code}
          inviteSlot={selectedCodeSlot}
          onActivate={handleActivateCode}
          isLoading={activatingCode}
        />

        {/* Receipt Upload Modal */}
        <ReceiptUploadModal
          isOpen={showReceiptUpload}
          onClose={() => {
            setShowReceiptUpload(false);
            setPendingCodeRequest(null);
          }}
          onUploadSuccess={handleReceiptUploadSuccess}
          codeRequestId={pendingCodeRequest?.id}
          isLoading={inviting}
        />
    </Box>
  );
}
