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
} from 'firebase/firestore';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  VIP: 'vip',
  AMBASSADOR: 'ambassador',
  SUPREME: 'supreme',
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
