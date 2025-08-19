#!/bin/bash

# Backup Script for Design AI
# This script creates backups of the application and data

# Configuration
PROJECT_NAME="design-ai"
PROJECT_DIR="/var/www/design-ai"
BACKUP_DIR="/var/backups/design-ai"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Create backup directory
log "Creating backup directory..."
sudo mkdir -p "$BACKUP_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR" || error "Project directory not found"

# Create backup filename
BACKUP_FILE="$BACKUP_DIR/${PROJECT_NAME}_backup_${DATE}.tar.gz"

log "Starting backup process..."

# Stop PM2 process temporarily to ensure data consistency
log "Stopping PM2 process for backup..."
pm2 stop "$PROJECT_NAME" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 3

# Create backup
log "Creating backup archive..."
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='uploads/*' \
    .

# Restart PM2 process
log "Restarting PM2 process..."
pm2 start ecosystem.config.js --env production

# Check backup file
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    error "❌ Backup creation failed"
fi

# Create database backup (if applicable)
if [ -f ".env.local" ]; then
    log "Creating environment backup..."
    cp .env.local "$BACKUP_DIR/env_backup_${DATE}.backup"
fi

# Create PM2 configuration backup
log "Creating PM2 configuration backup..."
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2_backup_${DATE}.json"

# Create Nginx configuration backup
if [ -f "/etc/nginx/sites-available/design-ai" ]; then
    log "Creating Nginx configuration backup..."
    sudo cp /etc/nginx/sites-available/design-ai "$BACKUP_DIR/nginx_backup_${DATE}.conf"
fi

# Cleanup old backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.backup" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.json" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.conf" -mtime +$RETENTION_DAYS -delete

# Show backup summary
log "Backup Summary:"
echo -e "${BLUE}📁 Backup Directory: $BACKUP_DIR${NC}"
echo -e "${BLUE}📦 Main Backup: $BACKUP_FILE${NC}"
echo -e "${BLUE}📊 Backup Size: $BACKUP_SIZE${NC}"
echo -e "${BLUE}🗓️  Retention: $RETENTION_DAYS days${NC}"

# List recent backups
log "Recent backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz | tail -5

# Create backup verification
log "Verifying backup integrity..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log "✅ Backup verification successful"
else
    error "❌ Backup verification failed"
fi

log "🎉 Backup process completed successfully!"

# Optional: Upload to remote storage (uncomment if needed)
# log "Uploading backup to remote storage..."
# rsync -avz "$BACKUP_FILE" user@remote-server:/backups/

echo -e "${YELLOW}💡 Tip: Consider setting up automated backups with cron${NC}"
echo -e "${YELLOW}   Example: 0 2 * * * /var/www/design-ai/backup.sh${NC}" 