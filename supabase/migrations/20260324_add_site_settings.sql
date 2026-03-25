-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Readable by everyone (public settings)
CREATE POLICY "Public read access for site_settings" 
ON public.site_settings FOR SELECT 
TO public 
USING (true);

-- Only admins can modify
CREATE POLICY "Admin write access for site_settings" 
ON public.site_settings FOR ALL 
TO authenticated 
USING (public.authorize_admin())
WITH CHECK (public.authorize_admin());

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER on_site_settings_updated
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_site_settings_updated_at();

-- Initial Data
INSERT INTO public.site_settings (key, value, description)
VALUES 
    ('global_notice', '{"enabled": false, "text": "공지사항 테스트입니다.", "color": "blue"}', '사이트 전체 상단 공지바 설정'),
    ('maintenance_mode', '{"enabled": false, "message": "현재 정기 점검 중입니다.", "end_time": null}', '서비스 점검 모드 설정'),
    ('site_metadata', '{"title": "Project Ara", "description": "공유하고 꿈꾸는 사람들의 공간", "logo_url": null}', '사이트 기본 메타데이터'),
    ('usage_terms', '{"terms": "이용약관 내용...", "privacy": "개인정보 처리방침 내용..."}', '약관 및 정책'),
    ('banner_messages', '{"sns_top": "새로운 소식을 확인해보세요!", "search_placeholder": "궁금한 것을 검색하세요"}', '시스템 안내 문구');
