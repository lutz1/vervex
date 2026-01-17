#!/bin/bash
# Quick deployment script for Firebase Cloud Functions

set -e

echo "🚀 Vervex Security Update - Deployment Guide"
echo "=============================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || firebase login

echo "✅ Authenticated with Firebase"
echo ""

# Install function dependencies
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

echo "✅ Dependencies installed"
echo ""

# Show current project
echo "📋 Current Firebase project:"
firebase projects:list

echo ""
echo "Ready to deploy. Run one of the following commands:"
echo ""
echo "1. Deploy everything (Recommended for first-time setup):"
echo "   firebase deploy"
echo ""
echo "2. Deploy only Cloud Functions:"
echo "   firebase deploy --only functions"
echo ""
echo "3. Deploy only Firestore Rules:"
echo "   firebase deploy --only firestore:rules"
echo ""
echo "4. Deploy to specific project:"
echo "   firebase deploy --project YOUR_PROJECT_ID"
echo ""

echo "⚠️  IMPORTANT: Before deploying to production:"
echo ""
echo "1. ✓ Test Cloud Functions locally:"
echo "   firebase emulators:start --only functions,firestore"
echo ""
echo "2. ✓ Review security rules in firestore.rules"
echo ""
echo "3. ✓ Ensure superadmin account exists in Firestore"
echo ""
echo "4. ✓ Train admins on new user creation process"
echo ""

read -p "Continue with deployment? (yes/no) " -n 3 -r
echo
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "🚀 Starting deployment..."
    firebase deploy
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📊 View logs:"
    echo "   firebase functions:log"
    echo ""
    echo "🔍 Check audit logs in Firebase Console:"
    echo "   Cloud Firestore > audit_logs collection"
else
    echo "⏸️  Deployment cancelled"
fi
