-- [NEW] 20260325 Shop Products & Variants Schema
-- This migration sets up the infrastructure for goods management.

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    sale_price DECIMAL(15,2) DEFAULT 0,
    summary TEXT,
    description TEXT, -- Can store Rich Text (HTML/Markdown)
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'soldout', 'archived')),
    main_image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0, -- Overall stock if no variants, or sum of variants
    badge_new BOOLEAN DEFAULT false,
    badge_best BOOLEAN DEFAULT false,
    badge_sale BOOLEAN DEFAULT false,
    shipping_fee DECIMAL(15,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(15,2) DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false, -- New: Admin moderation/hide control
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Options Table (e.g., Color, Size)
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Color'
    values TEXT[] NOT NULL, -- e.g., ['Red', 'Blue']
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Variants Table (e.g., Red-Large)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    options JSONB NOT NULL, -- e.g., {"Color": "Red", "Size": "L"}
    stock INTEGER DEFAULT 0,
    additional_price DECIMAL(15,2) DEFAULT 0,
    sku TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Public Read
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read on product_options" ON public.product_options FOR SELECT USING (true);
CREATE POLICY "Allow public read on product_variants" ON public.product_variants FOR SELECT USING (true);

-- 6. Policies: Admin Write (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow admin all on products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (authorize_admin())
WITH CHECK (authorize_admin());

CREATE POLICY "Allow admin all on product_options" 
ON public.product_options 
FOR ALL 
TO authenticated 
USING (authorize_admin())
WITH CHECK (authorize_admin());

CREATE POLICY "Allow admin all on product_variants" 
ON public.product_variants 
FOR ALL 
TO authenticated 
USING (authorize_admin())
WITH CHECK (authorize_admin());

-- 7. Automated Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Storage Bucket for Products
-- Note: Bucket creation is usually done via API or Console, but we can add meta commands if needed.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- (Handled separately if storage extensions are used)
