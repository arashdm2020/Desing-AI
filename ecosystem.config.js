module.exports = {
  apps: [{
    name: 'design-ai',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/design-ai',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/design-ai-error.log',
    out_file: '/var/log/pm2/design-ai-out.log',
    log_file: '/var/log/pm2/design-ai-combined.log',
    time: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next', 'uploads'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    cron_restart: '0 2 * * *', // Restart daily at 2 AM
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    shutdown_with_message: true
  }]
}; 