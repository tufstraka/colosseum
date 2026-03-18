#!/bin/bash
# EC2 Instance Upgrade Script
# Upgrades t3.medium (4GB RAM) → t3.large (8GB RAM)

set -e

INSTANCE_ID="i-0c90656849367a0f4"
CURRENT_TYPE="t3.medium"
NEW_TYPE="t3.large"

echo "=== EC2 INSTANCE UPGRADE ==="
echo "Instance ID: $INSTANCE_ID"
echo "Current: $CURRENT_TYPE (4GB RAM)"
echo "Target: $NEW_TYPE (8GB RAM)"
echo ""

read -p "Proceed with upgrade? This will stop the instance briefly. (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "1. Stopping instance..."
aws ec2 stop-instances --instance-ids $INSTANCE_ID --output table
echo "   Waiting for instance to stop..."
aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID

echo ""
echo "2. Changing instance type to $NEW_TYPE..."
aws ec2 modify-instance-attribute --instance-id $INSTANCE_ID --instance-type "{\"Value\": \"$NEW_TYPE\"}"

echo ""
echo "3. Starting instance..."
aws ec2 start-instances --instance-ids $INSTANCE_ID --output table
echo "   Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

echo ""
echo "4. Fetching new IP (if changed)..."
NEW_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "   Public IP: $NEW_IP"

echo ""
echo "5. Waiting for SSH to be ready..."
for i in {1..30}; do
    if timeout 3 ssh -i ~/.openclaw/workspace/gen.pem -o ConnectTimeout=3 -o StrictHostKeyChecking=no ubuntu@$NEW_IP 'echo "SSH ready"' 2>/dev/null; then
        echo "   ✅ SSH is ready!"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 5
done

echo ""
echo "6. Verifying new instance specs..."
ssh -i ~/.openclaw/workspace/gen.pem ubuntu@$NEW_IP 'free -h && echo "" && lscpu | grep "Model name\|CPU(s)\|Thread"'

echo ""
echo "=== UPGRADE COMPLETE ==="
echo "New IP: $NEW_IP"
echo "RAM: 8GB (doubled)"
echo "Next steps:"
echo "  1. If IP changed, update DNS A record: colosseum.locsafe.org → $NEW_IP"
echo "  2. Setup swap: ssh ubuntu@$NEW_IP 'sudo bash /var/www/colosseum/colosseum/setup-swap.sh'"
echo "  3. Deploy: cd frontend && sudo -u deploy bash deploy-optimized.sh"
