#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
	# shellcheck disable=SC1091
	. "$NVM_DIR/nvm.sh"
fi

set -a
[ -f .env ] && . ./.env
[ -f .env.production ] && . ./.env.production
set +a

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-4321}"

exec node dist/server/entry.mjs
