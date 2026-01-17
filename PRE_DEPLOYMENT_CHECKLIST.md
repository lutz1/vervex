# ✅ Pre-Deployment Checklist

## Before You Deploy to Production

Use this checklist to ensure everything is ready.

### Code Review
- [ ] Review `functions/index.js` for security issues
- [ ] Verify all input validations are present
- [ ] Check that only superadmins can perform admin actions
- [ ] Ensure no sensitive data is logged
- [ ] Review error messages (don't expose system details)

### Firestore Rules
- [ ] Review `firestore.rules` for any gaps
- [ ] Verify `audit_logs` collection is protected
- [ ] Test that users cannot create other users
- [ ] Test that users cannot access other user documents
- [ ] Test that superadmins have full access

### Dependencies
- [ ] Check `functions/package.json` versions are current
- [ ] Run `npm audit` in functions folder for vulnerabilities
- [ ] Verify firebase-admin version is 12.0.0+
- [ ] Verify firebase-functions version is 5.0.1+

### Frontend Code
- [ ] Review `UserManagement.jsx` for hardcoded secrets
- [ ] Verify Cloud Functions are called correctly
- [ ] Check error handling is comprehensive
- [ ] Ensure no console.log() with sensitive data in production

### Local Testing
- [ ] Start emulators: `firebase emulators:start`
- [ ] Test creating a new user
- [ ] Verify superadmin stays logged in
- [ ] Test creating user with invalid data (should fail)
- [ ] Verify audit logs are created
- [ ] Test non-superadmin cannot create users

### Security Testing
- [ ] Test with weak password (< 6 chars) → Should fail
- [ ] Test with invalid email format → Should fail  
- [ ] Test with duplicate email → Should fail
- [ ] Test with non-superadmin account → Should fail
- [ ] Test role validation (invalid roles) → Should fail
- [ ] Verify no error messages expose internal details

### Configuration
- [ ] Verify `firebase.json` includes functions config
- [ ] Check `.gitignore` includes `/functions/node_modules`
- [ ] Ensure `.firebaserc` has correct project selected
- [ ] Verify Firebase project is set to production environment

### Backup & Rollback
- [ ] Back up current Firestore data
- [ ] Document current Cloud Functions version
- [ ] Save current `firestore.rules` backup
- [ ] Create git commit before deploying
- [ ] Test rollback procedure locally

### Team Communication
- [ ] Notify team of upcoming deployment
- [ ] Schedule downtime window (if needed)
- [ ] Brief superadmins on new audit logging
- [ ] Document user creation process changes (none for users!)
- [ ] Create support documentation

### Documentation
- [ ] Review [QUICK_START.md](./QUICK_START.md)
- [ ] Review [SECURITY_SETUP.md](./SECURITY_SETUP.md)
- [ ] Review [functions/README.md](./functions/README.md)
- [ ] Update team wiki/docs with new information

## Deployment Day

### Pre-Deployment (1 Hour Before)
- [ ] Alert team that deployment is starting
- [ ] Take screenshot of current system
- [ ] Stop any active user management operations
- [ ] Back up Firestore (export via Firebase Console)

### Deployment
```bash
# Step 1: Verify authentication
firebase login

# Step 2: Verify correct project
firebase projects:list

# Step 3: Deploy!
firebase deploy
```

### Post-Deployment (Immediately After)
- [ ] Check deployment status (should show ✓ for all)
- [ ] View Cloud Functions logs: `firebase functions:log`
- [ ] Verify no errors in logs
- [ ] Test creating a new user
- [ ] Verify superadmin stays logged in
- [ ] Check that audit log entry was created

### Verification (First Hour)
- [ ] Have a superadmin test creating a user
- [ ] Verify they remain logged in
- [ ] Check audit logs for entries
- [ ] Test error cases (invalid inputs)
- [ ] Monitor Cloud Functions logs for errors

### Monitoring (First 24 Hours)
- [ ] Check logs every hour for errors
- [ ] Monitor Firestore quota usage
- [ ] Track response times of Cloud Functions
- [ ] Review any user-reported issues
- [ ] Check audit logs for suspicious activity

## Rollback Procedure (If Issues)

### If Deployment Failed
```bash
# Re-run deployment
firebase deploy

# Or redeploy specific component
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### If Critical Issues After Deployment
```bash
# View logs to diagnose
firebase functions:log

# Revert to previous version
git revert <commit-hash>
firebase deploy --force

# Monitor after rollback
firebase functions:log
```

### Restore Data (If Needed)
1. Firebase Console > Firestore
2. Click three dots menu
3. "Import documents"
4. Select backed-up data export

## Performance Baselines

Record these before deployment for comparison:

- [ ] Cloud Function execution time: ___ ms
- [ ] Firestore read operations/sec: ___
- [ ] Firestore write operations/sec: ___
- [ ] Cloud Function error rate: ___ %
- [ ] Average user creation time: ___ ms

## Post-Deployment Cleanup

- [ ] Update team documentation
- [ ] Create backup of current working state in git
- [ ] Document any issues encountered
- [ ] Thank team for testing
- [ ] Schedule post-deployment review

## Sign-Off

- [ ] Development Lead: _________________ Date: _____
- [ ] QA Lead: _________________________ Date: _____
- [ ] DevOps Lead: _____________________ Date: _____
- [ ] Project Manager: __________________ Date: _____

## Additional Notes

Document any issues, gotchas, or important notes here:

```
[Add notes here]
```

---

**Deployment Date**: ________________  
**Deployed By**: _____________________  
**Approved By**: ______________________  

**Status After Deployment**: ☐ Success ☐ Partial ☐ Rolled Back

**Issues Encountered**:
```
[List any issues here]
```

**Resolution**:
```
[How they were resolved]
```
