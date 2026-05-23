#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${FORPSI_ENV_FILE:-$ROOT_DIR/deploy/forpsi.env}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "Missing dependency: lftp"
  echo "Install it first, for example: brew install lftp"
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${FORPSI_FTP_HOST:?Set FORPSI_FTP_HOST in deploy/forpsi.env or environment}"
: "${FORPSI_FTP_USER:?Set FORPSI_FTP_USER in deploy/forpsi.env or environment}"
: "${FORPSI_FTP_PASS:?Set FORPSI_FTP_PASS in deploy/forpsi.env or environment}"
: "${FORPSI_REMOTE_DIR:=/www}"
: "${FORPSI_DELETE_REMOTE:=0}"
: "${FORPSI_DRY_RUN:=1}"

MIRROR_FLAGS=(
  --reverse
  --verbose
  --only-newer
  --parallel=3
  --exclude-glob=.git/
  --exclude-glob=.github/
  --exclude-glob=deploy/
  --exclude-glob=node_modules/
  --exclude-glob=.DS_Store
  --exclude-glob=.env
  --exclude-glob=.env.*
  --exclude-glob=*.log
  --exclude-glob=*.tmp
  --exclude-glob=*.bak
  --exclude-glob=lighthouse-report.*
)

if [[ "$FORPSI_DELETE_REMOTE" == "1" ]]; then
  MIRROR_FLAGS+=(--delete)
fi

if [[ "$FORPSI_DRY_RUN" == "1" ]]; then
  MIRROR_FLAGS+=(--dry-run)
  echo "Dry run only. Set FORPSI_DRY_RUN=0 for real upload."
fi

echo "Deploy source: $ROOT_DIR"
echo "Deploy target: $FORPSI_FTP_HOST:$FORPSI_REMOTE_DIR"

lftp \
  -u "$FORPSI_FTP_USER","$FORPSI_FTP_PASS" \
  "$FORPSI_FTP_HOST" \
  -e "
    set ftp:ssl-allow true;
    set ftp:ssl-protect-data true;
    set net:timeout 20;
    set net:max-retries 2;
    mirror ${MIRROR_FLAGS[*]} '$ROOT_DIR' '$FORPSI_REMOTE_DIR';
    bye
  "
