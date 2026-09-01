#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

ENV_FILE=".env.production"

ensure_env_file() {
	if [ -f "$ENV_FILE" ]; then
		return
	fi

	if [ -f "resend" ]; then
		echo "⚙️  Creating $ENV_FILE from resend credentials..."
		API_KEY="$(grep -oE 're_[A-Za-z0-9_]+' resend | head -1)"
		if [ -z "$API_KEY" ]; then
			echo "❌ Could not find Resend API key in resend file."
			exit 1
		fi
		cat > "$ENV_FILE" <<EOF
RESEND_API_KEY=${API_KEY}
CONTACT_EMAIL=jan@janrosell.com
RESEND_FROM=onboarding@resend.dev
EOF
		chmod 600 "$ENV_FILE"
		return
	fi

	echo "❌ Missing $ENV_FILE and resend file. Add Resend credentials before deploying."
	exit 1
}

ensure_env_file

if [ -f "$ENV_FILE" ]; then
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
fi

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building the app..."
npm run build

echo "⚙️  Updating systemd service..."
sudo cp deploy/janrosell.service /etc/systemd/system/janrosell.service
sudo systemctl daemon-reload
sudo systemctl enable janrosell

echo "🔄 Restarting service..."
sudo systemctl restart janrosell

echo "✅ Deployment complete!"
