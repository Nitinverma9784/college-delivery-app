-- ============================================
-- College Delivery App Database Schema
-- ============================================
-- Run these queries in Supabase SQL Editor
-- Order: Run them sequentially from top to bottom
-- ============================================

-- ============================================
-- 1. Create Profiles Table
-- ============================================
-- This table stores user profile information
-- It extends the auth.users table with app-specific data

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

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Create Delivery Requests Table
-- ============================================
-- This table stores delivery requests made by hostellers

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

-- Enable Row Level Security
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create Indexes for Performance
-- ============================================

-- Index for filtering requests by status (for dayscholars to see pending requests)
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests(status);

-- Index for filtering requests by creator (for hostellers to see their requests)
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_by ON public.delivery_requests(created_by);

-- Index for filtering requests by acceptor (for dayscholars to see their accepted requests)
CREATE INDEX IF NOT EXISTS idx_delivery_requests_accepted_by ON public.delivery_requests(accepted_by);

-- Index for sorting by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_at ON public.delivery_requests(created_at DESC);

-- Index for filtering by urgency
CREATE INDEX IF NOT EXISTS idx_delivery_requests_urgency ON public.delivery_requests(urgency);

-- ============================================
-- 4. Enable Real-time for Delivery Requests
-- ============================================
-- This allows real-time updates when requests are created/updated

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;

-- ============================================
-- 5. Create Function to Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_delivery_requests
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. Create Function to Auto-create Profile
-- ============================================
-- Automatically creates a profile when a user signs up

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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. Row Level Security Policies - Profiles
-- ============================================

-- Anyone can view profiles (for displaying user info in requests)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 8. Row Level Security Policies - Delivery Requests
-- ============================================

-- Everyone authenticated can view all requests
CREATE POLICY "Anyone can view delivery requests"
  ON public.delivery_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only hostellers can create requests (check via profile role)
CREATE POLICY "Hostellers can create requests"
  ON public.delivery_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'hosteller'
    )
  );

-- Hostellers can update their own requests (only if pending or in_progress)
CREATE POLICY "Hostellers can update own requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (
    auth.uid() = created_by AND
    status IN ('pending', 'in_progress')
  )
  WITH CHECK (
    auth.uid() = created_by
  );

-- Dayscholars can accept pending requests (update status and accepted_by)
CREATE POLICY "Dayscholars can accept requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'dayscholar'
    )
  )
  WITH CHECK (
    accepted_by = auth.uid() AND
    status IN ('in_progress', 'buying', 'on_the_way', 'delivered')
  );

-- Dayscholars can update requests they accepted
CREATE POLICY "Dayscholars can update accepted requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (
    accepted_by = auth.uid() AND
    status IN ('in_progress', 'buying', 'on_the_way', 'delivered')
  );

-- Hostellers can delete their own pending requests
CREATE POLICY "Hostellers can delete own pending requests"
  ON public.delivery_requests
  FOR DELETE
  USING (
    auth.uid() = created_by AND
    status = 'pending'
  );

-- ============================================
-- 9. Create View for Request Details with User Info
-- ============================================
-- This view joins requests with creator and acceptor profiles

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

-- Grant access to the view
GRANT SELECT ON public.delivery_requests_with_users TO authenticated;

-- ============================================
-- 10. Create Function to Calculate Reward
-- ============================================
-- Automatically calculates reward based on estimated price

CREATE OR REPLACE FUNCTION public.calculate_reward(price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(price * 0.15 + 10, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- DONE! 
-- ============================================
-- Your database is now set up with:
-- ✅ Profiles table for user data
-- ✅ Delivery requests table
-- ✅ Real-time enabled for requests
-- ✅ Row Level Security policies
-- ✅ Auto-created profiles on signup
-- ✅ Indexes for performance
-- ✅ Helper functions and views
-- ============================================

