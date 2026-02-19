# Step-by-Step: Setting Up Database in Supabase

## 🎯 Goal
Create the database tables and enable real-time so hostellers can create requests that appear instantly for dayscholars.

---

## 📋 Step 1: Open Supabase SQL Editor

1. Go to **https://app.supabase.com**
2. **Sign in** to your account
3. **Select your project** (or create one if you haven't)
4. In the **left sidebar**, click on **"SQL Editor"** (it has a `</>` icon)
5. Click the **"New Query"** button (top right)

---

## 📋 Step 2: Copy the SQL Schema

1. Open the file `database/schema.sql` in your project folder
2. **Select ALL** the content (Ctrl+A or Cmd+A)
3. **Copy** it (Ctrl+C or Cmd+C)
   - The file contains all the SQL commands needed to create tables, policies, and functions

---

## 📋 Step 3: Paste and Run in Supabase

1. **Paste** the copied SQL into the Supabase SQL Editor (Ctrl+V or Cmd+V)
2. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
3. **Wait** for execution to complete (should take a few seconds)
4. You should see: ✅ **"Success. No rows returned"** or similar success message

> ⚠️ **If you see errors**: 
> - Make sure you copied the ENTIRE file
> - Check that you're running it in the correct project
> - Some errors might be okay if tables already exist

---

## 📋 Step 4: Verify Tables Were Created

1. In the **left sidebar**, click on **"Table Editor"** (database icon)
2. You should see **two tables**:
   - ✅ `profiles` - Stores user profile information
   - ✅ `delivery_requests` - Stores delivery requests

3. **Click on `delivery_requests`** table to view it
4. It should be empty (no rows yet) - that's normal!

---

## 📋 Step 5: Enable Real-time (IMPORTANT!)

Real-time allows requests to appear instantly for dayscholars.

### Option A: Via SQL (Already in schema.sql)
The SQL schema already includes this command, but let's verify:

1. Go back to **SQL Editor**
2. Run this command to check/enable real-time:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
```

### Option B: Via Dashboard (Alternative method)
1. In the **left sidebar**, click on **"Database"**
2. Click on **"Replication"** (or "Realtime" in some versions)
3. Find `delivery_requests` in the list
4. **Toggle the switch** to enable replication (should show ⚡ icon)
5. If you see a warning, click **"Enable"** to confirm

---

## 📋 Step 6: Verify Real-time is Enabled

1. Go to **"Table Editor"**
2. Click on `delivery_requests` table
3. Look for a **⚡ lightning bolt icon** or **"Realtime"** badge next to the table name
4. If you see it, real-time is enabled! ✅

---

## 📋 Step 7: Test the Setup (Optional but Recommended)

### Test 1: Check Tables Structure
1. Go to **"Table Editor"** → `delivery_requests`
2. Click **"Insert row"** (or the + button)
3. You should see fields like:
   - `item_name`
   - `quantity`
   - `estimated_price`
   - `urgency`
   - `status`
   - `created_by`
   - etc.
4. **Don't save** - just close the dialog
5. If you see all these fields, the table structure is correct! ✅

### Test 2: Check Profiles Table
1. Go to **"Table Editor"** → `profiles`
2. Click **"Insert row"**
3. You should see fields like:
   - `id`
   - `name`
   - `email`
   - `role`
   - `trust_score`
   - etc.
4. **Don't save** - just close
5. If you see all these fields, profiles table is correct! ✅

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] SQL schema ran without errors
- [ ] `profiles` table exists in Table Editor
- [ ] `delivery_requests` table exists in Table Editor
- [ ] Real-time is enabled (⚡ icon visible)
- [ ] Tables have the correct columns (tested above)

---

## 🐛 Troubleshooting

### Problem: "relation already exists" error
**Solution**: This means tables already exist. That's okay! The `IF NOT EXISTS` in the SQL should prevent this, but if you see it, you can:
- Ignore it and continue
- Or drop tables first (only if you want to start fresh):
  ```sql
  DROP TABLE IF EXISTS public.delivery_requests CASCADE;
  DROP TABLE IF EXISTS public.profiles CASCADE;
  ```
  Then run the schema again.

### Problem: Can't see tables in Table Editor
**Solution**:
- Refresh the page
- Make sure you're looking at the `public` schema (not `auth`)
- Check that SQL ran successfully

### Problem: Real-time not working
**Solution**:
1. Go to **Database** → **Replication**
2. Find `delivery_requests`
3. Toggle it OFF and then ON again
4. Wait a few seconds
5. Check Table Editor for the ⚡ icon

### Problem: "permission denied" error
**Solution**:
- Make sure you're logged in as the project owner
- Check that you're in the correct Supabase project
- Try running the SQL again

### Problem: Tables exist but app doesn't work
**Solution**:
- Check your `.env.local` file has correct Supabase credentials
- Restart your development server (`npm run dev`)
- Check browser console for errors

---

## 📝 What the SQL Schema Creates

When you run `schema.sql`, it creates:

1. **`profiles` table** - User profiles with role, trust score, etc.
2. **`delivery_requests` table** - All delivery requests
3. **Indexes** - For fast queries
4. **Row Level Security (RLS) policies** - Security rules
5. **Triggers** - Auto-update timestamps
6. **Functions** - Helper functions for calculations
7. **Real-time replication** - For instant updates

---

## 🎉 You're Done!

Once you've completed these steps:
1. Your database is set up ✅
2. Tables are created ✅
3. Real-time is enabled ✅
4. Your app can now save and fetch requests ✅

**Next**: Test your app by:
1. Signing up as a Hosteller
2. Creating a request
3. Checking Supabase Table Editor - you should see the request!
4. Signing up as a Day Scholar
5. The request should appear in real-time!

---

## 📚 Quick Reference

**Where to find things in Supabase:**
- **SQL Editor**: Left sidebar → SQL Editor (`</>` icon)
- **Table Editor**: Left sidebar → Table Editor (database icon)
- **Replication/Real-time**: Left sidebar → Database → Replication
- **API Settings**: Left sidebar → Settings (gear) → API

**Important Files:**
- `database/schema.sql` - The SQL to run
- `.env.local` - Your Supabase credentials (already set up)

---

## 💡 Pro Tips

1. **Keep SQL Editor open** - Useful for debugging and checking data
2. **Use Table Editor** - Great for manually checking if data is being saved
3. **Check Replication tab** - If real-time stops working, check here first
4. **Monitor Console** - Browser console shows real-time connection status

---

Need help? Check the browser console for specific error messages!

