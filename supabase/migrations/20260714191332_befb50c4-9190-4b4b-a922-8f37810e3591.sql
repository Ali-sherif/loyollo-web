CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_program_id UUID NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tier TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their customers"
  ON public.customers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs p WHERE p.id = customers.loyalty_program_id AND p.owner_id = auth.uid()));

CREATE POLICY "Owners can insert their customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs p WHERE p.id = customers.loyalty_program_id AND p.owner_id = auth.uid()));

CREATE POLICY "Owners can update their customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs p WHERE p.id = customers.loyalty_program_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.loyalty_programs p WHERE p.id = customers.loyalty_program_id AND p.owner_id = auth.uid()));

CREATE POLICY "Owners can delete their customers"
  ON public.customers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.loyalty_programs p WHERE p.id = customers.loyalty_program_id AND p.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_customers_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.tg_customers_set_updated_at();

CREATE INDEX customers_program_id_idx ON public.customers(loyalty_program_id);