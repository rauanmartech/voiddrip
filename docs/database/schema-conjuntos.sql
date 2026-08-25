-- SQL to enable Sets (Conjuntos) functionality

-- Create product_sets table
CREATE TABLE IF NOT EXISTS public.product_sets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    banner_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_sets_pkey PRIMARY KEY (id)
);

-- Create set_items table (junction table)
CREATE TABLE IF NOT EXISTS public.set_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    set_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT set_items_pkey PRIMARY KEY (id),
    CONSTRAINT set_items_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.product_sets(id) ON DELETE CASCADE,
    CONSTRAINT set_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.product_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_items ENABLE ROW LEVEL SECURITY;

-- Policies for product_sets
CREATE POLICY "Allow public read access for product_sets" ON public.product_sets FOR SELECT USING (true);
CREATE POLICY "Allow admin all access for product_sets" ON public.product_sets FOR ALL 
USING (auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com');

-- Policies for set_items
CREATE POLICY "Allow public read access for set_items" ON public.set_items FOR SELECT USING (true);
CREATE POLICY "Allow admin all access for set_items" ON public.set_items FOR ALL 
USING (auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com');
