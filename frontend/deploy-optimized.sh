#!/bin/bash
set -e

echo "=== OPTIMIZED DEPLOYMENT SCRIPT ==="
echo "Timestamp: $(date)"
echo ""

# 1. Check memory before build
echo "1. System resources:"
free -h
df -h /

# 2. Stop PM2 app to free memory during build
echo ""
echo "2. Stopping app to free memory for build..."
pm2 stop colosseum || true
sleep 2

# 3. Clear Next.js cache and node_modules to reduce memory footprint
echo ""
echo "3. Cleaning build artifacts..."
rm -rf .next node_modules/.cache

# 4. Install with minimal memory usage
echo ""
echo "4. Installing dependencies (minimal mode)..."
NODE_OPTIONS="--max-old-space-size=512" npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund --loglevel=error 2>&1 | tail -5

# 5. Build with memory limit and optimization
echo ""
echo "5. Building (memory-limited, production mode)..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=768" npm run build 2>&1 | tail -20

# 6. Restart PM2
echo ""
echo "6. Restarting application..."
pm2 restart colosseum
pm2 save

# 7. Verify
sleep 3
echo ""
echo "7. Status check:"
pm2 list
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/ || echo "App not responding yet"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
