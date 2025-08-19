#!/bin/bash

# Design AI Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="design-ai"
PROJECT_DIR="/var/www/design-ai"
BACKUP_DIR="/var/backups/design-ai"
LOG_DIR="/var/log/pm2"
ENVIRONMENT=${1:-production}

echo -e "${BLUE}🚀 Starting Design AI Deployment...${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

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

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory $PROJECT_DIR does not exist"
fi

# Create backup directories
log "Creating backup directories..."
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "$LOG_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"
sudo chown $USER:$USER "$LOG_DIR"

# Backup current version
log "Creating backup of current version..."
if [ -d "$PROJECT_DIR" ]; then
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" .
    log "Backup created: $BACKUP_FILE"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Stop PM2 process if running
log "Stopping PM2 process..."
pm2 stop $PROJECT_NAME 2>/dev/null || true

# Pull latest changes
log "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main

# Install dependencies
log "Installing dependencies..."
npm ci --production

# Build project
log "Building project..."
npm run build

# Copy environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    log "Creating environment file..."
    cp env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit .env.local with your configuration${NC}"
fi

# Start PM2 process
log "Starting PM2 process..."
pm2 start ecosystem.config.js --env $ENVIRONMENT

# Save PM2 configuration
log "Saving PM2 configuration..."
pm2 save

# Check if process is running
sleep 5
if pm2 list | grep -q "$PROJECT_NAME.*online"; then
    log "✅ Application is running successfully"
else
    error "❌ Application failed to start"
fi

# Show status
log "PM2 Status:"
pm2 status

# Show logs
log "Recent logs:"
pm2 logs $PROJECT_NAME --lines 10

# Cleanup old backups (keep last 10)
log "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t *.tar.gz | tail -n +11 | xargs -r rm

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Monitor your application with: pm2 monit${NC}"
echo -e "${BLUE}📝 View logs with: pm2 logs $PROJECT_NAME${NC}"
echo -e "${BLUE}🔄 Restart with: pm2 restart $PROJECT_NAME${NC}" 