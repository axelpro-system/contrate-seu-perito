-- Fix: ticket_messages RLS was broken due to nested RLS interaction
-- The subquery in the policy was subject to support_tickets RLS,
-- causing messages to be invisible to users even when they owned the ticket.

-- Create a SECURITY DEFINER function to bypass nested RLS
CREATE OR REPLACE FUNCTION public.can_access_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = p_ticket_id
      AND (user_id = auth.uid() OR assigned_to = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND profile_type = 'ADMIN'
  );
$$;

-- Replace ticket_messages SELECT policy
DROP POLICY IF EXISTS "Participants can view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Messages viewable by participants" ON ticket_messages;
CREATE POLICY "Messages viewable by participants" ON ticket_messages
  FOR SELECT USING (can_access_ticket(ticket_id));

-- Replace ticket_messages INSERT policy
DROP POLICY IF EXISTS "Participants can insert messages" ON ticket_messages;
DROP POLICY IF EXISTS "Messages insertable by participants" ON ticket_messages;
CREATE POLICY "Messages insertable by participants" ON ticket_messages
  FOR INSERT WITH CHECK (can_access_ticket(ticket_id));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
