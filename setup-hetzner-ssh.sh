#!/bin/bash

echo "🔑 Setting up SSH access to Hetzner server..."

# Generate a new SSH key pair if needed
if [ ! -f ~/.ssh/id_rsa_hetzner ]; then
    echo "Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_hetzner -N "" -C "hetzner-access"
else
    echo "SSH key already exists at ~/.ssh/id_rsa_hetzner"
fi

# Display the public key
echo ""
echo "📋 Copy this public key to add to your Hetzner server:"
echo "========================================="
cat ~/.ssh/id_rsa_hetzner.pub
echo "========================================="
echo ""
echo "📝 Instructions:"
echo "1. Log into your Hetzner Cloud Console (https://console.hetzner.cloud/)"
echo "2. Go to your server → 'SSH Keys' or 'Access' section"
echo "3. Add the public key above"
echo ""
echo "OR if you're already logged into the server via PowerShell:"
echo ""
echo "Run this command on the server:"
echo "echo '$(cat ~/.ssh/id_rsa_hetzner.pub)' >> ~/.ssh/authorized_keys"
echo ""
echo "Then you can SSH from here using:"
echo "ssh -i ~/.ssh/id_rsa_hetzner root@138.199.214.115"