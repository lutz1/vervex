@echo off
REM Firebase Cloud Functions deployment script (Windows)
REM NOTE: This deploys ONLY Cloud Functions, NOT your GitHub Pages hosting

setlocal enabledelayedexpansion

echo.
echo 🚀 Vervex Cloud Functions - Deployment Script
echo ================================================
echo.
echo NOTE: This script deploys Cloud Functions to Firebase ONLY
echo Your GitHub Pages hosting is deployed separately with: npm run deploy
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Installing...
    call npm install -g firebase-tools
    if errorlevel 1 (
        echo Error installing Firebase CLI
        exit /b 1
    )
)

echo ✅ Firebase CLI found
echo.

REM Check authentication
echo 🔐 Checking Firebase authentication...
call firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo Please log in to Firebase...
    call firebase login
)

echo ✅ Authenticated with Firebase
echo.

REM Install dependencies
echo 📦 Installing Cloud Functions dependencies...
cd functions
call npm install
cd ..
if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Show current project
echo 📋 Current Firebase project:
call firebase projects:list

echo.
echo Ready to deploy Cloud Functions. Run one of the following:
echo.
echo 1. Deploy Cloud Functions ONLY:
echo    firebase deploy --only functions
echo.
echo 2. Deploy Cloud Functions + Firestore Rules:
echo    firebase deploy --only functions,firestore:rules
echo.
echo 3. Deploy everything (Cloud Functions + Rules):
echo    firebase deploy
echo.
echo.
echo ⚠️  REMEMBER: Deploy frontend separately with: npm run deploy
echo (This deploys to GitHub Pages)
echo.

set /p DEPLOY="Deploy Cloud Functions now? (yes/no): "
if /i "%DEPLOY%"=="yes" (
    echo.
    echo 🚀 Deploying Cloud Functions...
    echo.
    call firebase deploy --only functions
    if errorlevel 1 (
        echo Error during deployment
        exit /b 1
    )
    echo.
    echo ✅ Cloud Functions deployed successfully!
    echo.
    echo 📝 Next: Deploy React frontend to GitHub Pages
    echo    Run: npm run deploy
    echo.
    echo 📊 View Cloud Functions logs:
    echo    firebase functions:log
) else (
    echo ⏸️  Deployment cancelled
)

endlocal
