-- 1. Create product_review_likes table
CREATE TABLE IF NOT EXISTS public.product_review_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.product_review_likes ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Anyone can view review likes" 
ON public.product_review_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can toggle their own likes" 
ON public.product_review_likes FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Function to sync likes count (optional but recommended for performance)
CREATE OR REPLACE FUNCTION public.handle_review_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.product_reviews SET likes = likes + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.product_reviews SET likes = GREATEST(0, likes - 1) WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger
DROP TRIGGER IF EXISTS on_review_like_change ON public.product_review_likes;
CREATE TRIGGER on_review_like_change
AFTER INSERT OR DELETE ON public.product_review_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_review_like_change();
