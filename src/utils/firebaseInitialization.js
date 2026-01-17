import { createOrUpdateUser, USER_ROLES, updateUserRole } from './userService';

/**
 * Create a user on authentication and save to Firestore
 * Call this in your Auth signup handler
 */
export const createUserOnAuth = async (uid, email, displayName, role = USER_ROLES.USER) => {
  try {
    const result = await createOrUpdateUser(uid, {
      email,
      displayName,
      role,
      isActive: true,
    });
    console.log('User created on Firestore:', result);
    return result;
  } catch (error) {
    console.error('Error creating user on auth:', error);
    throw error;
  }
};

/**
 * Assign role to existing user
 * Call this when an admin wants to change a user's role
 */
export const assignRoleToUser = async (uid, role) => {
  try {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const result = await updateUserRole(uid, role);
    console.log(`Role ${role} assigned to user ${uid}`);
    return result;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

/**
 * Create a superadmin account (manual first-time setup)
 * This should only be called once to create the initial superadmin
 */
export const createSuperAdmin = async (uid, email, displayName) => {
  try {
    const result = await createOrUpdateUser(uid, {
      email,
      displayName,
      role: USER_ROLES.SUPERADMIN,
      isActive: true,
    });
    console.log('SuperAdmin account created:', result);
    return result;
  } catch (error) {
    console.error('Error creating superadmin:', error);
    throw error;
  }
};
