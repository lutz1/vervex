# GitHub Pages Deployment Guide

## Setup Instructions

### 1. Update Homepage URL
Edit `package.json` and replace `yourusername` with your actual GitHub username:

```json
"homepage": "https://yourusername.github.io/vervex"
```

### 2. Push to GitHub
Initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/vervex.git
git push -u origin main
```

### 3. Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment"
   - Source: Select "Deploy from a branch"
   - Branch: Select `gh-pages` (created by workflow) and `/root`
   - Click **Save**

### 4. Automatic Deployment
The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Trigger on every push to `main` or `master`
- Build your React app
- Deploy to GitHub Pages

Your site will be live at: `https://yourusername.github.io/vervex`

### 5. Manual Deployment (Optional)
If you need to deploy manually:

```bash
npm run deploy
```

## Important Notes

- **Cloud Functions**: Your Firebase Cloud Functions URLs remain the same:
  - Create User: `https://us-central1-vervex-c5b91.cloudfunctions.net/createUserHttp`
  - Delete User: `https://us-central1-vervex-c5b91.cloudfunctions.net/deleteUserHttp`
  
- **CORS**: Already configured to accept requests from any origin

- **Firestore & Auth**: Continue to use your Firebase project as-is

- **Environment Variables**: Your Firebase config is hardcoded (public) which is fine since Firebase has security rules

## Troubleshooting

### Build fails
- Check that all imports are correct
- Ensure `npm install` completes without errors
- Review the GitHub Actions logs

### Page shows 404
- Verify the repository name matches the one in `homepage`
- Check that GitHub Pages is enabled in repository settings
- Wait a few minutes for the deployment to complete

### Blank page or styling issues
- Clear browser cache
- Check browser console for errors
- Verify all API calls use correct Cloud Functions URLs
