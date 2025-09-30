#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
FILE="backups/nebolla-$STAMP.sql.gz"
pg_dump -h 127.0.0.1 -p 5434 -U postgres nebolla | gzip > "$FILE"
echo "Local backup: $FILE"
# S3 upload (optional; requires AWS CLI configured)
# aws s3 cp "$FILE" "s3://${S3_BUCKET}/db-backups/${STAMP}.sql.gz"
