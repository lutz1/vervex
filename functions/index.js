const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// CORS configuration - allow localhost for testing and production domains
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000', 'https://vervex-c5b91.web.app', 'https://vervex-app.com', 'https://lutz1.github.io'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const cors = require('cors')(corsOptions);

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Initialize nodemailer transporter with superadmin Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'johnn.onezero@gmail.com',
    pass: 'qxix cshr uvif cdiu',
  },
});

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

// Helper function to send verification email
async function sendVerificationEmail(email, fullName, verificationLink) {
  try {
    await transporter.sendMail({
      from: 'johnn.onezero@gmail.com',
      to: email,
      subject: 'Welcome to Vervex - Please Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">Welcome to Vervex, ${fullName}!</h2>
          <p>Your account has been successfully created.</p>
          
          <p style="margin: 20px 0;">Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #d4af37; color: #081014; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666;">Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
            ${verificationLink}
          </p>
          
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            If you did not create this account, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            Best regards,<br/>
            Vervex Team
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
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

    // Generate email verification link with redirect back to login
    let verificationLink = null;
    let emailSent = false;
    try {
      verificationLink = await admin.auth().generateEmailVerificationLink(email, {
        url: 'https://lutz1.github.io/vervex/login',
        handleCodeInApp: false,
      });
      console.log(`Verification link generated for ${email}`);
      
      // Send verification email
      emailSent = await sendVerificationEmail(email, fullName, verificationLink);
      if (emailSent) {
        console.log(`Verification email sent to ${email}`);
      } else {
        console.warn(`Failed to send verification email to ${email}, but verification link was generated`);
      }
    } catch (linkError) {
      console.warn('Could not generate verification link:', linkError);
    }

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
      emailVerified: false,
      requirePasswordChange: false,
      joinDate: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      verificationLinkGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerificationSentAt: emailSent ? admin.firestore.FieldValue.serverTimestamp() : null,
      metadata: {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return res.status(200).json({
      success: true,
      uid: userRecord.uid,
      message: emailSent 
        ? `User ${fullName} created successfully. Verification email sent to ${email}`
        : `User ${fullName} created successfully. Verification link generated but email sending failed.`,
      email: email,
      verificationLink: verificationLink || null,
      emailSent: emailSent,
      emailVerificationRequired: true,
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

// Cloud Function for registering users from payment code activation
exports.registerUserFromCodeHttp = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    const data = req.body;
    
    // Get ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthenticated',
        message: 'User must be authenticated to register users'
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
      // Verify caller is the inviter (or an admin)
      const callerDoc = await db.collection('users').doc(callerId).get();
      if (!callerDoc.exists) {
        return res.status(403).json({
          error: 'permission-denied',
          message: 'Inviter profile not found'
        });
      }

      // Extract invitation data
      const invitationData = data.invitationData || {};
      const codeRequestId = data.codeRequestId;
      const {
        invitedEmail,
        firstName,
        surname,
        username,
        role,
        parentId
      } = invitationData;

      // Validate required fields
      if (!invitedEmail || !firstName || !surname || !username) {
        return res.status(400).json({
          error: 'invalid-argument',
          message: 'Email, firstName, surname, and username are required'
        });
      }

      // Use default password for the new user
      const tempPassword = 'password123';

      // Check if email already exists in Auth
      try {
        await auth.getUserByEmail(invitedEmail);
        return res.status(409).json({
          error: 'already-exists',
          message: 'Email already exists in authentication system'
        });
      } catch (err) {
        if (err.code !== 'auth/user-not-found') {
          throw err;
        }
        // User doesn't exist - this is what we want
      }

      // Create user in Firebase Auth with temporary password
      const userRecord = await auth.createUser({
        email: invitedEmail,
        password: tempPassword,
        displayName: `${firstName} ${surname}`,
      });

      // Create/update user document in Firestore with all invitation data
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: invitedEmail,
        name: `${firstName} ${surname}`,
        firstName: firstName,
        middleName: invitationData.middleName || '',
        surname: surname,
        username: username,
        birthdate: invitationData.birthdate || '',
        fullAddress: invitationData.fullAddress || '',
        contactNumber: invitationData.contactNumber || '',
        role: role || 'vip',
        referrerId: parentId || callerId,
        status: 'Active',
        balance: 0,
        directInviteEarnings: 0,
        avatar: surname ? surname[0].toUpperCase() : 'U',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerId,
        paymentCode: invitationData.paymentCode || '',
        registrationMethod: 'code',
        isActive: true,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      }, { merge: true });

      // Add direct invite earnings to the parent/inviter
      if (parentId) {
        const parentDoc = await db.collection('users').doc(parentId).get();
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          const DIRECT_INVITE_EARNINGS = {
            vip: 1000,
            ambassador: 4000,
            supreme: 15000,
          };
          const earnings = DIRECT_INVITE_EARNINGS[parentData.role?.toLowerCase()] || 0;
          
          if (earnings > 0) {
            const currentBalance = parentData.balance || 0;
            const currentDirectEarnings = parentData.directInviteEarnings || 0;
            
            await db.collection('users').doc(parentId).update({
              balance: currentBalance + earnings,
              directInviteEarnings: currentDirectEarnings + earnings,
              lastEarningUpdate: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Log the transaction
            await db.collection('transactions').add({
              type: 'direct_invite_earning',
              amount: earnings,
              userId: parentId,
              invitedUserId: userRecord.uid,
              role: parentData.role,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // Update the codeRequest document to mark as member_registered
      if (codeRequestId) {
        try {
          await db.collection('codeRequests').doc(codeRequestId).update({
            status: 'member_registered',
            registeredUserId: userRecord.uid,
            registeredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.warn('Could not update codeRequest document:', err);
          // Continue anyway, user was created successfully
        }
      }

      // Generate Firebase email verification link with redirect back to login
      let verificationLink = null;
      let emailSent = false;
      try {
        verificationLink = await admin.auth().generateEmailVerificationLink(invitedEmail, {
          url: 'https://lutz1.github.io/vervex/login',
          handleCodeInApp: false,
        });
        console.log(`Verification link generated for ${invitedEmail}`);
        
        // Send verification email
        emailSent = await sendVerificationEmail(invitedEmail, `${firstName} ${surname}`, verificationLink);
        if (emailSent) {
          console.log(`Verification email sent to ${invitedEmail}`);
        } else {
          console.warn(`Failed to send verification email to ${invitedEmail}, but verification link was generated`);
        }
      } catch (linkError) {
        console.warn('Could not generate verification link:', linkError);
      }

      // Update user Firestore document to track verification and password change requirement
      try {
        await db.collection('users').doc(userRecord.uid).update({
          emailVerified: false,
          requirePasswordChange: true,
          accountCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          verificationLinkGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          emailVerificationSentAt: emailSent ? admin.firestore.FieldValue.serverTimestamp() : null,
        });
      } catch (err) {
        console.warn('Could not update user account status:', err);
      }

      return res.status(200).json({
        success: true,
        uid: userRecord.uid,
        message: emailSent 
          ? `User ${firstName} ${surname} registered successfully. Verification email sent to ${invitedEmail}`
          : `User ${firstName} ${surname} registered successfully. Verification link generated.`,
        email: invitedEmail,
        verificationLink: verificationLink || null,
        emailSent: emailSent,
        emailVerificationRequired: true,
      });
    } catch (error) {
      console.error('Error registering user from code:', error);
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
        message: 'Failed to register user: ' + (error.message || 'Unknown error')
      });
    }
  });
});
