#!/bin/bash

# Health Check Script for Design AI
# This script checks if the application is running properly

# Configuration
APP_URL="http://localhost:3000/health"
APP_NAME="design-ai"
LOG_FILE="/var/log/design-ai/health-check.log"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create log directory
sudo mkdir -p /var/log/design-ai
sudo chown $USER:$USER /var/log/design-ai

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if PM2 process is running
check_pm2_process() {
    if pm2 list | grep -q "$APP_NAME.*online"; then
        return 0
    else
        return 1
    fi
}

# Function to check HTTP response
check_http_response() {
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" --max-time 10)
    echo "$response_code"
}

# Function to restart application
restart_application() {
    log "Restarting application..."
    pm2 restart "$APP_NAME"
    sleep 10
}

# Main health check
log "Starting health check for $APP_NAME..."

# Check 1: PM2 Process Status
if check_pm2_process; then
    log "✅ PM2 process is running"
else
    log "❌ PM2 process is not running"
    log "Attempting to restart PM2 process..."
    pm2 start ecosystem.config.js --env production
    sleep 5
    if check_pm2_process; then
        log "✅ PM2 process restarted successfully"
    else
        log "❌ Failed to restart PM2 process"
        exit 1
    fi
fi

# Check 2: HTTP Response
for i in $(seq 1 $MAX_RETRIES); do
    response_code=$(check_http_response)
    
    if [ "$response_code" = "200" ]; then
        log "✅ HTTP response: $response_code - Application is healthy"
        break
    else
        log "⚠️  HTTP response: $response_code - Attempt $i of $MAX_RETRIES"
        
        if [ $i -lt $MAX_RETRIES ]; then
            log "Waiting $RETRY_DELAY seconds before retry..."
            sleep $RETRY_DELAY
        else
            log "❌ Application is not responding after $MAX_RETRIES attempts"
            log "Restarting application..."
            restart_application
            
            # Final check after restart
            sleep 10
            final_response=$(check_http_response)
            if [ "$final_response" = "200" ]; then
                log "✅ Application restarted and is now healthy"
            else
                log "❌ Application failed to recover"
                exit 1
            fi
        fi
    fi
done

# Check 3: Memory Usage
memory_usage=$(pm2 jlist | jq -r ".[] | select(.name == \"$APP_NAME\") | .monit.memory")
if [ "$memory_usage" != "null" ] && [ "$memory_usage" -gt 1000000000 ]; then
    log "⚠️  High memory usage: ${memory_usage} bytes"
else
    log "✅ Memory usage is normal: ${memory_usage} bytes"
fi

# Check 4: CPU Usage
cpu_usage=$(pm2 jlist | jq -r ".[] | select(.name == \"$APP_NAME\") | .monit.cpu")
if [ "$cpu_usage" != "null" ] && [ "$cpu_usage" -gt 80 ]; then
    log "⚠️  High CPU usage: ${cpu_usage}%"
else
    log "✅ CPU usage is normal: ${cpu_usage}%"
fi

log "Health check completed successfully" 