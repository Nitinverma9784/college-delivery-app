# Step-by-Step Supabase Setup Instructions

Follow these exact steps to get your Supabase keys and configure your project.

## Part 1: Get Supabase Keys

### Step 1: Create/Login to Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign In"** if you already have an account
3. Sign up with GitHub, Google, or Email

### Step 2: Create a New Project
1. Once logged in, click **"New Project"** button (usually in the top right or on the dashboard)
2. Fill in the project details:
   - **Name**: Give your project a name (e.g., "college-delivery-app")
   - **Database Password**: Create a strong password (save this somewhere safe!)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Select "Free" for development
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be set up

### Step 3: Get Your API Keys
1. In your Supabase dashboard, look at the left sidebar
2. Click on **"Settings"** (gear icon at the bottom)
3. Click on **"API"** in the settings menu
4. You'll see a page with your API credentials

### Step 4: Copy the Required Values
You need to copy **TWO** values:

**Value 1: Project URL**
- Look for the section labeled **"Project URL"**
- You'll see a URL like: `https://xxxxxxxxxxxxx.supabase.co`
- Click the **copy icon** next to it to copy the full URL

**Value 2: Anon/Public Key**
- Scroll down to the section labeled **"Project API keys"**
- Find the key labeled **"anon"** or **"public"** (this is the one that starts with `eyJ...`)
- Click the **eye icon** to reveal it (if hidden)
- Click the **copy icon** next to it to copy the key
- ⚠️ **Important**: Use the **anon/public** key, NOT the **service_role** key!

---

## Part 2: Set Up Environment File

### Step 1: Create .env.local File
1. In your project root folder (`D:\college-delivery-app`), create a new file named `.env.local`
2. **Important**: The file must be named exactly `.env.local` (with the dot at the beginning)

### Step 2: Add Your Keys
1. Open `.env.local` in any text editor
2. Copy and paste this template:

```env
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

3. Replace `paste_your_project_url_here` with the Project URL you copied
4. Replace `paste_your_anon_key_here` with the anon/public key you copied

**Example of what it should look like:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 3: Save the File
1. Save the `.env.local` file
2. Make sure there are **no spaces** around the `=` sign
3. Make sure there are **no quotes** around the values (unless your URL/key contains special characters)

---

## Part 3: Verify Setup

### Step 1: Restart Development Server
1. If your development server is running, **stop it** (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. The environment variables are loaded when the server starts, so you must restart after creating/editing `.env.local`

### Step 2: Test Authentication
1. Open your browser and go to `http://localhost:3000/signup`
2. Try creating an account - if it works, your keys are correct!
3. If you see errors, double-check:
   - The keys are correct (no extra spaces or characters)
   - The file is named `.env.local` (not `.env.local.txt`)
   - You restarted the development server

---

## Quick Reference: Where to Find Keys in Supabase

```
Supabase Dashboard
└── Settings (gear icon, bottom left)
    └── API
        ├── Project URL ← Copy this
        └── Project API keys
            └── anon public ← Copy this one (NOT service_role!)
```

---

## Common Issues & Solutions

### Issue: "Invalid API key" error
**Solution**: 
- Check that you copied the **anon/public** key, not the service_role key
- Make sure there are no extra spaces in your `.env.local` file
- Restart your development server

### Issue: File not found or keys not loading
**Solution**:
- Make sure the file is named exactly `.env.local` (check for hidden file extensions)
- Make sure the file is in the root directory (`D:\college-delivery-app`)
- Restart your development server

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not defined"
**Solution**:
- Make sure variable names start with `NEXT_PUBLIC_` (required for Next.js)
- Check for typos in variable names
- Restart your development server

---

## Security Note

⚠️ **Important**: 
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never share your `service_role` key publicly
- The `anon/public` key is safe to use in client-side code (that's why it's called "public")
- Keep your database password secure

---

## Need Help?

If you're stuck:
1. Check the Supabase dashboard - make sure your project is active
2. Verify your keys are correct by comparing them in Supabase dashboard
3. Check the browser console for specific error messages
4. Make sure your Supabase project is not paused (free tier projects pause after inactivity)

