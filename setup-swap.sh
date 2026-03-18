#!/bin/bash
# Add 2GB swap space for Next.js builds
# Run as root: sudo bash setup-swap.sh

set -e

echo "=== SWAP SPACE SETUP ==="

# Check if swap already exists
if swapon --show | grep -q '/swapfile'; then
    echo "✅ Swap already configured:"
    swapon --show
    free -h
    exit 0
fi

echo "1. Creating 2GB swap file..."
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048

echo "2. Setting permissions..."
chmod 600 /swapfile

echo "3. Making swap filesystem..."
mkswap /swapfile

echo "4. Enabling swap..."
swapon /swapfile

echo "5. Making swap permanent..."
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "6. Optimizing swappiness (60 = balanced)..."
sysctl vm.swappiness=60
echo 'vm.swappiness=60' >> /etc/sysctl.conf

echo ""
echo "✅ Swap configured:"
swapon --show
free -h

echo ""
echo "=== SETUP COMPLETE ==="
