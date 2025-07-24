#!/bin/bash

# DigitalOcean Droplet Deployment Script for PostgreSQL Proxy Server
# This script deploys the Node.js proxy server to a DigitalOcean droplet

# Configuration
DROPLET_IP="YOUR_DROPLET_IP_HERE"  # Replace with your droplet's IP
DROPLET_USER="root"
APP_DIR="/opt/postgres-proxy"
SERVICE_NAME="postgres-proxy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if droplet IP is configured
if [ "$DROPLET_IP" = "YOUR_DROPLET_IP_HERE" ]; then
    print_error "Please configure DROPLET_IP in this script before running"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please copy .env.example to .env and configure it"
    exit 1
fi

print_step "Starting deployment to DigitalOcean droplet: $DROPLET_IP"

# Step 1: Update system and install Node.js
print_step "Installing Node.js 18 and PM2 on droplet..."
ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
    # Update system
    apt-get update -y
    apt-get upgrade -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Install UFW firewall
    apt-get install -y ufw
    
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "PM2 version: $(pm2 --version)"
EOF

if [ $? -eq 0 ]; then
    print_success "System setup completed"
else
    print_error "System setup failed"
    exit 1
fi

# Step 2: Create application directory
print_step "Creating application directory..."
ssh $DROPLET_USER@$DROPLET_IP "mkdir -p $APP_DIR"

# Step 3: Upload application files
print_step "Uploading application files..."
scp -r ../proxy-server/* $DROPLET_USER@$DROPLET_IP:$APP_DIR/

if [ $? -eq 0 ]; then
    print_success "Files uploaded successfully"
else
    print_error "File upload failed"
    exit 1
fi

# Step 4: Install dependencies and start service
print_step "Installing dependencies and starting service..."
ssh $DROPLET_USER@$DROPLET_IP << EOF
    cd $APP_DIR
    
    # Install dependencies
    npm install --production
    
    # Stop existing PM2 processes
    pm2 stop $SERVICE_NAME 2>/dev/null || true
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u root --hp /root
    
    # Configure firewall
    ufw --force enable
    ufw allow ssh
    ufw allow 3001/tcp
    
    echo "PM2 status:"
    pm2 status
EOF

if [ $? -eq 0 ]; then
    print_success "Service started successfully"
else
    print_error "Service startup failed"
    exit 1
fi

# Step 5: Test the deployment
print_step "Testing deployment..."
sleep 5

# Test health endpoint
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$DROPLET_IP:3001/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    print_success "Health check passed"
else
    print_warning "Health check failed (HTTP $HEALTH_CHECK)"
fi

# Step 6: Display deployment summary
echo ""
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETED${NC}"
echo "=========================================="
echo ""
echo "🚀 Proxy Server Details:"
echo "   URL: http://$DROPLET_IP:3001"
echo "   Health Check: http://$DROPLET_IP:3001/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: ssh $DROPLET_USER@$DROPLET_IP 'pm2 logs $SERVICE_NAME'"
echo "   Restart: ssh $DROPLET_USER@$DROPLET_IP 'pm2 restart $SERVICE_NAME'"
echo "   Stop: ssh $DROPLET_USER@$DROPLET_IP 'pm2 stop $SERVICE_NAME'"
echo ""
echo "🔒 Security:"
echo "   Static IP: $DROPLET_IP"
echo "   Add this IP to your Azure PostgreSQL firewall rules"
echo ""
echo "📝 Next Steps:"
echo "   1. Add $DROPLET_IP to Azure PostgreSQL firewall"
echo "   2. Update your frontend REACT_APP_PROXY_SERVER_URL"
echo "   3. Test database connections through the proxy"
echo ""

print_success "Deployment completed successfully!"