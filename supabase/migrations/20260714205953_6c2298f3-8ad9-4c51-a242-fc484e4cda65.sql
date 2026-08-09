GRANT INSERT ON public.customers TO anon;

CREATE POLICY "Anyone can enroll into an existing program"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.loyalty_programs lp WHERE lp.id = customers.loyalty_program_id)
);