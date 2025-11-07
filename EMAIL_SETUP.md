# Email Configuration Guide

## 🚀 Quick Setup (5 minutes)

### Current Error: "Email service not configured" or "SMTP connection failed"

You need to set up Gmail credentials for sending emails.

## Setting Up Email for CloudSharing

### Prerequisites
You need a Gmail account to send emails from your application.

### Steps to Configure Email:

#### 1. Enable 2-Step Verification on Gmail
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification"
3. Follow the steps to enable it

#### 2. Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select "Other" as the device and name it "CloudSharing"
4. Click "Generate"
5. Copy the 16-character password (remove spaces)

#### 3. Add Environment Variables
Create a file named `.env.local` in your project root (it's already in .gitignore):

```bash
# Create the file
touch .env.local

# Or copy from the example
cp .env.local.example .env.local
```

Then edit `.env.local` and add:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=CloudSharing
```

**Important:**
- Replace `your-gmail@gmail.com` with your actual Gmail address
- Replace `your-16-char-app-password` with the App Password from step 2
- Do NOT use your regular Gmail password
- The App Password should be 16 characters without spaces
- Example: `EMAIL_PASSWORD=abcdabcdabcdabcd`

#### 4. Restart Your Development Server
```bash
npm run dev
```

### Testing Email

To test if email is working, you can:
1. Try sharing a file with someone via email
2. Check the server console for email logs like:
   - `[Email] Sending email to: user@example.com`
   - `[Email] Email sent successfully: <message-id>`

### Troubleshooting

**Error: "Email service not configured"**
- Check if `EMAIL_USER` and `EMAIL_PASSWORD` are in your `.env.local` file
- Make sure to restart your dev server after adding env variables

**Error: "Invalid login"**
- Make sure you're using an App Password, not your regular Gmail password
- Verify 2-Step Verification is enabled on your Google account
- Double-check the App Password (16 characters, no spaces)

**Error: "SMTP verification failed"**
- Check your internet connection
- Verify the Gmail account is active
- Try generating a new App Password

### Security Notes
- Never commit `.env.local` to Git (it's already in .gitignore)
- Never share your App Password
- If compromised, revoke the App Password and generate a new one
- For production, use environment variables in your hosting platform (Vercel, etc.)

### Production Deployment

For Vercel/Netlify:
1. Go to your project settings
2. Find "Environment Variables" section
3. Add:
   - `EMAIL_USER` = your-gmail@gmail.com
   - `EMAIL_PASSWORD` = your-app-password
   - `EMAIL_FROM_NAME` = CloudSharing
   - `NEXT_PUBLIC_BASE_URL` = https://your-domain.com
4. Redeploy your application
