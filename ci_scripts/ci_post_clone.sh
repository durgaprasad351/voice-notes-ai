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

# Install Expo CLI
echo "📦 Installing Expo CLI..."
npm install -g expo-cli

# Set locale for CocoaPods
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Generate iOS project if it doesn't exist
echo "🏗️ Generating iOS project..."
npx expo prebuild --platform ios --clean

# Install CocoaPods dependencies
echo "📦 Installing CocoaPods..."
cd ios
pod install
cd ..

echo "✅ Xcode Cloud setup complete!"
echo "📱 Workspace location: ios/NoteOnGoAI.xcworkspace"

