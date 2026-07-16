# Gmail SMTP Setup Guide for EDUsphere

Follow these steps to enable email invitations using your Gmail account.

## Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Scroll down to **How you sign in to Google**
4. Click **2-Step Verification**
5. Follow the prompts to enable 2FA

> If you already have 2FA enabled, skip to Step 2.

## Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. You should see a dropdown menu at the top
3. Select:
   - **Select app:** Mail
   - **Select device:** Windows Device (or your device type)
4. Click **Generate**
5. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
6. **Copy this password** (including the spaces)

> **Note:** This password is different from your regular Gmail password and is only for apps.

## Step 3: Update Your .env File

1. Open `backend/.env` in your code editor
2. Find this section:
```env
GMAIL_USER="dinakar.eon@gmail.com"
GMAIL_APP_PASSWORD="your_16_char_app_password_here"
```

3. Replace `your_16_char_app_password_here` with the 16-character password from Step 2
4. **Keep the spaces in the password** - they are part of the password

**Example:**
```env
GMAIL_USER="dinakar.eon@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
MAIL_FROM="dinakar.eon@gmail.com"
MAIL_REPLY_TO="dinakar.eon@gmail.com"
```

5. **Save the file**

## Step 4: Restart the Backend Server

1. Stop the backend server (press `Ctrl+C` in the terminal)
2. Run:
```bash
cd backend
npm run dev
```

3. You should see:
```
✅ Database connected successfully
🚀 Server running on http://localhost:5000
```

## Step 5: Test Email Sending

1. Go to your admin dashboard
2. Go to **Invitations** section
3. Send an invitation to any email address
4. Check if the email arrives (check spam folder if needed)

## Troubleshooting

### Error: "Less secure apps are not allowed"
- Gmail blocked the connection. Make sure you:
  1. Used an **App Password** (not your regular Gmail password)
  2. Enabled **2-Factor Authentication** first
  3. Selected the correct app (Mail) and device

### Error: "Invalid login credentials"
- Double-check the App Password is correct
- Make sure there are no extra spaces at the start or end
- Regenerate a new App Password and try again

### Email goes to spam
- Add `dinakar.eon@gmail.com` to the recipient's contacts
- Check Gmail's spam folder
- This is normal for bulk emails from new sending addresses

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to Git (it's in .gitignore)
- The App Password is only for this app
- You can revoke it anytime at https://myaccount.google.com/apppasswords
- If you change this password, update `.env` and restart the server

## Next Steps

Once emails are working:
1. Customize email templates in `backend/src/services/mail.service.ts`
2. Add more email types (password reset, notifications, etc.)
