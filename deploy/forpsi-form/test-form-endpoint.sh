#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="${1:-https://form.vratasnabl.cz/send.php}"

curl -sS \
  -X POST "$ENDPOINT" \
  -H "Origin: https://www.vratasnabl.cz" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --data "{
    \"name\":\"Test Vrata Snabl\",
    \"phone\":\"777 286 310\",
    \"email\":\"test@example.com\",
    \"location\":\"Praha test\",
    \"service\":\"Test formulare\",
    \"message\":\"Test odeslani poptavkoveho formulare z webu Vrata Snabl.\",
    \"submitted_from\":\"https://www.vratasnabl.cz/#kontakt\",
    \"form_started_at\":\"$(( $(date +%s) * 1000 - 10000 ))\"
  }"

echo
