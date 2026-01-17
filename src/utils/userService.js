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
  writeBatch,
} from 'firebase/firestore';

// User roles enum
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  VIP: 'vip',
  AMBASSADOR: 'ambassador',
  SUPREME: 'supreme',
  CASHIER: 'cashier',
  USER: 'user', // Default user role
};

// Users collection reference
const usersCollection = collection(db, 'users');

/**
 * Create or update a user document in Firestore
 * @param {string} uid - User's unique ID from Firebase Auth
 * @param {object} userData - User data object
 * @returns {Promise}
 */
export const createOrUpdateUser = async (uid, userData) => {
  try {
    const userRef = doc(usersCollection, uid);
    const userDoc = {
      uid,
      email: userData.email || '',
      displayName: userData.displayName || '',
      role: userData.role || USER_ROLES.USER,
      avatar: userData.avatar || null,
      phone: userData.phone || '',
      address: userData.address || '',
      joinDate: userData.joinDate || serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      referralCode: userData.referralCode || generateReferralCode(),
      metadata: {
        createdAt: userData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData.metadata,
      },
    };

    await setDoc(userRef, userDoc, { merge: true });
    return { success: true, uid };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

/**
 * Get user data by UID
 * @param {string} uid - User's unique ID
 * @returns {Promise<object>}
 */
export const getUserById = async (uid) => {
  try {
    const userRef = doc(usersCollection, uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Get user's role
 * @param {string} uid - User's unique ID
 * @returns {Promise<string>}
 */
export const getUserRole = async (uid) => {
  try {
    const user = await getUserById(uid);
    return user?.role || USER_ROLES.USER;
  } catch (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }
};

/**
 * Update user role
 * @param {string} uid - User's unique ID
 * @param {string} role - New role
 * @returns {Promise}
 */
export const updateUserRole = async (uid, role) => {
  try {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

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

/**
 * Get all users with a specific role
 * @param {string} role - User role to filter by
 * @returns {Promise<array>}
 */
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

/**
 * Get all admin users (superadmin and admin)
 * @returns {Promise<array>}
 */
export const getAdminUsers = async () => {
  try {
    const admins = await getUsersByRole(USER_ROLES.ADMIN);
    const superadmins = await getUsersByRole(USER_ROLES.SUPERADMIN);
    return [...admins, ...superadmins];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
};

/**
 * Delete user document
 * @param {string} uid - User's unique ID
 * @returns {Promise}
 */
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

/**
 * Update user activity (last login, etc)
 * @param {string} uid - User's unique ID
 * @returns {Promise}
 */
export const updateUserActivity = async (uid) => {
  try {
    const userRef = doc(usersCollection, uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
};

/**
 * Check if user is admin or superadmin
 * @param {string} uid - User's unique ID
 * @returns {Promise<boolean>}
 */
export const isUserAdmin = async (uid) => {
  try {
    const role = await getUserRole(uid);
    return [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(role);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Generate a unique referral code
 * @returns {string}
 */
export const generateReferralCode = () => {
  return 'VRX_' + Math.random().toString(36).substring(2, 9).toUpperCase();
};

/**
 * Batch create multiple users
 * @param {array} users - Array of user objects with email and role
 * @returns {Promise}
 */
export const batchCreateUsers = async (users) => {
  try {
    const batch = writeBatch(db);

    users.forEach((userData) => {
      const uid = userData.uid || `user_${Date.now()}_${Math.random()}`;
      const userRef = doc(usersCollection, uid);
      
      batch.set(userRef, {
        uid,
        email: userData.email,
        displayName: userData.displayName || '',
        role: userData.role || USER_ROLES.USER,
        avatar: userData.avatar || null,
        joinDate: serverTimestamp(),
        lastLogin: null,
        isActive: true,
        referralCode: generateReferralCode(),
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });
    });

    await batch.commit();
    return { success: true, count: users.length };
  } catch (error) {
    console.error('Error batch creating users:', error);
    throw error;
  }
};
