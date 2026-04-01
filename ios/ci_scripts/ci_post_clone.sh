#!/bin/sh
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "Installing JavaScript dependencies"
npm ci

echo "Installing CocoaPods dependencies"
cd ios
pod install --repo-update
