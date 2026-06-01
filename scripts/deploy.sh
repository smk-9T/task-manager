#!/bin/bash

# ==============================================================================
# SECURE TASK MANAGER - UBUNTU SERVER AUTOMATION & SSH HARDENING
# Capstone DevSecOps Project - Server Setup and Nginx reverse proxy configurations
# ==============================================================================

# Script variables
APP_DIR="/var/www/shieldtask"
NGINX_CONF="/etc/nginx/sites-available/shieldtask"
SYSTEMD_CONF="/etc/systemd/system/shieldtask.service"

echo "=========================================="
echo "🛡️ INITIALIZING UBUNTU SERVER DEVSECOPS SETUP"
echo "=========================================="

# 1. Update and install packages
echo "🔄 Updating repositories and installing packages..."
sudo apt-get update -y
sudo apt-get install -y nginx ufw fail2ban nodejs npm git logrotate

# 2. Hardening SSH Configuration
echo "🔒 Hardening SSH daemon configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSHD_CONFIG" ]; then
    # Disable root logins and password auth
    sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' $SSHD_CONFIG
    sudo sed -i 's/PermitRootLogin.*/PermitRootLogin no/' $SSHD_CONFIG
    sudo sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' $SSHD_CONFIG
    sudo sed -i 's/PasswordAuthentication.*/PasswordAuthentication no/' $SSHD_CONFIG
    sudo sed -i 's/#PubkeyAuthentication.*/PubkeyAuthentication yes/' $SSHD_CONFIG
    
    # Reload service to apply rules
    sudo systemctl restart sshd
    echo "✅ SSH Hardening complete. Root login & password logins are DISABLED."
else
    echo "⚠️ Warning: sshd_config not found. Skipping hardening."
fi

# 3. Configure Firewall Rules (Least Privilege)
echo "🧱 Configuring UFW Firewalls..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # Secure Hardened SSH
sudo ufw allow 80/tcp      # HTTP (Redirect to HTTPS)
sudo ufw allow 443/tcp     # HTTPS (SSL)
sudo ufw --force enable
echo "✅ Firewall active. Ports 22, 80, and 443 are whitelisted."

# 4. Fail2Ban configuration to block Brute-Force SSH attacks
echo "🚫 Configuring Fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
echo "✅ Fail2ban configured and active."

# 5. Configure Nginx Reverse Proxy
echo "🌐 Writing Nginx Reverse Proxy rules..."
sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    listen 80;
    server_name shieldtask.yourdomain.com; # Replace with Route53 custom domain

    # SSL configuration stub (uncomment once certbot is run)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/shieldtask.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/shieldtask.yourdomain.com/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # HSTS Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static frontend web files
    location / {
        root $APP_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to Node/Express running locally on port 5000
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Secure uploads directory serving
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        add_header Content-Security-Policy "default-src 'none'; sandbox;";
    }
}
EOF

sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
echo "✅ Nginx reverse proxy loaded."

# 6. Configure systemd Service for Node/Express Backend
echo "⚙️ Creating systemd service file..."
sudo bash -c "cat > $SYSTEMD_CONF" <<EOF
[Unit]
Description=ShieldTask Node.js Express API Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production PORT=5000 JWT_SECRET=devsecops_super_secret_jwt_key_2026

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
# sudo systemctl enable shieldtask && sudo systemctl start shieldtask
echo "✅ Systemd automation service successfully configured."

# 7. Configure Log Rotation
echo "📋 Creating Log Rotation rules..."
sudo bash -c "cat > /etc/logrotate.d/shieldtask" <<EOF
$APP_DIR/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0660 ubuntu ubuntu
    sharedscripts
}
EOF
echo "✅ Logrotate configurations installed."

echo "=========================================="
echo "🏁 DEVSECOPS UBUNTU AUTOMATION DEPLOYMENT SCRIPT SUCCESS"
echo "=========================================="
