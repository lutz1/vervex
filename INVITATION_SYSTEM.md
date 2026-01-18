# Invitation System Documentation

## Overview
The invitation system allows VIP, Ambassador, and Supreme users to invite new members to their network. Invitations are stored in a separate Firestore collection for easy management and tracking.

## Database Structure

### Invitations Collection
Stores all invitations sent by users. Each invitation document contains:

```javascript
{
  invitedEmail: "newmember@example.com",        // Email of invited person (lowercase)
  invitedName: "John Doe",                      // Full name of invited person
  parentId: "user-uid-123",                     // UID of the person inviting (the referrer)
  createdBy: "user-uid-123",                    // UID of who created the invitation
  createdAt: Timestamp,                         // Server timestamp when invitation was created
  status: "pending",                            // 'pending', 'accepted', 'rejected'
  invitationLink: "https://app.com/accept-...", // Link for invitee to accept
}
```

### When Invitation is Accepted
When the invited person accepts the invitation, a new user is created in the `users` collection with:
- `referrerId: parentId` - Links them to their network position
- `email: invitedEmail` - From the invitation
- `name: invitedName` - From the invitation
- `status: "Active"` - Account is activated
- Invitation document `status` is updated to `"accepted"`

## Firestore Rules

### VIP/Ambassador/Supreme Permissions
- Can read all users (for genealogy tree building)
- Can create invitations
- Can read and update their own invitations
- Cannot create users directly

### SuperAdmin Permissions
- Full access to invitations and users
- Can manage all invitations and override statuses

## User Flow

1. **User clicks "+" button on empty slot**
   - Invite modal opens
   - User enters invitee email and name

2. **User sends invitation**
   - Invitation document created in `invitations` collection
   - `status` set to `"pending"`
   - Email can be sent to invitee with the invitation link

3. **Invitee receives invitation**
   - They can access the invitation link
   - Click "Accept Invitation"
   - System creates user in `users` collection with `referrerId` set to inviter

4. **Genealogy tree updates**
   - New user appears in the network
   - Moves from empty slot to filled position

## Benefits of Separate Collection

1. **Easy Tracking**: View all sent invitations and their status
2. **Audit Trail**: Know when invitations were created and by whom
3. **Flexibility**: Can resend invitations, track acceptance rate
4. **Clean User Data**: Users collection only contains activated accounts
5. **Better Compliance**: Can track invitation history separately

## Implementation Status

- ✅ Firestore rules updated for invitations collection
- ✅ Genealogy component stores invitations
- ✅ Invitation modal collects email and name
- ⏳ **Pending**: Accept invitation page/endpoint to create users
- ⏳ **Pending**: Email notification when invitation is sent
- ⏳ **Pending**: Admin dashboard to view all invitations

## Next Steps

To complete the system:
1. Create `/accept-invitation` page that:
   - Verifies invitation exists and is pending
   - Gets user data from invitation document
   - Creates new user with correct referrerId
   - Updates invitation status to "accepted"

2. Set up email notifications

3. Create admin panel to manage invitations
