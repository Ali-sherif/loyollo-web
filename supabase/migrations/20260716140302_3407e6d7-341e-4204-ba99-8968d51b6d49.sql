
-- Allow authenticated users to insert their own in-app notifications (client-side triggers)
CREATE POLICY "Users can insert their own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (recipient_id = auth.uid());

-- Allow authenticated users to enqueue transactional emails (for client-triggered notifications)
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO authenticated;
