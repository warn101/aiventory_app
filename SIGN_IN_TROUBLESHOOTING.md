# Sign-In Troubleshooting Guide

## Issue: "Can't sign in with correct input"

### Root Cause
Your Supabase project has **email confirmation enabled**, which means users must confirm their email address before they can sign in. This is a security feature that prevents unauthorized access.

### Current Configuration
- **Remote Supabase**: `https://vyugcxqpzuicbavkkmtc.supabase.co`
- **Email Confirmation**: ✅ Enabled
- **Sign Up**: ✅ Enabled

## Solutions

### Option 1: Complete the Email Confirmation Flow (Recommended)

1. **Sign Up First** (if you haven't already):
   - Open your app at http://localhost:5174/
   - Click "Sign Up" or switch to sign-up mode
   - Enter your email and password
   - Click "Create Account"

2. **Check Your Email**:
   - Look for a confirmation email from Supabase
   - Click the confirmation link in the email
   - This will verify your email address

3. **Now Sign In**:
   - Return to your app
   - Use the same email and password to sign in
   - It should work now!

### Option 2: Temporarily Disable Email Confirmation (For Testing)

If you want to test without email confirmation:

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project: `vyugcxqpzuicbavkkmtc`

2. **Navigate to Authentication Settings**:
   - Go to `Authentication` → `Settings`
   - Find "Enable email confirmations"
   - Toggle it **OFF**

3. **Test Sign Up and Sign In**:
   - Now you can sign up and immediately sign in
   - No email confirmation required

4. **Re-enable Later** (Important for production):
   - Remember to turn email confirmation back ON for production

### Option 3: Use Development Utilities

The project includes development utilities for testing:

```javascript
// In browser console, you can use:
import { devClearAllAuth } from './src/utils/devAuthUtils';

// Clear all auth data and start fresh
devClearAllAuth();
```

## Testing Your Fix

### Test Scenario 1: With Email Confirmation
1. Sign up with a real email address
2. Check your email and click the confirmation link
3. Return to the app and sign in
4. Should work successfully

### Test Scenario 2: Without Email Confirmation
1. Disable email confirmation in Supabase Dashboard
2. Sign up with any email
3. Immediately try to sign in
4. Should work without email confirmation

## Error Messages to Look For

- ✅ **"Welcome back!"** - Sign in successful
- ❌ **"Invalid credentials"** - Email not confirmed or wrong password
- ❌ **"Email not confirmed"** - Need to check email and confirm
- ❌ **"User not found"** - Need to sign up first

## Browser Console Debugging

Open browser developer tools (F12) and check the console for detailed logs:

```
🔑 Auth: Starting sign-in process for: your-email@example.com
✅ Auth: Stale sessions cleared
🚀 Auth: Attempting Supabase sign-in...
❌ Auth: Sign-in failed: Email not confirmed
```

## Quick Fix Commands

If you want to start completely fresh:

```bash
# Clear browser storage
# In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Production Considerations

- **Always keep email confirmation enabled in production**
- **Use real email addresses for testing**
- **Set up proper SMTP for production emails**
- **Test the complete user flow including email confirmation**

---

**Need Help?** Check the browser console for detailed error messages and follow the appropriate solution above.