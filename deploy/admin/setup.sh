#!/usr/bin/env bash
# Install janrosell.com/stats/ and /server/ on ion. Safe to run again.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
	echo "Run as root: sudo bash deploy/admin/setup.sh" >&2
	exit 1
fi

SRC="$(cd "$(dirname "$0")" && pwd)"
SITE=/etc/nginx/sites-available/janrosell.com
HTPASSWD=/etc/nginx/htpasswd/janrosell-admin
USER_NAME="${ADMIN_USER:-jan}"

install -d -m 750 -o root -g adm /var/log/janrosell
install -d -m 750 -o root -g www-data /var/www/janrosell-admin
install -d -m 750 -o root -g www-data /var/www/janrosell-admin/stats
install -d -m 750 -o root -g www-data /var/www/janrosell-admin/server
install -d -m 755 -o root -g root /etc/nginx/htpasswd

install -m 755 "$SRC/refresh.sh" /usr/local/sbin/janrosell-admin-refresh
install -m 644 "$SRC/janrosell-admin.conf" /etc/nginx/snippets/janrosell-admin.conf
install -m 644 "$SRC/logrotate.conf" /etc/logrotate.d/janrosell
install -m 644 "$SRC/janrosell-admin.cron" /etc/cron.d/janrosell-admin

if [[ ! -f "$HTPASSWD" || "${1:-}" == "--reset-password" ]]; then
	if ! command -v htpasswd >/dev/null 2>&1; then
		echo "htpasswd is missing. Install apache2-utils." >&2
		exit 1
	fi
	PASS="$(openssl rand -hex 12)"
	htpasswd -bcB "$HTPASSWD" "$USER_NAME" "$PASS"
	chown root:www-data "$HTPASSWD"
	chmod 640 "$HTPASSWD"
	echo "USERNAME=$USER_NAME"
	echo "PASSWORD=$PASS"
else
	echo "Password file already exists. Run with --reset-password to replace it."
fi

python3 - "$SITE" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
marker = "snippets/janrosell-admin.conf"
if marker in text:
    raise SystemExit(0)
old = "    server_name janrosell.com www.janrosell.com;\n"
new = (
    old
    + "\n"
    + "    access_log /var/log/nginx/access.log;\n"
    + "    access_log /var/log/janrosell/access.log;\n"
    + "    include /etc/nginx/snippets/janrosell-admin.conf;\n"
)
if old not in text:
    sys.exit("Could not find the janrosell.com server block")
path.write_text(text.replace(old, new, 1))
print("Updated", path)
PY

nginx -t
systemctl reload nginx
/usr/local/sbin/janrosell-admin-refresh

echo "Ready: https://janrosell.com/stats/ and https://janrosell.com/server/"
