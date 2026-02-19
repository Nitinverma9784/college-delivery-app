# Step-by-Step Database Setup

## 🎯 Goal
Set up database tables so hostellers can create requests that appear in real-time for dayscholars.

---

## 📋 Step 1: Open Supabase SQL Editor

1. Go to **https://app.supabase.com**
2. Select your project
3. In the left sidebar, click **"SQL Editor"**
4. Click **"New Query"** button

---

## 📋 Step 2: Run the Complete Schema

### Option A: Run Everything at Once (Recommended)

1. Open the file `database/schema.sql` in your project
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase SQL Editor** (Ctrl+V)
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for success message: ✅ "Success. No rows returned"

### Option B: Run Step by Step (If Option A Fails)

If you get errors, run these sections one by one:

#### Step 2.1: Create Profiles Table
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hosteller', 'dayscholar')),
  avatar TEXT,
  trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  deliveries INTEGER DEFAULT 0 CHECK (deliveries >= 0),
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  earnings DECIMAL(10,2) DEFAULT 0.0 CHECK (earnings >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

#### Step 2.2: Create Delivery Requests Table
```sql
CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  estimated_price DECIMAL(10,2) NOT NULL CHECK (estimated_price >= 0),
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  notes TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'buying', 'on_the_way', 'delivered')),
  hostel_block TEXT NOT NULL,
  reward DECIMAL(10,2) NOT NULL CHECK (reward >= 0),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
```

#### Step 2.3: Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_by ON public.delivery_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_accepted_by ON public.delivery_requests(accepted_by);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_at ON public.delivery_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_urgency ON public.delivery_requests(urgency);
```

#### Step 2.4: Enable Real-time
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
```

#### Step 2.5: Create Helper Functions
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_delivery_requests
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'hosteller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### Step 2.6: Create RLS Policies
```sql
-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Delivery requests policies
CREATE POLICY "Anyone can view delivery requests"
  ON public.delivery_requests FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Hostellers can create requests"
  ON public.delivery_requests FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hosteller')
  );

CREATE POLICY "Hostellers can update own requests"
  ON public.delivery_requests FOR UPDATE
  USING (auth.uid() = created_by AND status IN ('pending', 'in_progress'))
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Dayscholars can accept requests"
  ON public.delivery_requests FOR UPDATE
  USING (
    status = 'pending' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dayscholar')
  )
  WITH CHECK (
    accepted_by = auth.uid() AND
    status IN ('in_progress', 'buying', 'on_the_way', 'delivered')
  );

CREATE POLICY "Dayscholars can update accepted requests"
  ON public.delivery_requests FOR UPDATE
  USING (
    accepted_by = auth.uid() AND
    status IN ('in_progress', 'buying', 'on_the_way', 'delivered')
  );

CREATE POLICY "Hostellers can delete own pending requests"
  ON public.delivery_requests FOR DELETE
  USING (auth.uid() = created_by AND status = 'pending');
```

#### Step 2.7: Create View
```sql
CREATE OR REPLACE VIEW public.delivery_requests_with_users AS
SELECT 
  dr.*,
  creator.id as creator_id,
  creator.name as creator_name,
  creator.email as creator_email,
  creator.avatar as creator_avatar,
  creator.trust_score as creator_trust_score,
  creator.rating as creator_rating,
  acceptor.id as acceptor_id,
  acceptor.name as acceptor_name,
  acceptor.email as acceptor_email,
  acceptor.avatar as acceptor_avatar,
  acceptor.trust_score as acceptor_trust_score,
  acceptor.rating as acceptor_rating
FROM public.delivery_requests dr
LEFT JOIN public.profiles creator ON dr.created_by = creator.id
LEFT JOIN public.profiles acceptor ON dr.accepted_by = acceptor.id;

GRANT SELECT ON public.delivery_requests_with_users TO authenticated;
```

---

## 📋 Step 3: Verify Setup

1. Go to **"Table Editor"** in Supabase sidebar
2. You should see:
   - ✅ `profiles` table
   - ✅ `delivery_requests` table
3. Click on `delivery_requests` table
4. Check that there's a **real-time icon** (⚡) next to the table name
   - If not, go to Database → Replication and enable it manually

---

## 📋 Step 4: Test Real-time (Optional)

1. Open two browser windows:
   - Window 1: Your app (as hosteller)
   - Window 2: Your app (as dayscholar) or Supabase Table Editor
2. In Window 1, create a request
3. In Window 2, you should see it appear immediately!

---

## ✅ Success Checklist

- [ ] All SQL queries ran without errors
- [ ] `profiles` table exists
- [ ] `delivery_requests` table exists
- [ ] Real-time is enabled on `delivery_requests`
- [ ] Can see tables in Table Editor

---

## 🐛 Troubleshooting

### Error: "relation already exists"
- Tables already exist, that's okay! The `IF NOT EXISTS` should prevent this, but if you see it, you can skip that query.

### Error: "permission denied"
- Make sure you're running queries as the project owner
- Check that you're in the correct project

### Real-time not working
1. Go to **Database** → **Replication** in Supabase
2. Find `delivery_requests` table
3. Toggle the switch to enable replication
4. Wait a few seconds

### Can't see tables
- Refresh the Table Editor
- Make sure you're looking at the `public` schema (not `auth`)

---

## 🎉 You're Done!

Your database is now set up. The next step is to update your app code to:
1. Create requests in Supabase instead of mock data
2. Subscribe to real-time updates
3. Display requests from the database

