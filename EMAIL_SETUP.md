# Email Setup Guide for Vervex

## Overview
The system sends welcome emails to newly registered members with their login credentials (email + password: `password123`).

## Environment Variables Configuration

### Option 1: Using Firebase Config (Legacy - Deprecated after March 2026)
```bash
firebase functions:config:set email.user="your-gmail@gmail.com" email.password="your-app-password" email.app_url="https://your-vervex-domain.com"
```

Then deploy:
```bash
firebase deploy --only functions
```

### Option 2: Using .env.local (Recommended)
Create a `.env.local` file in the `functions` directory:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
APP_URL=https://your-vervex-domain.com
```

## Gmail Setup Instructions

### Step 1: Enable Less Secure App Access (if using Gmail)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "Less secure app access" (if not using App Passwords)
3. Or use App Password (recommended):

### Step 2: Generate Gmail App Password (Recommended)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Go to "App passwords" section
4. Select "Mail" and "Windows Computer"
5. Copy the generated password
6. Use this as your `EMAIL_PASSWORD`

### Step 3: Update Configuration
Replace with your actual values:
- `your-gmail@gmail.com` - Your Gmail address
- `your-app-password` - Your Gmail App Password
- `https://your-vervex-domain.com` - Your Vervex app URL (e.g., https://vervex.netlify.app)

## Email Template
When a member is registered via payment code activation, they receive:
- **Email Subject:** "Welcome to Vervex - Your Account is Ready"
- **Email Content:**
  - Greeting with member's name
  - Login credentials (Email and Password: `password123`)
  - Direct login link
  - Reminder to change password after first login

## Testing Email Setup

### Test via Firebase Emulator
```bash
npm run serve
```
Check the console output for email sending logs.

### Test via Deployed Function
Call the `registerUserFromCodeHttp` Cloud Function with valid parameters to trigger email sending.

## Troubleshooting

### Email Not Sending
1. Check Firebase Cloud Functions logs:
   ```bash
   firebase functions:log
   ```
2. Verify environment variables are set:
   ```bash
   firebase functions:config:get
   ```
3. Check Gmail App Password is correct
4. Verify 2-Step Verification is enabled on Gmail account

### Common Errors
- **"Email credentials not configured"** - Set EMAIL_USER and EMAIL_PASSWORD environment variables
- **"Invalid login"** - Check Gmail App Password or enable less secure app access
- **"Invalid URL"** - Verify APP_URL is correct (should start with https://)

## Environment Variable Migration (March 2026)

Firebase is deprecating the old `functions.config()` API. To migrate to the new `params` package:

```bash
firebase functions:config:export
firebase functions:config:import
```

## Next Steps
1. Generate Gmail App Password
2. Run: `firebase functions:config:set email.user="..." email.password="..." email.app_url="..."`
3. Deploy: `firebase deploy --only functions`
4. Test code activation to verify email is sent
