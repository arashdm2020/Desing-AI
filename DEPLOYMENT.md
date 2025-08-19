# راهنمای کامل دیپلوی پروژه تحلیل نقشه‌های معماری

## 📋 فهرست مطالب
- [معرفی پروژه](#معرفی-پروژه)
- [پیش‌نیازها](#پیشنیازها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [پیکربندی محیط](#پیکربندی-محیط)
- [دیپلوی روی VPS](#دیپلوی-روی-vps)
- [تنظیمات Nginx](#تنظیمات-nginx)
- [تنظیمات SSL](#تنظیمات-ssl)
- [مدیریت پروسه](#مدیریت-پروسه)
- [مانیتورینگ و لاگ](#مانیتورینگ-و-لاگ)
- [بک‌آپ و امنیت](#بکآپ-و-امنیت)
- [عیب‌یابی](#عیبیابی)

---

## 🏗️ معرفی پروژه

این پروژه یک ابزار هوشمند تحلیل نقشه‌های معماری است که با استفاده از هوش مصنوعی (GPT-4o) نقشه‌های معماری را تحلیل می‌کند و گزارش‌های تخصصی ارائه می‌دهد.

### ویژگی‌های کلیدی:
- **تحلیل هوشمند**: استفاده از OpenAI GPT-4o برای تحلیل نقشه‌ها
- **UI مدرن**: رابط کاربری زیبا با Tailwind CSS و RTL
- **پشتیبانی از شهرهای ایران**: تحلیل اقلیمی بر اساس شهر انتخاب شده
- **سیستم نمره‌دهی**: ارزیابی چندبعدی با 4 معیار مختلف
- **پشتیبانی از فایل‌های تصویری**: آپلود و پردازش نقشه‌ها

### تکنولوژی‌های استفاده شده:
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4o API
- **Deployment**: Node.js, PM2, Nginx

---

## 🔧 پیش‌نیازها

### سیستم عامل
```bash
# Ubuntu 20.04+ یا CentOS 8+
# حداقل مشخصات:
- CPU: 2 Core
- RAM: 4GB
- Storage: 20GB
- Network: 100Mbps
```

### نرم‌افزارهای مورد نیاز
```bash
# Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt update
sudo apt install git

# Nginx
sudo apt install nginx

# PM2 (Process Manager)
sudo npm install -g pm2

# Certbot (برای SSL)
sudo apt install certbot python3-certbot-nginx
```

### بررسی نصب
```bash
# بررسی نسخه‌ها
node --version    # باید 18.x.x باشد
npm --version     # باید 9.x.x باشد
git --version
nginx -v
pm2 --version
```

---

## 📦 نصب و راه‌اندازی

### 1. کلون کردن پروژه
```bash
# ایجاد دایرکتوری پروژه
sudo mkdir -p /var/www/design-ai
sudo chown $USER:$USER /var/www/design-ai
cd /var/www/design-ai

# کلون کردن از GitHub
git clone https://github.com/arashdm2020/Desing-AI.git .
```

### 2. نصب وابستگی‌ها
```bash
# نصب dependencies
npm install

# نصب dependencies تولید
npm run build
```

### 3. تست محلی
```bash
# اجرای تست
npm run dev
# پروژه روی http://localhost:3000 در دسترس خواهد بود
```

---

## ⚙️ پیکربندی محیط

### 1. فایل Environment Variables
```bash
# ایجاد فایل .env.local
nano .env.local
```

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database (اگر نیاز باشد)
# DATABASE_URL=your_database_url

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### 2. تنظیمات Next.js
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['sharp']
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

### 3. تنظیمات PM2
```bash
# ایجاد فایل ecosystem.config.js
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'design-ai',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/design-ai',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
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
    ignore_watch: ['node_modules', 'logs']
  }]
}
```

---

## 🚀 دیپلوی روی VPS

### 1. آماده‌سازی سرور
```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب پیش‌نیازها
sudo apt install -y curl wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# نصب Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# نصب Git
sudo apt install git

# نصب Nginx
sudo apt install nginx

# نصب PM2
sudo npm install -g pm2
```

### 2. ایجاد کاربر سیستم
```bash
# ایجاد کاربر جدید
sudo adduser design-ai
sudo usermod -aG sudo design-ai

# تغییر به کاربر جدید
su - design-ai
```

### 3. کلون و نصب پروژه
```bash
# ایجاد دایرکتوری
sudo mkdir -p /var/www/design-ai
sudo chown design-ai:design-ai /var/www/design-ai
cd /var/www/design-ai

# کلون پروژه
git clone https://github.com/arashdm2020/Desing-AI.git .

# نصب dependencies
npm install

# Build پروژه
npm run build

# تست اجرا
npm start
```

### 4. تنظیم PM2
```bash
# ایجاد دایرکتوری لاگ
sudo mkdir -p /var/log/pm2
sudo chown design-ai:design-ai /var/log/pm2

# اجرا با PM2
pm2 start ecosystem.config.js --env production

# ذخیره تنظیمات PM2
pm2 save
pm2 startup

# بررسی وضعیت
pm2 status
pm2 logs design-ai
```

---

## 🌐 تنظیمات Nginx

### 1. ایجاد فایل کانفیگ
```bash
sudo nano /etc/nginx/sites-available/design-ai
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client max body size (برای آپلود فایل‌های بزرگ)
    client_max_body_size 50M;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2. فعال‌سازی سایت
```bash
# ایجاد symbolic link
sudo ln -s /etc/nginx/sites-available/design-ai /etc/nginx/sites-enabled/

# حذف default site
sudo rm /etc/nginx/sites-enabled/default

# تست کانفیگ
sudo nginx -t

# restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 تنظیمات SSL

### 1. نصب Certbot
```bash
# نصب Certbot
sudo apt install certbot python3-certbot-nginx

# دریافت SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# تست auto-renewal
sudo certbot renew --dry-run
```

### 2. تنظیمات امنیتی اضافی
```bash
# تنظیم UFW Firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# بررسی وضعیت
sudo ufw status
```

---

## 📊 مدیریت پروسه

### 1. دستورات PM2
```bash
# مشاهده وضعیت
pm2 status

# مشاهده لاگ‌ها
pm2 logs design-ai

# Restart پروژه
pm2 restart design-ai

# Stop پروژه
pm2 stop design-ai

# Start پروژه
pm2 start design-ai

# Reload (بدون downtime)
pm2 reload design-ai

# حذف از PM2
pm2 delete design-ai

# مشاهده اطلاعات سیستم
pm2 monit
```

### 2. مدیریت خودکار
```bash
# تنظیم auto-restart
pm2 startup
pm2 save

# بررسی cron job
sudo crontab -l
```

### 3. Update پروژه
```bash
# ایجاد script برای update
nano update.sh
```

```bash
#!/bin/bash
cd /var/www/design-ai

# Backup
cp -r .env.local .env.backup

# Pull تغییرات
git pull origin main

# نصب dependencies جدید
npm install

# Build جدید
npm run build

# Restart با PM2
pm2 restart design-ai

echo "Update completed successfully!"
```

```bash
# قابل اجرا کردن script
chmod +x update.sh
```

---

## 📈 مانیتورینگ و لاگ

### 1. تنظیمات لاگ
```bash
# ایجاد دایرکتوری لاگ
sudo mkdir -p /var/log/design-ai
sudo chown design-ai:design-ai /var/log/design-ai

# تنظیم logrotate
sudo nano /etc/logrotate.d/design-ai
```

```text
/var/log/design-ai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 design-ai design-ai
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. مانیتورینگ سیستم
```bash
# نصب htop
sudo apt install htop

# نصب netdata (اختیاری)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 3. Health Check
```bash
# ایجاد script health check
nano health-check.sh
```

```bash
#!/bin/bash
URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Application is healthy"
    exit 0
else
    echo "Application is not responding"
    pm2 restart design-ai
    exit 1
fi
```

```bash
# اضافه کردن به cron
crontab -e
# هر 5 دقیقه
*/5 * * * * /var/www/design-ai/health-check.sh
```

---

## 💾 بک‌آپ و امنیت

### 1. استراتژی بک‌آپ
```bash
# ایجاد script بک‌آپ
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/design-ai"
SOURCE_DIR="/var/www/design-ai"

# ایجاد دایرکتوری بک‌آپ
mkdir -p $BACKUP_DIR

# بک‌آپ فایل‌های پروژه
tar -czf $BACKUP_DIR/design-ai_$DATE.tar.gz -C $SOURCE_DIR .

# بک‌آپ فایل‌های کانفیگ
cp /etc/nginx/sites-available/design-ai $BACKUP_DIR/nginx_$DATE.conf
cp /var/www/design-ai/.env.local $BACKUP_DIR/env_$DATE.backup

# حذف بک‌آپ‌های قدیمی (بیش از 30 روز)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.conf" -mtime +30 -delete
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 2. امنیت
```bash
# تنظیمات امنیتی Nginx
sudo nano /etc/nginx/conf.d/security.conf
```

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Block bad bots
if ($http_user_agent ~* (bot|crawler|spider)) {
    return 403;
}
```

### 3. فایروال
```bash
# تنظیمات UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw enable
```

---

## 🔧 عیب‌یابی

### 1. مشکلات رایج

#### مشکل: پروژه اجرا نمی‌شود
```bash
# بررسی لاگ‌ها
pm2 logs design-ai
tail -f /var/log/nginx/error.log

# بررسی پورت
sudo netstat -tlnp | grep :3000

# بررسی process
ps aux | grep node
```

#### مشکل: Nginx Error 502
```bash
# بررسی وضعیت PM2
pm2 status

# بررسی کانفیگ Nginx
sudo nginx -t

# Restart سرویس‌ها
pm2 restart design-ai
sudo systemctl restart nginx
```

#### مشکل: فایل‌های استاتیک لود نمی‌شوند
```bash
# بررسی permissions
ls -la /var/www/design-ai/.next/

# تنظیم permissions
sudo chown -R design-ai:design-ai /var/www/design-ai
sudo chmod -R 755 /var/www/design-ai/.next/
```

### 2. دستورات مفید
```bash
# بررسی استفاده از منابع
htop
df -h
free -h

# بررسی لاگ‌های سیستم
sudo journalctl -u nginx
sudo journalctl -u pm2-design-ai

# بررسی اتصالات شبکه
sudo netstat -tlnp
sudo ss -tlnp

# بررسی فایل‌های باز
lsof -i :3000
```

### 3. Performance Tuning
```bash
# تنظیمات Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# تنظیمات Nginx
sudo nano /etc/nginx/nginx.conf
# افزایش worker_connections
# worker_connections 1024;
```

---

## 📞 پشتیبانی

### اطلاعات تماس
- **GitHub**: https://github.com/arashdm2020/Desing-AI
- **Documentation**: این فایل
- **Issues**: GitHub Issues

### چک‌لیست دیپلوی
- [ ] Node.js 18+ نصب شده
- [ ] Git نصب شده
- [ ] Nginx نصب و کانفیگ شده
- [ ] PM2 نصب شده
- [ ] پروژه کلون شده
- [ ] Dependencies نصب شده
- [ ] Build انجام شده
- [ ] Environment variables تنظیم شده
- [ ] PM2 process اجرا شده
- [ ] Nginx site فعال شده
- [ ] SSL certificate نصب شده
- [ ] Firewall تنظیم شده
- [ ] بک‌آپ تنظیم شده
- [ ] مانیتورینگ فعال شده

---

## 🎯 نتیجه‌گیری

با دنبال کردن این راهنما، پروژه تحلیل نقشه‌های معماری شما به صورت کامل و امن روی VPS دیپلوی خواهد شد. تمام جنبه‌های امنیتی، عملکرد و نگهداری در نظر گرفته شده‌اند.

**نکات مهم:**
1. همیشه از بک‌آپ استفاده کنید
2. به‌روزرسانی‌های امنیتی را نصب کنید
3. لاگ‌ها را مرتب بررسی کنید
4. عملکرد سیستم را مانیتور کنید
5. SSL certificate را تمدید کنید

**دسترسی به پروژه:**
- **URL**: https://your-domain.com
- **Admin Panel**: PM2 Dashboard
- **Logs**: `/var/log/pm2/` و `/var/log/nginx/` 