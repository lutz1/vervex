
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { auth, db, storage } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, serverTimestamp, addDoc, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { getFrameByRole, getCodeRequestPrice } from '../../utils/firestore';
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
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '', type: 'info' });
  const [inviteData, setInviteData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    username: '',
    birthdate: '',
    contactNumber: '',
    email: '',
    purokStreet: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
    fullName: '',
    role: 'vip',
  });
  
  const BRANCHING = 3;

  // Helper function to show styled alert dialogs
  const showAlert = (message, type = 'info', title = '') => {
    setAlertDialog({
      open: true,
      title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice'),
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertDialog({ open: false, title: '', message: '', type: 'info' });
  };

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
        
        // Start with 3 empty slots
        const directReferrals = [
          {
            id: `empty-direct-0`,
            name: null,
            role: null,
            avatar: null,
            type: 'wing',
            isEmpty: true,
            children: [],
          },
          {
            id: `empty-direct-1`,
            name: null,
            role: null,
            avatar: null,
            type: 'wing',
            isEmpty: true,
            children: [],
          },
          {
            id: `empty-direct-2`,
            name: null,
            role: null,
            avatar: null,
            type: 'wing',
            isEmpty: true,
            children: [],
          },
        ];
        
        // Collect all direct referrals with their slot info
        const referralsList = [];
        allUsers.forEach(userSnap => {
          const user = userSnap.data();
          if (user.referrerId === currentUser.uid) {
            referralsList.push({
              id: userSnap.id,
              name: user.name || 'Unnamed',
              role: user.role || 'Member',
              avatar: user.avatar || user.name?.[0] || 'U',
              type: 'wing',
              children: [],
              inviteSlotId: user.inviteSlotId,
              createdAt: user.createdAt,
            });
          }
        });

        // Place users in their correct slots based on inviteSlotId
        referralsList.forEach(referral => {
          if (referral.inviteSlotId) {
            // Extract slot number from inviteSlotId (e.g., "empty-direct-1" -> 1)
            const match = referral.inviteSlotId.match(/\d+$/);
            const slotIndex = match ? parseInt(match[0]) : -1;
            
            console.log('Placing user in slot:', slotIndex, 'inviteSlotId:', referral.inviteSlotId, 'user:', referral.name);
            
            if (slotIndex >= 0 && slotIndex < 3) {
              // Place at the correct slot, preserving all properties
              directReferrals[slotIndex] = {
                id: referral.id,
                name: referral.name,
                role: referral.role,
                avatar: referral.avatar,
                type: referral.type,
                children: referral.children,
                isEmpty: false,
              };
            }
          } else {
            // User without inviteSlotId - shouldn't happen but log it
            console.warn('User without inviteSlotId:', referral.name, referral.id);
          }
        });

        // For each direct referral, fetch their team members (3 per referral)
        for (let i = 0; i < directReferrals.length; i++) {
          const referral = directReferrals[i];
          if (!referral.isEmpty) {
            const teamMembersList = [];
            allUsers.forEach(userSnap => {
              const user = userSnap.data();
              if (user.referrerId === referral.id) {
                teamMembersList.push({
                  id: userSnap.id,
                  name: user.name || 'Unnamed',
                  role: user.role || 'Member',
                  avatar: user.avatar || user.name?.[0] || 'U',
                  type: 'sub',
                  status: 'ACTIVE',
                  children: [],
                  createdAt: user.createdAt,
                  inviteSlotId: user.inviteSlotId,
                });
              }
            });

            // Sort by inviteSlotId if available, then by creation date
            teamMembersList.sort((a, b) => {
              if (a.inviteSlotId && b.inviteSlotId) {
                const slotANum = parseInt(a.inviteSlotId.match(/\d+/)?.[0] || 999);
                const slotBNum = parseInt(b.inviteSlotId.match(/\d+/)?.[0] || 999);
                if (slotANum !== slotBNum) return slotANum - slotBNum;
              }
              const timeA = a.createdAt?.toMillis?.() || 0;
              const timeB = b.createdAt?.toMillis?.() || 0;
              return timeA - timeB;
            });

            const teamMembers = [];
            // Copy sorted results without the extra fields
            teamMembersList.forEach(user => {
              const { createdAt, inviteSlotId, ...rest } = user;
              teamMembers.push(rest);
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
                parentId: referral.id,
                children: [],
              });
            }

            // Add third level: 3 nodes under each second-level node (27 total per wing)
            for (let j = 0; j < teamMembers.length; j++) {
              const subNode = teamMembers[j];
              const thirdLevelNodesList = [];
              
              if (!subNode.isEmpty) {
                // Try to fetch actual users with this sub-node as parent
                allUsers.forEach(userSnap => {
                  const user = userSnap.data();
                  if (user.referrerId === subNode.id) {
                    thirdLevelNodesList.push({
                      id: userSnap.id,
                      name: user.name || 'Unnamed',
                      role: user.role || 'Member',
                      avatar: user.avatar || user.name?.[0] || 'U',
                      type: 'subsub',
                      status: 'ACTIVE',
                      parentId: subNode.id,
                      createdAt: user.createdAt,
                      inviteSlotId: user.inviteSlotId,
                    });
                  }
                });

                // Sort by inviteSlotId if available, then by creation date
                thirdLevelNodesList.sort((a, b) => {
                  if (a.inviteSlotId && b.inviteSlotId) {
                    const slotANum = parseInt(a.inviteSlotId.match(/\d+/)?.[0] || 999);
                    const slotBNum = parseInt(b.inviteSlotId.match(/\d+/)?.[0] || 999);
                    if (slotANum !== slotBNum) return slotANum - slotBNum;
                  }
                  const timeA = a.createdAt?.toMillis?.() || 0;
                  const timeB = b.createdAt?.toMillis?.() || 0;
                  return timeA - timeB;
                });
              }

              const thirdLevelNodes = [];
              // Copy sorted results without the extra fields
              thirdLevelNodesList.forEach(user => {
                const { createdAt, inviteSlotId, ...rest } = user;
                thirdLevelNodes.push(rest);
              });

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
                  parentId: subNode.id,
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
                parentId: referral.id,
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
                  parentId: emptySubNode.id,
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

  // Handle pinch zoom on mobile with horizontal scroll boundaries (vertical is unlimited)
  useEffect(() => {
    const handleTouchMove = (e) => {
      // Pinch zoom with 2 fingers
      if (e.touches.length === 2) {
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
      }
    };
    
    const handleTouchEnd = () => {
      lastDistanceRef.current = 0;
    };
    
    const handleScroll = (e) => {
      // Constrain horizontal scroll only (left and right bounds)
      // Vertical scrolling is unlimited for infinite scroll
      const element = e.target;
      if (element.scrollLeft < 0) {
        element.scrollLeft = 0;
      }
      if (element.scrollLeft > element.scrollWidth - element.clientWidth) {
        element.scrollLeft = element.scrollWidth - element.clientWidth;
      }
    };
    
    const treeContainer = treeShellRef.current?.parentElement;
    if (treeContainer) {
      treeContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      treeContainer.addEventListener('touchend', handleTouchEnd);
      treeContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        treeContainer.removeEventListener('touchmove', handleTouchMove);
        treeContainer.removeEventListener('touchend', handleTouchEnd);
        treeContainer.removeEventListener('scroll', handleScroll);
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
    const { email, firstName, middleName, surname, username, birthdate, contactNumber, purokStreet, barangay, city, province, zipCode, role } = inviteData;

    // Concatenate address fields
    const fullAddress = [purokStreet, barangay, city, province, zipCode].filter(Boolean).join(', ');

    if (!email.trim() || !firstName.trim() || !surname.trim() || !username.trim() || !contactNumber.trim() || !purokStreet.trim() || !barangay.trim() || !city.trim() || !province.trim() || !zipCode.trim()) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    if (!inviteSlot) {
      showAlert('No slot selected', 'error');
      return;
    }

    setInviting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showAlert('You must be logged in', 'error');
        setInviting(false);
        return;
      }

      // Determine the parent ID for the new user
      const parentId = inviteSlot.type === 'wing' ? genealogyTree.id : inviteSlot.parentId || genealogyTree.id;

      // If over-the-counter, create a pending code request
      if (paymentMethod === 'over-the-counter') {
        // Create code request document in Firebase
        const codeRequestsRef = collection(db, 'codeRequests');
        
        // Construct full name from first, middle, and surname
        const fullName = [inviteData.firstName, inviteData.middleName, inviteData.surname]
          .filter(Boolean) // Remove empty strings
          .join(' ');
        
        // Get price for the role
        const price = getCodeRequestPrice(role);
        
        const docRef = await addDoc(codeRequestsRef, {
          inviterId: currentUser.uid,
          inviteData: {
            ...inviteData,
            fullName: fullName, // Add constructed fullName
          },
          inviteSlot: {
            id: inviteSlot.id,
            type: inviteSlot.type,
            parentId: parentId,
          },
          inviteSlotId: inviteSlot.id,
          role: role,
          price: price, // Add price based on role
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
        showAlert('Request created! Please upload your payment receipt.', 'success');
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

        showAlert('Invitation sent successfully!', 'success');
      }

      resetInviteForm();
      setInviteSlot(null);
      setShowPaymentSelection(false);
      setPaymentMethod(null);
    } catch (error) {
      console.error('Error processing invitation:', error);
      showAlert('Failed to process invitation: ' + error.message, 'error');
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
      purokStreet: '',
      barangay: '',
      city: '',
      province: '',
      zipCode: '',
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
      const codeRequestRef = doc(db, 'codeRequests', pendingCodeRequest);
      await updateDoc(codeRequestRef, {
        receiptUrl: receiptUrl,
        status: 'waiting for code generation',
        updatedAt: serverTimestamp(),
      });

      // Find the slot ID associated with this code request
      const slotId = Object.keys(inviteSlotStatuses).find(
        key => inviteSlotStatuses[key]?.codeRequestId === pendingCodeRequest
      );

      if (slotId) {
        // Update local state
        setInviteSlotStatuses(prev => ({
          ...prev,
          [slotId]: {
            ...prev[slotId],
            status: 'waiting for code generation',
            receiptUrl: receiptUrl,
          },
        }));
      }

      showAlert('Receipt uploaded! Admin will generate your code shortly.', 'success');
      setShowReceiptUpload(false);
      setPendingCodeRequest(null);
    } catch (error) {
      console.error('Error updating code request:', error);
      showAlert('Error saving receipt: ' + error.message, 'error');
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
        showAlert('You must be logged in', 'error');
        setActivatingCode(false);
        return;
      }

      const slotStatus = inviteSlotStatuses[selectedCodeSlot.id];
      if (!slotStatus || !slotStatus.code) {
        showAlert('Code not found', 'error');
        setActivatingCode(false);
        return;
      }

      // Log the parentId being used
      console.log('Activating code for slot:', selectedCodeSlot.id);
      console.log('Parent ID:', selectedCodeSlot.parentId);
      console.log('Genealogy tree ID:', genealogyTree.id);
      console.log('Selected slot:', selectedCodeSlot);

      // Construct full address from individual fields
      const fullAddress = [
        slotStatus.inviteData?.purokStreet,
        slotStatus.inviteData?.barangay,
        slotStatus.inviteData?.city,
        slotStatus.inviteData?.province,
        slotStatus.inviteData?.zipCode,
      ].filter(Boolean).join(', ');

      // Create invitation document with the code payment method
      const invitationsRef = collection(db, 'invitations');
      const invitationData = {
        invitedEmail: slotStatus.inviteData?.email || '',
        invitedName: slotStatus.inviteData?.fullName || `${slotStatus.inviteData?.firstName || ''} ${slotStatus.inviteData?.surname || ''}`.trim(),
        firstName: slotStatus.inviteData?.firstName || '',
        middleName: slotStatus.inviteData?.middleName || '',
        surname: slotStatus.inviteData?.surname || '',
        username: slotStatus.inviteData?.username || '',
        birthdate: slotStatus.inviteData?.birthdate || '',
        purokStreet: slotStatus.inviteData?.purokStreet || '',
        barangay: slotStatus.inviteData?.barangay || '',
        city: slotStatus.inviteData?.city || '',
        province: slotStatus.inviteData?.province || '',
        zipCode: slotStatus.inviteData?.zipCode || '',
        fullAddress: fullAddress,
        contactNumber: slotStatus.inviteData?.contactNumber || '',
        paymentCode: slotStatus.code,
        paymentMethod: 'over-the-counter',
        role: slotStatus.inviteData?.role || 'vip',
        parentId: selectedCodeSlot.parentId || genealogyTree.id,
        inviteSlotId: selectedCodeSlot.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'payment completed',
        invitationLink: `${window.location.origin}/accept-invitation?inviterId=${currentUser.uid}&parentId=${selectedCodeSlot.parentId || genealogyTree.id}`,
      };

      console.log('Creating invitation with parentId:', invitationData.parentId);
      console.log('Creating invitation with inviteSlotId:', invitationData.inviteSlotId);

      await addDoc(invitationsRef, invitationData);

      // Call Cloud Function to register user in Firebase Authentication and Firestore
      // with timeout and retry logic for mobile networks
      const idToken = await currentUser.getIdToken();
      const cloudFunctionUrl = 'https://us-central1-vervex-c5b91.cloudfunctions.net/registerUserFromCodeHttp';
      
      // Create fetch with timeout
      const fetchWithTimeout = async (url, options, timeout = 30000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please check your internet connection and try again.');
          }
          throw error;
        }
      };

      let response;
      
      // Retry logic for poor mobile connections
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Activation attempt ${attempt} of 3...`);
          
          response = await fetchWithTimeout(cloudFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              invitationData: invitationData,
              codeRequestId: slotStatus.codeRequestId,
            }),
          }, 30000);
          
          // If successful, break the retry loop
          break;
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          
          // If it's the last attempt, throw the error
          if (attempt === 3) {
            throw new Error(
              error.message === 'Failed to fetch' 
                ? 'Network error. Please check your internet connection and try again.' 
                : error.message
            );
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!response || !response.ok) {
        let errorMessage = 'Server error. Please try again.';
        
        try {
          const errorText = await response.text();
          errorMessage = `Server error (${response.status}): ${errorText}`;
        } catch (e) {
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Send verification email to the new user
      if (result.verificationLink) {
        try {
          const emailStatus = result.emailSent 
            ? `✓ Verification email has been sent to ${result.email}`
            : `⚠ Verification link generated. Email delivery status: ${result.message}`;
          
          // Provide the user with verification instructions
          const verificationMessage = `Code activated successfully!

${emailStatus}

User Details:
- Email: ${result.email}
- Default Password: ${result.defaultPassword}

Next Steps:
1. Check email inbox (including spam folder) for the verification link
2. Click the verification link to verify their email address
3. Login with their credentials
4. Change the default password after first login

Important:
If the member doesn't receive the email within 5 minutes:
- They can login directly with the credentials above
- Firebase will send a verification email on login attempt
- They may need to check their spam/junk folder

The account is now Active and ready to use.`;
          showAlert(verificationMessage, 'success', 'Code Activated Successfully');
        } catch (error) {
          console.error('Error in verification process:', error);
          showAlert('Code activated! Member registered successfully.\n\nVerification email has been sent to their registered email address. They can check their inbox and spam folder.', 'success');
        }
      }

      setShowCodeModal(false);
      setSelectedCodeSlot(null);

      // Refresh the genealogy tree
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('Error activating code:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showAlert('Failed to activate code: ' + errorMessage, 'error');
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
            parentId: emptySubNode.id,
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
            parentId: subChild.id,
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
    const isWaitingForCode = slotStatus?.status === 'waiting for code generation';
    const isPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt');
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    const statusText = isWaitingForCode ? '⧖' : isPendingReceipt ? 'Upload Receipt' : hasCode ? 'Ready to Activate' : isEmpty ? 'Empty' : 'Active';

    if (wing?.isEmpty) {
      return (
        <Box 
          className={`wing-card empty-wing ${position} ${isWaitingForCode ? 'waiting-state' : ''}`}
          onClick={() => {
            if (isWaitingForCode) return;
            if (isPendingReceipt) {
              // Open receipt upload modal
              const slotStatus = inviteSlotStatuses[wing?.id];
              if (slotStatus?.codeRequestId) {
                setPendingCodeRequest(slotStatus.codeRequestId);
                setShowReceiptUpload(true);
              }
            } else if (hasCode) {
              // Empty wing with code ready - parentId is the current user
              handleShowCodeModal({ ...wing, parentId: genealogyTree.id });
            } else if (isEmpty) {
              handleInviteSlotClick(wing);
            }
          }}
        >
          {isWaitingForCode && (
            <Box className="waiting-overlay">
              <Typography className="waiting-icon">⧖</Typography>
              <Typography className="waiting-text">Waiting for Code Generation</Typography>
            </Box>
          )}
          <Button className="empty-slot-wing">+</Button>
          <Typography className="wing-empty-text">Add direct member</Typography>
          <Typography className={`wing-status ${isEmpty && !isWaitingForCode && !isPendingReceipt && !hasCode ? 'empty' : isWaitingForCode ? 'processing' : isPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{statusText}</Typography>
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
    const isWaitingForCode = slotStatus?.status === 'waiting for code generation';
    const isPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt');
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    const statusText = isWaitingForCode ? 'Waiting for the Code ⧖' : isPendingReceipt ? 'Upload Receipt' : hasCode ? 'Ready to Activate' : isEmpty ? 'Empty' : 'Active';
    const parentIndex = position === 'left' ? 0 : position === 'center' ? 1 : 2;
    const isCenterWing = position === 'center';

    return (
      <Box
        key={key}
        className={`sub-slot basic-slot ${isCenterWing ? 'center-wing-node' : ''} ${isWaitingForCode ? 'waiting-state' : ''}`}
        onClick={() => {
          if (isWaitingForCode) return;
          if (isPendingReceipt) {
            // Open receipt upload modal
            const slotStatus = inviteSlotStatuses[node?.id];
            if (slotStatus?.codeRequestId) {
              setPendingCodeRequest(slotStatus.codeRequestId);
              setShowReceiptUpload(true);
            }
          } else if (hasCode) {
            handleShowCodeModal({ ...node, parentId: normalizedWings[parentIndex]?.id });
          } else if (isEmpty) {
            handleInviteSlotClick({ ...node, parentId: normalizedWings[parentIndex]?.id });
          } else if (!isEmpty) {
            setSelectedMember(node);
          }
        }}
      >
        {isWaitingForCode && (
          <Box className="waiting-overlay-sub">
            <Typography className="waiting-icon-sub">⧖</Typography>
            <Typography className="waiting-text-sub">Waiting for Code</Typography>
          </Box>
        )}
        <Typography className="basic-title">{label}</Typography>
        <Typography className={`basic-status ${isEmpty && !isWaitingForCode && !isPendingReceipt && !hasCode ? 'empty' : isWaitingForCode ? 'processing' : isPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{statusText}</Typography>
      </Box>
    );
  };

  const renderSubSubNode = (node, slotIndex) => {
    const isEmpty = !!node?.isEmpty;
    const slotStatus = inviteSlotStatuses[node?.id];
    const isWaitingForCode = slotStatus?.status === 'waiting for code generation';
    const isPendingReceipt = slotStatus?.status === 'pending receipt' || slotStatus?.status?.includes('Pending Receipt');
    const hasCode = slotStatus?.status === 'code generated' || slotStatus?.code;
    
    return (
      <Box
        key={`subsub-${node.id}`}
        className={`subsub-slot ${isEmpty && !hasCode && !isWaitingForCode && !isPendingReceipt ? 'empty-subsub' : hasCode ? 'pending-subsub' : ''} ${isWaitingForCode ? 'waiting-state' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isWaitingForCode) return;
          if (isPendingReceipt) {
            // Open receipt upload modal
            const slotStatus = inviteSlotStatuses[node?.id];
            if (slotStatus?.codeRequestId) {
              setPendingCodeRequest(slotStatus.codeRequestId);
              setShowReceiptUpload(true);
            }
          } else if (hasCode) {
            handleShowCodeModal({ ...node, parentId: node.parentId });
          } else if (isEmpty && !hasCode && !isWaitingForCode && !isPendingReceipt) {
            handleInviteSlotClick(node);
          } else if (!isEmpty && !isWaitingForCode && !isPendingReceipt) {
            setSelectedMember(node);
          }
        }}
      >
        {isWaitingForCode && (
          <Box className="waiting-overlay-subsub">
            <Typography className="waiting-icon-subsub">⧖</Typography>
          </Box>
        )}
        <Typography className="subsub-title">{slotIndex === 0 ? 'L' : slotIndex === 1 ? 'C' : 'R'}</Typography>
        <Typography className={`subsub-status ${isEmpty && !hasCode && !isWaitingForCode && !isPendingReceipt ? 'empty' : isWaitingForCode ? 'processing' : isPendingReceipt ? 'processing' : hasCode ? 'pending' : 'active'}`}>{isEmpty && !hasCode && !isWaitingForCode && !isPendingReceipt ? '◯' : isWaitingForCode ? '⧖' : isPendingReceipt ? '◯' : hasCode ? '⦘' : '●'}</Typography>
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
                  {renderWingCard(normalizedWings[2], 'right')}
                  {renderWingCard(normalizedWings[1], 'center')}
                </Box>

                <Box className="mid-connector" />
                <Box className="wings-sub-row">
                  <Box className="wing-sub-group">
                    {(normalizedWings[0]?.children || []).map((child, idx) => renderSubNode(child, 'left', idx))}
                  </Box>
                  <Box className="wing-sub-group">
                    {(normalizedWings[2]?.children || []).map((child, idx) => renderSubNode(child, 'right', idx))}
                  </Box>
                  <Box className="wing-sub-group">
                    {(normalizedWings[1]?.children || []).map((child, idx) => renderSubNode(child, 'center', idx))}
                  </Box>
                </Box>

                <Box className="mid-connector" />
                <Box className="wings-subsub-row">
                  {[normalizedWings[0], normalizedWings[2], normalizedWings[1]].flatMap((wing, displayIdx) => {
                    const wingIdx = wing === normalizedWings[0] ? 0 : wing === normalizedWings[2] ? 2 : 1;
                    return (wing.children || []).map((subNode, subNodeIdx) => (
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
                    ));
                  })}
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
          codeRequestId={pendingCodeRequest}
          isLoading={inviting}
        />

        {/* Alert Dialog */}
        <Dialog
          open={alertDialog.open}
          onClose={closeAlert}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(4, 12, 9, 0.95)',
              border: `1px solid ${
                alertDialog.type === 'error' 
                  ? 'rgba(255, 107, 107, 0.5)' 
                  : alertDialog.type === 'success'
                  ? 'rgba(76, 175, 80, 0.5)'
                  : 'rgba(212, 175, 55, 0.3)'
              }`,
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          <DialogTitle
            sx={{
              color: alertDialog.type === 'error' 
                ? '#ff6b6b' 
                : alertDialog.type === 'success' 
                ? '#4caf50' 
                : '#d4af37',
              fontWeight: 600,
              borderBottom: `1px solid ${
                alertDialog.type === 'error' 
                  ? 'rgba(255, 107, 107, 0.2)' 
                  : alertDialog.type === 'success'
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(212, 175, 55, 0.2)'
              }`,
              fontSize: '1.1rem',
            }}
          >
            {alertDialog.title}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography 
              sx={{ 
                color: '#f5f5f5',
                whiteSpace: 'pre-line',
              }}
            >
              {alertDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              gap: 1,
              padding: '16px',
              borderTop: `1px solid ${
                alertDialog.type === 'error' 
                  ? 'rgba(255, 107, 107, 0.2)' 
                  : alertDialog.type === 'success'
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(212, 175, 55, 0.2)'
              }`,
            }}
          >
            <Button
              onClick={closeAlert}
              variant="contained"
              sx={{
                background: alertDialog.type === 'error' 
                  ? '#ff6b6b' 
                  : alertDialog.type === 'success' 
                  ? '#4caf50' 
                  : '#d4af37',
                color: '#fff',
                fontWeight: 600,
                '&:hover': {
                  background: alertDialog.type === 'error' 
                    ? '#ee5a52' 
                    : alertDialog.type === 'success' 
                    ? '#45a049' 
                    : '#c29d2f',
                },
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}
