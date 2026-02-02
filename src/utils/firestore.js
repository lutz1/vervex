import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  VIP: 'vip',
  AMBASSADOR: 'ambassador',
  SUPREME: 'supreme',
  COMPANY_ACCOUNT: 'company_account',
  CASHIER: 'cashier',
  USER: 'user',
};

const usersCollection = collection(db, 'users');

// Get user role
export const getUserRole = async (uid) => {
  try {
    const userRef = doc(usersCollection, uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data().role : 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
};

// Verify superadmin document exists (bootstrap function)
export const ensureSuperAdminExists = async (uid, email) => {
  try {
    const userRef = doc(usersCollection, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // ...existing code...
      await setDoc(userRef, {
        uid,
        email: email,
        role: USER_ROLES.SUPERADMIN,
        isActive: true,
        joinDate: serverTimestamp(),
        lastLogin: serverTimestamp(),
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      }, { merge: true });
      // ...existing code...
      return true;
    } else {
      // Document exists, but ensure role is superadmin
      const existingRole = userDoc.data().role;
      if (existingRole !== USER_ROLES.SUPERADMIN) {
        // ...existing code...
        await setDoc(userRef, {
          role: USER_ROLES.SUPERADMIN,
        }, { merge: true });
        // ...existing code...
      } else {
        // ...existing code...
      }
      return false;
    }
  } catch (error) {
    console.error('Error ensuring superadmin exists:', error);
    throw error;
  }
};

// Create or update user
export const createOrUpdateUser = async (uid, userData) => {
  try {
    let userRef;
    let newUid = uid;
    if (!uid) {
      userRef = doc(usersCollection);
      newUid = userRef.id;
    } else {
      userRef = doc(usersCollection, uid);
    }
    await setDoc(userRef, {
      uid: newUid,
      email: userData.email || '',
      username: userData.username || '',
      fullName: userData.fullName || '',
      displayName: userData.displayName || '',
      role: userData.role || USER_ROLES.USER,
      avatar: userData.avatar || null,
      phone: userData.phone || '',
      contactNumber: userData.contactNumber || '',
      address: userData.address || '',
      birthDate: userData.birthDate || '',
      joinDate: userData.joinDate || serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      metadata: {
        createdAt: userData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData.metadata,
      },
    }, { merge: true });
    return { success: true, uid: newUid };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const q = query(usersCollection, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

// Get a user's full profile document by uid
export const getUserProfile = async (uid) => {
  try {
    if (!uid) return null;
    const userRef = doc(usersCollection, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update parts of a user's profile
export const updateUserProfile = async (uid, updates = {}) => {
  try {
    if (!uid) throw new Error('Missing uid');
    const userRef = doc(usersCollection, uid);
    await updateDoc(userRef, {
      ...updates,
      'metadata.updatedAt': serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

// Update user role
export const updateUserRole = async (uid, role) => {
  try {
    const userRef = doc(usersCollection, uid);
    await updateDoc(userRef, {
      role,
      metadata: {
        updatedAt: serverTimestamp(),
      },
    });
    return { success: true, uid, role };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (uid) => {
  try {
    const userRef = doc(usersCollection, uid);
    await deleteDoc(userRef);
    return { success: true, uid };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get frame document for a role (frames collection expected to have documents with a 'role' field)
export const getFrameByRole = async (role) => {
  try {
    const framesCollection = collection(db, 'frames');

    // 1) Try exact match on 'role' field
    let q = query(framesCollection, where('role', '==', role));
    let snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      return { id: snapshot.docs[0].id, ...docData };
    }

    // 2) Try common case variants
    const variants = [role && role.toLowerCase(), role && role.toUpperCase(), role && (role.charAt(0).toUpperCase() + role.slice(1))];
    for (const v of variants) {
      if (!v) continue;
      q = query(framesCollection, where('role', '==', v));
      snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        return { id: snapshot.docs[0].id, ...docData };
      }
    }

    // 3) Try array-contains on 'roles' field (if frames store multiple roles)
    q = query(framesCollection, where('roles', 'array-contains', role));
    snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      return { id: snapshot.docs[0].id, ...docData };
    }

    // 4) Try document id equal to role or its variants
    const tryIds = [role, role && role.toLowerCase(), role && role.toUpperCase()];
    for (const id of tryIds) {
      if (!id) continue;
      const docRef = doc(framesCollection, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    }

    // nothing found
    return null;
    
  } catch (error) {
    console.error('Error fetching frame for role:', error);
    return null;
  }
};

// Get user by username
export const getUserByUsername = async (username) => {
  try {
    if (!username) return null;
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      return { id: snapshot.docs[0].id, ...docData };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
};

// Direct invite earnings based on role
const DIRECT_INVITE_EARNINGS = {
  vip: 1000,
  ambassador: 4000,
  supreme: 15000,
};

// Code request pricing based on role
const CODE_REQUEST_PRICES = {
  vip: 5998,
  ambassador: 25998,
  supreme: 105998,
};

// Get code request price for a role
export const getCodeRequestPrice = (role) => {
  const lowerRole = role?.toLowerCase() || '';
  return CODE_REQUEST_PRICES[lowerRole] || 0;
};

// Generate a code with role-based prefix
export const generatePaymentCode = (role) => {
  const lowerRole = role?.toLowerCase() || 'vip';
  const rolePrefix = lowerRole === 'vip' ? 'VIP' 
    : lowerRole === 'ambassador' ? 'AMBASSADOR' 
    : lowerRole === 'supreme' ? 'SUPREME' 
    : 'VIP';
  
  // Generate 10 random alphanumeric characters
  const randomPart = Math.random().toString(36).substring(2, 12).toUpperCase();
  
  return `${rolePrefix}-${randomPart}`;
};

// Create a code request for over-the-counter payment
export const createCodeRequest = async (inviterId, inviteData, inviteSlot, role) => {
  try {
    const codeRequestsRef = collection(db, 'codeRequests');
    const price = getCodeRequestPrice(role);

    const inviteSlotData = {
      id: inviteSlot.id,
      type: inviteSlot.type,
    };
    
    // Only include parentId if it exists
    if (inviteSlot.parentId) {
      inviteSlotData.parentId = inviteSlot.parentId;
    }

    const docRef = await addDoc(codeRequestsRef, {
      inviterId: inviterId,
      inviteData: inviteData,
      inviteSlot: inviteSlotData,
      inviteSlotId: inviteSlot.id, // Store for easy reference
      role: role,
      price: price,
      status: 'waiting for payment',
      generatedCode: null,
      codeGeneratedAt: null,
      codeGeneratedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error('Error creating code request:', error);
    throw error;
  }
};

// Update code request with generated code
export const updateCodeRequest = async (requestId, code, adminId) => {
  try {
    const codeRequestRef = doc(db, 'codeRequests', requestId);
    await updateDoc(codeRequestRef, {
      generatedCode: code,
      codeGeneratedAt: serverTimestamp(),
      codeGeneratedBy: adminId,
      status: 'code generated',
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating code request:', error);
    throw error;
  }
};

// Create or update an invite slot node with "Input Code" status
export const updateInviteSlotWithCode = async (inviteSlotId, code) => {
  try {
    const slotRef = doc(db, 'inviteSlots', inviteSlotId);
    await updateDoc(slotRef, {
      status: 'Input Code',
      code: code,
      codeUpdatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      try {
        const inviteSlotsRef = collection(db, 'inviteSlots');
        await addDoc(inviteSlotsRef, {
          id: inviteSlotId,
          status: 'Input Code',
          code: code,
          codeUpdatedAt: serverTimestamp(),
        });
        return { success: true };
      } catch (innerError) {
        console.error('Error creating invite slot:', innerError);
        throw innerError;
      }
    }
    console.error('Error updating invite slot:', error);
    throw error;
  }
};

// Generate random code for payment verification
export const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get direct invite earnings for a user role
export const getDirectInviteEarnings = (role) => {
  const lowerRole = role?.toLowerCase() || '';
  return DIRECT_INVITE_EARNINGS[lowerRole] || 0;
};

// Add earnings to user account when they accept direct invite
export const addDirectInviteEarnings = async (inviterId, invitedUserId) => {
  try {
    const inviterRef = doc(db, 'users', inviterId);
    const inviterDoc = await getDoc(inviterRef);
    
    if (!inviterDoc.exists()) {
      console.error('Inviter not found');
      return false;
    }

    const inviterData = inviterDoc.data();
    const earnings = getDirectInviteEarnings(inviterData.role);

    if (earnings > 0) {
      // Update inviter's balance/earnings
      const currentBalance = inviterData.balance || 0;
      const currentDirectInviteEarnings = inviterData.directInviteEarnings || 0;

      await updateDoc(inviterRef, {
        balance: currentBalance + earnings,
        directInviteEarnings: currentDirectInviteEarnings + earnings,
        lastEarningUpdate: serverTimestamp(),
      });

      // Log the transaction
      const transactionsRef = collection(db, 'transactions');
      await addDoc(transactionsRef, {
        type: 'direct_invite_earning',
        amount: earnings,
        userId: inviterId,
        invitedUserId: invitedUserId,
        role: inviterData.role,
        createdAt: serverTimestamp(),
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding direct invite earnings:', error);
    return false;
  }
};
// Register user from invitation (after payment code activation)
export const registerUserFromInvitation = async (invitationData) => {
  try {
    console.log('Registering user with invitation data:', invitationData);

    // Create user document in users collection
    const usersRef = collection(db, 'users');
    const newUserRef = doc(usersRef);
    
    const userData = {
      uid: newUserRef.id,
      email: invitationData.invitedEmail || invitationData.email,
      name: invitationData.invitedName || `${invitationData.firstName} ${invitationData.surname}`,
      firstName: invitationData.firstName || '',
      middleName: invitationData.middleName || '',
      surname: invitationData.surname || '',
      username: invitationData.username || '',
      birthdate: invitationData.birthdate || '',
      fullAddress: invitationData.fullAddress || '',
      contactNumber: invitationData.contactNumber || '',
      role: invitationData.role || 'vip',
      parentId: invitationData.parentId,
      status: 'Active',
      balance: 0,
      avatar: (invitationData.surname || invitationData.surname?.[0] || 'U'),
      createdAt: serverTimestamp(),
      createdBy: invitationData.createdBy,
      paymentCode: invitationData.paymentCode,
      registrationMethod: 'code',
    };

    console.log('Creating user document:', userData);
    await setDoc(newUserRef, userData);
    console.log('User document created successfully:', newUserRef.id);

    return { success: true, userId: newUserRef.id };
  } catch (error) {
    console.error('Error registering user from invitation:', error);
    console.error('Error details:', error.code, error.message);
    throw error;
  }
};