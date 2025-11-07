#!/bin/bash

# CloudSharing Email Setup Helper

echo "🚀 CloudSharing Email Configuration Setup"
echo "=========================================="
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📧 Please provide your Gmail credentials:"
echo ""

# Get Gmail address
read -p "Gmail address: " email_user

# Get App Password
echo ""
echo "⚠️  IMPORTANT: Use Gmail App Password, NOT your regular password!"
echo "To get an App Password:"
echo "1. Go to https://myaccount.google.com/security"
echo "2. Enable 2-Step Verification (if not already enabled)"
echo "3. Go to https://myaccount.google.com/apppasswords"
echo "4. Generate an App Password for 'Mail'"
echo "5. Copy the 16-character password (without spaces)"
echo ""
read -sp "Gmail App Password (16 characters): " email_password
echo ""

# Get From Name (optional)
read -p "From Name (default: CloudSharing): " email_from_name
email_from_name=${email_from_name:-CloudSharing}

# Create .env.local file
cat > .env.local << EOF
# Email Configuration for CloudSharing
# Generated on $(date)

# Gmail Configuration
EMAIL_USER=$email_user
EMAIL_PASSWORD=$email_password
EMAIL_FROM_NAME=$email_from_name

# Application URL (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF

echo ""
echo "✅ Configuration saved to .env.local"
echo ""
echo "📋 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test email sending by sharing a file"
echo "3. Check server console for [Email] logs"
echo ""
echo "🔒 Security Note:"
echo "   .env.local is in .gitignore and won't be committed to git"
echo ""
