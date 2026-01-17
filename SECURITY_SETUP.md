# Security Implementation - User Management Backend Guide

## Overview


The user management system now uses direct Firestore and Firebase Auth operations for all sensitive actions. This ensures:

✅ **No passwords stored or transmitted on the frontend**
✅ **Server-side authorization validation** - Only superadmins can create/delete/update users
✅ **Audit logging** - All user creation/deletion/role changes are logged (if implemented)
✅ **Session preservation** - Superadmin session is never interrupted
✅ **Input validation** - All data is validated on the backend
✅ **Role-based access control** - Enforced on both frontend and Firestore

## What Changed


### Frontend Changes (UserManagement.jsx)
- Removed: Password handling, user creation on frontend
- Removed: All Cloud Functions usage
- Added: Direct Firestore/Auth calls for user management
- Result: Superadmin session is never switched


### Backend Changes
- All user management operations are now performed directly using Firestore and Firebase Auth SDKs.
- No Cloud Functions are used for user management.

## Security Features


### 1. Two-Layer Authentication
- **Frontend**: Firebase Authentication (user must be logged in)
- **Backend**: Firestore document check (verify caller is superadmin)


### 2. Input Validation (Backend)
All input validation is handled in the frontend and backend utility functions. Ensure:
- Email format is valid
- Password is at least 6 characters
- Role is in the allowed list
- Email is unique


### 3. Audit Logging
If audit logging is required, implement logging to an `audit_logs` collection in Firestore for every user creation, deletion, or role change.


### 4. Firestore Security Rules
```firestore
// Users collection - Controlled writes
allow write: if isAuthenticated() && isSuperAdmin(request.auth.uid);

// Audit logs (if implemented)
allow write: if isAuthenticated() && isSuperAdmin(request.auth.uid);
allow read: if isAuthenticated() && isSuperAdmin(request.auth.uid);
```

## Deployment Instructions

### Important: GitHub Pages + Firebase


Your app uses:
- **Frontend Hosting**: GitHub Pages
- **Backend Services**: Firebase (Firestore, Auth)

These are **separate deployments**:

```
┌─────────────────────────────────────┐
│ GitHub Pages                        │
│ (Your React app - npm run deploy)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Firebase                            │
│ ├─ Firestore                        │
│ │  (User management backend)        │
│ └─ Auth                             │
│    (Authentication)                 │
└─────────────────────────────────────┘
```

### 1. Install Firebase CLI (One-Time)
```bash
npm install -g firebase-tools
firebase login
```

### 2. Deploy Cloud Functions to Firebase
```bash
cd functions
npm install
cd ..

# Deploy ONLY Cloud Functions (NOT hosting)
firebase deploy --only functions
```

### 3. Deploy React to GitHub Pages (When You Have Updates)
```bash
# Your existing deployment command
npm run deploy
```

### 4. Deploy Firestore Rules (After Functions)
```bash
firebase deploy --only firestore:rules
```

## Verification

### Cloud Functions Deployed?
```bash
firebase functions:log
# Should show your functions are running
```

### GitHub Pages Updated?
```bash
# Check your repo's GitHub Pages settings
# Should point to gh-pages branch
```

## Error Handling

The frontend handles specific error codes:

| Error Code | Message | Cause |
|-----------|---------|-------|
| `already-exists` | "A user with this email already exists" | Email is already registered |
| `permission-denied` | "Only superadmins can create users" | Caller is not a superadmin |
| `invalid-argument` | "Invalid input data provided" | Bad password, role, email format |
| `unauthenticated` | "Please log in again to create users" | User session expired |
| `internal` | "An error occurred while creating the user" | Server error |

## Testing the Functions

### Create User
```javascript
const createUserFunction = httpsCallable(functions, 'createUser');
const response = await createUserFunction({
  email: 'user@example.com',
  password: 'securePassword123',
  username: 'johndoe',
  fullName: 'John Doe',
  role: 'admin'
});
```

### Update Role
```javascript
const updateRoleFunction = httpsCallable(functions, 'updateUserRole');
const response = await updateRoleFunction({
  userId: 'user-uid-here',
  newRole: 'superadmin'
});
```

### Delete User
```javascript
const deleteUserFunction = httpsCallable(functions, 'deleteUser');
const response = await deleteUserFunction({
  userId: 'user-uid-here'
});
```

## Monitoring

### View Logs
```bash
firebase functions:log
```

### View Audit Trail
In Firebase Console:
1. Go to Cloud Firestore
2. Open `audit_logs` collection
3. Review all admin actions

## Best Practices

1. **Never expose Admin SDK code** on the frontend
2. **Always validate on the backend** - Frontend validation is for UX only
3. **Use HTTPS only** - Never send sensitive data over HTTP
4. **Keep functions updated** - Update firebase-admin and firebase-functions regularly
5. **Monitor audit logs** - Review who created/deleted users and when
6. **Use strong passwords** - Enforce password policies for all users
7. **Rotate credentials** - If a superadmin account is compromised, delete it immediately

## Troubleshooting

### Functions not deploying?
```bash
firebase login
firebase projects:list
firebase deploy --project YOUR_PROJECT_ID
```

### "Permission denied" error?
- Check that `functions/node_modules` exists
- Check Firebase project permissions
- Verify you have the correct Firebase CLI version

### Cloud Functions not callable from frontend?
- Verify `getFunctions()` returns correct region
- Check CORS settings in Cloud Functions
- Verify Firestore rules allow Cloud Functions to write

## Next Steps

1. Deploy functions to production
2. Update Firestore rules to enforce new audit_logs collection
3. Train superadmins on the new user creation process
4. Monitor audit logs regularly
5. Set up alerts for suspicious activities
