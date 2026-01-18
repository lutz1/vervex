const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Helper function to verify ID token and get user
async function verifyToken(token) {
  if (!token) return null;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}

// Minimal Cloud Function for secure user creation
exports.createUserHttp = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    const data = req.body;
    
    // Get ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthenticated',
        message: 'User must be authenticated to create users'
      });
    }

    const token = authHeader.substring(7);
    const authContext = await verifyToken(token);
    
    if (!authContext) {
      return res.status(401).json({
        error: 'unauthenticated',
        message: 'Invalid or expired token'
      });
    }
    const callerId = authContext.uid;
    
    try {

    // Verify caller is superadmin
    const callerDoc = await db.collection('users').doc(callerId).get();
    if (!callerDoc.exists) {
      console.warn(`User ${callerId} not found in Firestore`);
      return res.status(403).json({
        error: 'permission-denied',
        message: 'User profile not found'
      });
    }
    
    const callerData = callerDoc.data();
    if (callerData.role !== 'superadmin') {
      console.warn(`User ${callerId} attempted to create user but is not superadmin. Role: ${callerData.role}`);
      return res.status(403).json({
        error: 'permission-denied',
        message: 'Only superadmins can create users'
      });
    }

    // Extract user data
    const { email, password, username, fullName, birthDate, contactNumber, address, role } = data;

    // Validate required fields
    if (!email || !password || !username || !fullName) {
      return res.status(400).json({
        error: 'invalid-argument',
        message: 'Email, password, username, and fullName are required'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'invalid-argument',
        message: 'Password must be at least 6 characters'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'invalid-argument',
        message: 'Invalid email format'
      });
    }

    // Check if email already exists in Auth
    try {
      await auth.getUserByEmail(email);
      return res.status(409).json({
        error: 'already-exists',
        message: 'Email already exists'
      });
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
      // User doesn't exist - this is what we want
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      username,
      fullName,
      birthDate: birthDate || '',
      contactNumber: contactNumber || '',
      address: address || '',
      role: role || 'user',
      isActive: true,
      joinDate: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      message: `User ${fullName} created successfully`,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code && error.code.startsWith('auth/')) {
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({
          error: 'already-exists',
          message: 'Email already exists'
        });
      }
      return res.status(500).json({
        error: 'internal',
        message: error.message
      });
    }
    return res.status(500).json({
      error: 'internal',
      message: 'Failed to create user: ' + (error.message || 'Unknown error')
    });
  }
  });
});

// Cloud Function for secure user deletion
exports.deleteUserHttp = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    const data = req.body;
    
    // Get ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthenticated',
        message: 'User must be authenticated to delete users'
      });
    }

    const token = authHeader.substring(7);
    const authContext = await verifyToken(token);
    
    if (!authContext) {
      return res.status(401).json({
        error: 'unauthenticated',
        message: 'Invalid or expired token'
      });
    }

    const callerId = authContext.uid;
    const { userId } = data;
    
    try {
      // Verify caller is superadmin
      const callerDoc = await db.collection('users').doc(callerId).get();
      if (!callerDoc.exists || callerDoc.data().role !== 'superadmin') {
        return res.status(403).json({
          error: 'permission-denied',
          message: 'Only superadmins can delete users'
        });
      }

      // Prevent deleting your own account
      if (callerId === userId) {
        return res.status(400).json({
          error: 'invalid-argument',
          message: 'Cannot delete your own account'
        });
      }

      // Delete user from Auth
      await auth.deleteUser(userId);

      // Delete user document from Firestore
      await db.collection('users').doc(userId).delete();

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.code && error.code.startsWith('auth/')) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({
            error: 'not-found',
            message: 'User not found'
          });
        }
        return res.status(500).json({
          error: 'internal',
          message: error.message
        });
      }
      return res.status(500).json({
        error: 'internal',
        message: 'Failed to delete user'
      });
    }
  });
});
