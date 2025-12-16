#!/bin/sh

# Xcode Cloud Pre-Build Script
# This runs right before xcodebuild

set -e

echo "========================================="
echo "🔍 Pre-Build Verification"
echo "========================================="

# Verify workspace exists
if [ ! -d "ios/NoteOnGoAI.xcworkspace" ]; then
    echo "❌ Error: Workspace not found!"
    exit 1
else
    echo "✅ Workspace found: ios/NoteOnGoAI.xcworkspace"
fi

# Verify Pods are installed
if [ ! -d "ios/Pods" ]; then
    echo "❌ Error: Pods not installed!"
    echo "Running pod install as fallback..."
    cd ios
    pod install
    cd ..
else
    echo "✅ Pods directory found"
    echo "📦 Installed pods:"
    ls -1 ios/Pods/ | grep -v "Target Support Files" | head -10
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "⚠️  Warning: node_modules not found!"
else
    echo "✅ node_modules found"
fi

echo "========================================="
echo "✅ Pre-Build verification complete!"
echo "========================================="

