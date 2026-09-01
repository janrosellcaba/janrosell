#!/bin/bash
set -euo pipefail

REMOTE="${DEPLOY_REMOTE:-jan@janrosell.com}"
APP_DIR="${DEPLOY_DIR:-/home/jan/janrosell}"

if [ ! -f "resend" ]; then
	echo "❌ Missing resend file with your Resend API key."
	exit 1
fi

echo "📤 Uploading Resend credentials..."
scp resend "${REMOTE}:${APP_DIR}/resend"

echo "🚀 Deploying on server..."
ssh "${REMOTE}" "cd ${APP_DIR} && bash deploy.sh"

echo "✅ Remote deployment complete!"
