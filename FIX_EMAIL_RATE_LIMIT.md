# Fix: Email Rate Limit Exceeded Error

## 🐛 Problem
You're seeing: **"Email rate limit exceeded"** when trying to sign up.

This happens because Supabase has rate limits on sending emails (especially on free tier).

---

## ✅ Solution 1: Disable Email Confirmation (Recommended for Development)

This is the **easiest** solution for development/testing.

### Steps:

1. **Go to Supabase Dashboard**
   - https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Left sidebar → **"Authentication"**
   - Click **"Providers"** tab
   - Or go to: **Settings** → **Authentication**

3. **Disable Email Confirmation**
   - Find **"Email"** provider
   - Look for **"Enable email confirmations"** toggle
   - **Turn it OFF** (disable it)
   - **Save** changes

4. **Test Signup Again**
   - Try signing up now
   - Users will be logged in immediately without email confirmation
   - No emails sent = no rate limit issues!

---

## ✅ Solution 2: Increase Rate Limit (If You Need Email Confirmation)

If you need email confirmation for production:

### Option A: Upgrade Plan
- Free tier: ~3 emails/hour
- Pro tier: Higher limits
- Go to: **Settings** → **Billing** → Upgrade

### Option B: Use Custom SMTP
1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your own email provider (Gmail, SendGrid, etc.)
3. This bypasses Supabase rate limits

---

## ✅ Solution 3: Wait and Retry

If you just need to test right now:
- Wait **1 hour** for rate limit to reset
- Then try signup again
- Free tier resets hourly

---

## 🎯 Recommended: Solution 1 (Disable Email Confirmation)

**For development/testing**, disable email confirmation:
- ✅ No rate limit issues
- ✅ Instant signup/login
- ✅ Faster testing
- ✅ No email setup needed

**For production**, you can:
- Re-enable email confirmation later
- Or use custom SMTP
- Or upgrade plan

---

## 📝 Quick Steps Summary

1. Supabase Dashboard → Authentication → Providers
2. Find "Email" provider
3. Turn OFF "Enable email confirmations"
4. Save
5. Try signup again ✅

---

## 🔍 Verify It's Fixed

After disabling email confirmation:
1. Try signing up with a new email
2. Should work immediately
3. User logged in right away
4. No email sent = no rate limit!

---

## 💡 Additional Tips

### For Development:
- Keep email confirmation **OFF**
- Faster testing
- No rate limit issues

### For Production:
- Enable email confirmation
- Use custom SMTP (recommended)
- Or upgrade Supabase plan

---

## 🐛 Still Having Issues?

If error persists:
1. Check Supabase dashboard for any other errors
2. Clear browser cache and try again
3. Check `.env.local` has correct Supabase credentials
4. Restart your development server

---

## 📚 Related Settings

**Other Auth Settings to Check:**
- **Settings** → **Auth** → **Email Templates** (customize emails)
- **Settings** → **Auth** → **SMTP Settings** (use custom email)
- **Settings** → **Auth** → **Rate Limits** (view current limits)

---

Need more help? Check Supabase docs: https://supabase.com/docs/guides/auth

