# Database Setup Instructions

## Quick Start

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Run the Schema**
   - Copy the entire contents of `schema.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)
   - Wait for all queries to execute successfully

3. **Verify Setup**
   - Go to **"Table Editor"** in Supabase
   - You should see two tables: `profiles` and `delivery_requests`
   - Check that real-time is enabled (you'll see a real-time icon next to `delivery_requests`)

## What Gets Created

### Tables
- **profiles**: Stores user profile information (name, role, trust score, etc.)
- **delivery_requests**: Stores delivery requests made by hostellers

### Features
- ✅ **Real-time updates**: When a hosteller creates a request, dayscholars see it instantly
- ✅ **Row Level Security**: Users can only perform actions they're allowed to
- ✅ **Auto-profile creation**: Profiles are automatically created when users sign up
- ✅ **Indexes**: Fast queries for filtering and sorting
- ✅ **Triggers**: Auto-update timestamps

## How It Works

### Creating a Request (Hosteller)
1. Hosteller creates a request → Inserted into `delivery_requests` table
2. Real-time subscription broadcasts the new request
3. All dayscholars see it immediately in their feed

### Accepting a Request (Dayscholar)
1. Dayscholar accepts a request → Updates `status` and `accepted_by`
2. Real-time subscription broadcasts the update
3. Hosteller sees their request was accepted

## Testing

### Test Creating a Request
```sql
-- This will be done via your app, but you can test in SQL:
INSERT INTO public.delivery_requests (
  item_name, quantity, estimated_price, urgency, 
  hostel_block, reward, created_by
) VALUES (
  'Test Item', 1, 50.00, 'high', 'Block A', 17.50, 
  'YOUR_USER_ID_HERE'
);
```

### Test Viewing Requests
```sql
-- View all pending requests (what dayscholars see)
SELECT * FROM public.delivery_requests 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- View requests with user details
SELECT * FROM public.delivery_requests_with_users 
WHERE status = 'pending';
```

## Troubleshooting

### "relation does not exist" error
- Make sure you ran all the queries in order
- Check that tables were created in the Table Editor

### Real-time not working
- Verify real-time is enabled: Check the table in Supabase dashboard
- Make sure you're using the correct Supabase client in your app
- Check browser console for WebSocket connection errors

### RLS policies blocking access
- Verify your user is authenticated
- Check that profiles exist for your users
- Review the RLS policies in Supabase dashboard → Authentication → Policies

## Next Steps

After running the schema:
1. Update your app code to use Supabase instead of mock data
2. Set up real-time subscriptions in your React components
3. Test creating and accepting requests

