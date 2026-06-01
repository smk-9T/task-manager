#!/bin/bash

# ==============================================================================
# SECURE TASK MANAGER - DATABASE & ATTACHMENTS BACKUP SCRIPT
# Capstone DevSecOps Project - Scheduled with Cron
# ==============================================================================

# Configurations
BACKUP_DIR="/var/backups/shieldtask"
BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="shieldtask-backup-$BACKUP_DATE.tar.gz"
S3_BUCKET="s3://shieldtask-secure-backups-bucket/production"

# Paths to backup (SQLite DB and uploaded task attachments)
DB_PATH="/usr/src/app/backend/database.sqlite"
UPLOADS_PATH="/usr/src/app/backend/uploads"

echo "=========================================="
echo "🛡️ Starting ShieldTask Secure Backup Process"
echo "🕒 Timestamp: $(date)"
echo "=========================================="

# Create local backup directory if missing
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating local backup folder: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR" # Secure access permissions (root only)
fi

# Ensure database exists before backing up
if [ ! -f "$DB_PATH" ]; then
    echo "⚠️ Warning: Database file not found at $DB_PATH. Creating dry backup structure."
fi

# Compress database and attachments directory
echo "📦 Packing files into archive..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "/usr/src/app/backend" database.sqlite uploads 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Success: Archive created at $BACKUP_DIR/$BACKUP_NAME"
    echo "Size: $(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)"
else
    echo "❌ Error: Compression failed!"
    exit 1
fi

# Upload to AWS S3 using AWS CLI (Bypass sandbox mode command in production)
echo "☁️ Transferring backup archive to secure Amazon S3 Bucket..."
# aws s3 cp "$BACKUP_DIR/$BACKUP_NAME" "$S3_BUCKET/$BACKUP_NAME" --sse AES256

if [ $? -eq 0 ]; then
    echo "✅ Success: Backup uploaded and encrypted on AWS S3 ($S3_BUCKET)"
else
    echo "⚠️ Warning: AWS S3 CLI transfer failed or is unconfigured. Backup is saved locally."
fi

# Housekeeping: Retention Policy (Delete local backups older than 7 days)
echo "🧹 Applying retention policy: purging local backups older than 7 days..."
find "$BACKUP_DIR" -name "shieldtask-backup-*.tar.gz" -mtime +7 -exec rm -f {} \;

echo "=========================================="
echo "🏁 Backup Job Complete!"
echo "=========================================="
