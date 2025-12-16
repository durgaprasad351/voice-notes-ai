#!/bin/sh

# Xcode Cloud Post-Clone Script
# This script runs after Xcode Cloud clones your repository

set -e

echo "🔧 Setting up Expo project for Xcode Cloud..."

# Navigate to project directory
cd ..

# Install dependencies
echo "📦 Installing npm dependencies..."
npm ci

# Set locale for CocoaPods
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Install CocoaPods dependencies
echo "📦 Installing CocoaPods..."
cd ios
pod install
cd ..

echo "✅ Xcode Cloud setup complete!"
echo "📱 Workspace location: ios/NoteOnGoAI.xcworkspace"

