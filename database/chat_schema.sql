-- ============================================
-- Chat Tables Schema
-- ============================================
-- Run this AFTER running the main schema.sql
-- This adds chat rooms and messages tables
-- ============================================

-- ============================================
-- 1. Create Chat Rooms Table
-- ============================================
-- Stores chat rooms for each delivery request

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(request_id) -- One chat room per request
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Create Chat Messages Table
-- ============================================
-- Stores all chat messages

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'location', 'price_confirmation', 'system')),
  content TEXT NOT NULL,
  image_url TEXT,
  location JSONB, -- { lat: number, lng: number }
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create Indexes
-- ============================================

-- Index for fetching messages by room
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id, created_at DESC);

-- Index for fetching room by request
CREATE INDEX IF NOT EXISTS idx_chat_rooms_request_id ON public.chat_rooms(request_id);

-- Index for fetching rooms by user
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_accepted_by ON public.chat_rooms(accepted_by);

-- ============================================
-- 4. Enable Real-time for Chat
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- ============================================
-- 5. Create Trigger for Updated At
-- ============================================

CREATE TRIGGER set_updated_at_chat_rooms
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. Row Level Security Policies - Chat Rooms
-- ============================================

-- Users can view chat rooms they're part of
CREATE POLICY "Users can view own chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() = accepted_by
  );

-- Chat rooms are created automatically when request is accepted
-- Only system can create (via trigger or app logic)
CREATE POLICY "System can create chat rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by OR
    auth.uid() = accepted_by
  );

-- Users can update their own chat rooms (for status updates)
CREATE POLICY "Users can update own chat rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.uid() = accepted_by
  );

-- ============================================
-- 7. Row Level Security Policies - Chat Messages
-- ============================================

-- Users can view messages in rooms they're part of
CREATE POLICY "Users can view messages in own rooms"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_messages.room_id
      AND (created_by = auth.uid() OR accepted_by = auth.uid())
    )
  );

-- Users can send messages in rooms they're part of
CREATE POLICY "Users can send messages in own rooms"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_messages.room_id
      AND (created_by = auth.uid() OR accepted_by = auth.uid())
    )
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================
-- 8. Create Function to Auto-create Chat Room
-- ============================================
-- This function creates a chat room when a request is accepted

CREATE OR REPLACE FUNCTION public.create_chat_room_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create chat room when status changes to 'in_progress' and accepted_by is set
  IF NEW.status = 'in_progress' AND NEW.accepted_by IS NOT NULL AND OLD.status = 'pending' THEN
    INSERT INTO public.chat_rooms (request_id, created_by, accepted_by)
    VALUES (NEW.id, NEW.created_by, NEW.accepted_by)
    ON CONFLICT (request_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_request_accepted_create_chat
  AFTER UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_room_on_accept();

-- ============================================
-- DONE!
-- ============================================
-- Chat tables are now set up with:
-- ✅ Chat rooms table
-- ✅ Chat messages table
-- ✅ Real-time enabled
-- ✅ Auto-creation of chat room when request is accepted
-- ✅ Row Level Security policies
-- ✅ Indexes for performance
-- ============================================

