#!/bin/sh

# Xcode Cloud Post-Clone Script
# This script runs after Xcode Cloud clones your repository

set -e  # Exit on any error
set -x  # Print all commands (for debugging)

echo "========================================="
echo "🔧 Xcode Cloud Post-Clone Setup"
echo "========================================="

# Print environment info
echo "📍 Current directory: $(pwd)"
echo "📍 Repository root: $CI_WORKSPACE"
echo "📍 Node version: $(node --version)"
echo "📍 npm version: $(npm --version)"

# Navigate to project root
cd $CI_WORKSPACE

# Install npm dependencies
echo ""
echo "========================================="
echo "📦 Installing npm dependencies..."
echo "========================================="
npm ci --legacy-peer-deps

# Set locale for CocoaPods
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Check if Podfile exists
if [ ! -f "ios/Podfile" ]; then
    echo "❌ Error: ios/Podfile not found!"
    exit 1
fi

# Install CocoaPods dependencies
echo ""
echo "========================================="
echo "📦 Installing CocoaPods..."
echo "========================================="
cd ios

# Update CocoaPods repo (optional, but ensures latest pods)
echo "Updating CocoaPods repo..."
pod repo update

# Install pods
echo "Installing pods..."
pod install --verbose

cd ..

echo ""
echo "========================================="
echo "✅ Xcode Cloud setup complete!"
echo "========================================="
echo "📱 Workspace: ios/NoteOnGoAI.xcworkspace"
echo "📱 Scheme: NoteOnGoAI"

# List installed pods (for debugging)
echo ""
echo "Installed Pods:"
ls -la ios/Pods/ | head -20

