#!/bin/sh
set -ex

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "Repository path: $CI_PRIMARY_REPOSITORY_PATH"
echo "Current PATH: $PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Installing Node.js with Homebrew..."
  brew install node@20
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
fi

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

echo "Installing JavaScript dependencies"
export HUSKY=0
npm ci --no-audit --no-fund

cd ios

if ! command -v pod >/dev/null 2>&1; then
  echo "pod not found. Installing CocoaPods with Homebrew..."
  brew install cocoapods
fi

echo "Installing CocoaPods dependencies"
pod install --repo-update
