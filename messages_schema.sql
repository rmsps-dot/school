-- =================================================================================
-- REAL-TIME CHAT SYSTEM SCHEMA
-- =================================================================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content              text        NOT NULL CHECK (char_length(trim(content)) > 0),
  is_read              boolean     NOT NULL DEFAULT false,
  deleted_by_sender    boolean     NOT NULL DEFAULT false,
  deleted_by_receiver  boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- SELECT: Users can only read messages they sent or received
CREATE POLICY "messages: users can read their own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: Users can only send messages as themselves
CREATE POLICY "messages: users can insert their own messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- UPDATE: Users can mark messages as read if they are the receiver
CREATE POLICY "messages: receivers can update is_read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 4. High-performance composite indexes
CREATE INDEX idx_messages_sender_receiver ON public.messages (sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at ASC);

-- 5. Enable Realtime Replication
-- This is CRUCIAL for the WebSocket subscriptions to work
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
