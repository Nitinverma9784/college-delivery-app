# Supabase Authentication Setup Guide

This project uses Supabase for authentication. Follow these steps to set up Supabase authentication:

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details (name, database password, region)
4. Wait for the project to be created

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 3. Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the values you copied from Supabase.

### 4. Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (it should be enabled by default)
3. Configure email settings as needed:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Secure email change**: Optional

### 5. User Metadata

The application stores user role (`hosteller` or `dayscholar`) in the user metadata. This is automatically handled when users sign up.

## Features Implemented

- ✅ User signup with role selection (Hosteller/Day Scholar)
- ✅ User login
- ✅ Role stored in user metadata
- ✅ Automatic routing based on user role
- ✅ Session management with middleware
- ✅ Protected routes
- ✅ Logout functionality

## User Roles

- **Hosteller**: Users who live on campus and need items delivered to their hostel
- **Day Scholar**: Users who commute daily and can pick up & deliver items

## Authentication Flow

1. **Signup**: User signs up with email, password, name, and selects their role (hosteller/dayscholar)
2. **Login**: User logs in with email and password
3. **Role-based Routing**: After login, users are automatically redirected to their respective pages:
   - Hostellers → `/hosteller/home`
   - Day Scholars → `/dayscholar/home`
4. **Session Management**: Middleware protects routes and maintains session state

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/signup` to create a new account
3. Select your role during signup
4. After signup, you'll be redirected to your role-specific home page
5. Logout and login again to test the login flow

## Troubleshooting

### "Invalid API key" error
- Make sure your `.env.local` file has the correct Supabase credentials
- Restart your development server after adding/changing environment variables

### Users not being redirected correctly
- Check that the user metadata contains the `role` field
- Verify that the role is set to either `"hosteller"` or `"dayscholar"`

### Session not persisting
- Check that cookies are enabled in your browser
- Verify middleware is properly configured

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

