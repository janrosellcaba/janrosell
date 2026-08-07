#!/bin/bash

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building the app..."
npm run build

echo "🔄 Restarting service..."
sudo systemctl restart janrosell

echo "✅ Deployment complete!"
