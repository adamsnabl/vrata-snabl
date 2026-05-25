#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${FORPSI_FORM_ENV_FILE:-$ROOT_DIR/deploy/forpsi-form.env}"

if ! command -v lftp >/dev/null 2>&1; then
  echo "Missing dependency: lftp"
  echo "Install it first, for example: brew install lftp"
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${FORPSI_FTP_HOST:?Set FORPSI_FTP_HOST in deploy/forpsi-form.env or environment}"
: "${FORPSI_FTP_USER:?Set FORPSI_FTP_USER in deploy/forpsi-form.env or environment}"
: "${FORPSI_FTP_PASS:?Set FORPSI_FTP_PASS in deploy/forpsi-form.env or environment}"
: "${FORPSI_FORM_REMOTE_DIR:=/www}"
: "${FORPSI_DRY_RUN:=1}"

LOCAL_FILE="$ROOT_DIR/deploy/forpsi-form/send.php"

if [[ "$FORPSI_DRY_RUN" == "1" ]]; then
  echo "Dry run only. Set FORPSI_DRY_RUN=0 for real upload."
fi

echo "Form endpoint source: $LOCAL_FILE"
echo "Form endpoint target: $FORPSI_FTP_HOST:$FORPSI_FORM_REMOTE_DIR/send.php"

lftp \
  -u "$FORPSI_FTP_USER","$FORPSI_FTP_PASS" \
  "$FORPSI_FTP_HOST" \
  -e "
    set ftp:ssl-allow true;
    set ftp:ssl-protect-data true;
    set net:timeout 20;
    set net:max-retries 2;
    mkdir -p '$FORPSI_FORM_REMOTE_DIR';
    $(if [[ "$FORPSI_DRY_RUN" == "1" ]]; then echo "cls -l '$FORPSI_FORM_REMOTE_DIR';"; else echo "put -O '$FORPSI_FORM_REMOTE_DIR' '$LOCAL_FILE';"; fi)
    bye
  "
