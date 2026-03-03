# Email Service Setup Guide

The Alumni Management Platform includes password reset and email verification features. Follow these steps to configure the email service.

## Prerequisites

- Gmail account (recommended) or other SMTP provider
- Node.js and npm installed

## Installation

1. **Install nodemailer package:**
   ```bash
   cd backend
   npm install nodemailer
   ```

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password
1. Visit: https://myaccount.google.com/apppasswords
2. Select **App**: "Mail"
3. Select **Device**: "Other (Custom name)" → enter "Alumni Platform"
4. Click **Generate**
5. Copy the 16-character password (no spaces)

### Step 3: Configure Environment Variables
Edit `backend/.env` and add:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

**Important:**
- Use your Gmail address for `EMAIL_USER`
- Use the 16-character App Password (not your regular password) for `EMAIL_PASSWORD`
- Do NOT commit the `.env` file to Git

## Testing

### Test Email Verification
1. Register a new account
2. Check the email inbox for verification link
3. Click the verification link
4. Account should be verified

### Test Password Reset
1. Click "Forgot password?" on login page
2. Enter your email
3. Check inbox for password reset link
4. Click link and enter new password
5. Login with new password

## Features

### Email Verification
- **Token Expiry:** 24 hours
- **Endpoint:** `POST /api/auth/verify-email`
- **Resend:** `POST /api/auth/resend-verification` (requires authentication)

### Password Reset
- **Token Expiry:** 1 hour
- **Request Reset:** `POST /api/auth/forgot-password`
- **Reset Password:** `POST /api/auth/reset-password`

## Troubleshooting

### "Invalid login" error
- Ensure 2FA is enabled on your Google account
- Use an App Password, not your regular password
- Check for typos in EMAIL_USER and EMAIL_PASSWORD

### "Connection refused" error
- Check your internet connection
- Verify firewall isn't blocking SMTP (port 587)
- Try using port 465 (SSL) instead in `emailService.js`

### Email not received
- Check spam/junk folder
- Verify EMAIL_USER is correct
- Check Gmail "Sent" folder to confirm email was sent
- Review backend console for error logs

### Token expired error
- Verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Request a new token if expired

## Using Other Email Providers

### Outlook/Hotmail
```js
host: 'smtp.office365.com',
port: 587,
```

### Yahoo Mail
```js
host: 'smtp.mail.yahoo.com',
port: 465 or 587,
```

### Custom SMTP
Edit `backend/utils/emailService.js` and update the transporter configuration with your provider's settings.

## Security Notes

- Never commit `.env` file to version control
- App Passwords are more secure than regular passwords
- Tokens are securely hashed in the database
- Email verification is non-blocking (registration succeeds even if email fails)
- Password reset tokens expire quickly for security

## Support

If you encounter issues:
1. Check backend console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure nodemailer is installed: `npm list nodemailer`
4. Test SMTP connection manually if needed
