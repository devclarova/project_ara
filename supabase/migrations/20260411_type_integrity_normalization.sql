-- [NEW] 20260411_type_integrity_normalization.sql
-- 목적(Why): jsonb 컬럼을 정형화된 테이블 및 컬럼으로 분리하여 데이터 무결성을 확보함
-- 방법(How): site_settings, product_variants, reports 테이블의 비정형 데이터를 정규화함

-- 1. 사이트 설정 전역 정형화 (Single-Row Configuration)
CREATE TABLE IF NOT EXISTS public.site_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- 싱글톤 보장
    notice_enabled BOOLEAN DEFAULT false,
    notice_text TEXT,
    notice_color TEXT CHECK (notice_color IN ('blue', 'red', 'amber', 'emerald')),
    maintenance_enabled BOOLEAN DEFAULT false,
    maintenance_message TEXT,
    maintenance_end_time TIMESTAMPTZ,
    site_title TEXT DEFAULT 'Project Ara',
    site_description TEXT,
    site_logo_url TEXT,
    sec_ip_restriction BOOLEAN DEFAULT false,
    sec_ip_whitelist TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 초기 데이터 이전 (기존 site_settings가 있다면)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.site_settings) THEN
        INSERT INTO public.site_config (id, notice_enabled, notice_text, notice_color, maintenance_enabled, maintenance_message)
        SELECT 
            1,
            (SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'global_notice'),
            (SELECT value->>'text' FROM public.site_settings WHERE key = 'global_notice'),
            (SELECT value->>'color' FROM public.site_settings WHERE key = 'global_notice'),
            (SELECT (value->>'enabled')::boolean FROM public.site_settings WHERE key = 'maintenance_mode'),
            (SELECT value->>'message' FROM public.site_settings WHERE key = 'maintenance_mode')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 2. 제품 옵션 상세 정규화
CREATE TABLE IF NOT EXISTS public.product_variant_option_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    option_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(variant_id, option_id)
);

-- 기존 데이터 이전 (product_variants.options JSONB -> 신규 테이블)
-- 예: {"Color": "Red"} -> (variant_id, option_id_for_color, "Red")
DO $$
DECLARE
    v_record RECORD;
    v_opt_name TEXT;
    v_opt_val TEXT;
    v_opt_id UUID;
BEGIN
    FOR v_record IN SELECT id, product_id, options FROM public.product_variants LOOP
        FOR v_opt_name, v_opt_val IN SELECT * FROM jsonb_each_text(v_record.options) LOOP
            SELECT id INTO v_opt_id FROM public.product_options WHERE product_id = v_record.product_id AND name = v_opt_name;
            IF v_opt_id IS NOT NULL THEN
                INSERT INTO public.product_variant_option_selections (variant_id, option_id, option_value)
                VALUES (v_record.id, v_opt_id, v_opt_val)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 3. 리포트 메타데이터 정문화
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS reported_message_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS report_context_url TEXT;

-- 기존 데이터 이전
UPDATE public.reports 
SET reported_message_ids = ARRAY(SELECT jsonb_array_elements_text(metadata->'reported_message_ids')::uuid)
WHERE metadata ? 'reported_message_ids';

-- 4. 구형 컬럼 제거 (주의: 개발 환경에서만 즉시 수행, 운영에서는 단계적 처리 권장)
-- 여기서는 완벽한 무결성을 위해 제거 진행
-- ALTER TABLE public.product_variants DROP COLUMN options;
-- ALTER TABLE public.reports DROP COLUMN metadata;

-- 권한 설정
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site_config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Only admins can update site_config" ON public.site_config FOR ALL USING (public.authorize_admin());

ALTER TABLE public.product_variant_option_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read selections" ON public.product_variant_option_selections FOR SELECT USING (true);
CREATE POLICY "Admin manage selections" ON public.product_variant_option_selections FOR ALL USING (public.authorize_admin());
