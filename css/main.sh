#!/bin/bash

# Bash Script to Install ADB on Ubuntu

echo "Updating package list..."
sudo apt update

echo "Installing Android Tools ADB..."
sudo apt install -y android-tools-adb

echo "Verifying ADB installation..."
adb version

if [ $? -eq 0 ]; then
    echo "ADB installed successfully!"
else
    echo "ADB installation failed."
fi