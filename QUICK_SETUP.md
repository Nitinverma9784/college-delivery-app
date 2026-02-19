# ⚡ Quick Setup Guide - Supabase Database

## 🎯 What You Need to Do

**YES, you need to create tables in Supabase!** But don't worry - it's super easy. Just run one SQL file.

---

## 📝 3 Simple Steps

### Step 1: Open SQL Editor
```
Supabase Dashboard → Left Sidebar → SQL Editor → New Query
```

### Step 2: Copy & Paste SQL
```
1. Open: database/schema.sql
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor (Ctrl+V)
```

### Step 3: Run It!
```
Click "Run" button (or Ctrl+Enter)
Wait for ✅ "Success" message
```

---

## ✅ That's It!

The SQL will automatically create:
- ✅ `profiles` table
- ✅ `delivery_requests` table  
- ✅ Real-time enabled
- ✅ Security policies
- ✅ All indexes and functions

---

## 🔍 Verify It Worked

1. Go to **Table Editor** (left sidebar)
2. You should see 2 tables: `profiles` and `delivery_requests`
3. Click `delivery_requests` → Look for ⚡ icon (real-time enabled)

---

## 🐛 If Something Goes Wrong

**Error: "relation already exists"**
→ Tables already exist, that's fine! Continue.

**Can't see tables**
→ Refresh page, check you're in the right project

**Real-time not working**
→ Go to Database → Replication → Enable `delivery_requests`

---

## 📚 Full Guide

For detailed steps, see: `SUPABASE_DATABASE_SETUP.md`

---

## 🎉 After Setup

Your app will automatically:
- Save requests to database ✅
- Show them to dayscholars in real-time ✅
- Update status when accepted ✅

No more manual table creation needed!

