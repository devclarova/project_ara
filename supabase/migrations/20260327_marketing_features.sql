-- ============================================================================
-- 20260327_marketing_features.sql
-- 마케팅 기능 기반 테이블 생성 (Phase 1)
--
-- ⚠️ 안전 지침:
--   - 모든 CREATE TABLE에 IF NOT EXISTS 사용
--   - 기존 테이블/함수 수정 없음 (DROP/ALTER 없음)
--   - 기존 authorize_admin(), update_updated_at_column() 재사용
--   - 새 테이블에만 새 RLS 정책 추가
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. promotions (프로모션 캠페인)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_order_amount DECIMAL(15,2) DEFAULT 0,
    max_discount DECIMAL(15,2),
    target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'new_user', 'subscriber')),
    applicable_products UUID[],
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (쿠폰 코드와 연동된 프로모션 확인용)
CREATE POLICY "promotions_public_select"
    ON public.promotions FOR SELECT
    TO public
    USING (true);

-- 관리자만 CRUD
CREATE POLICY "promotions_admin_all"
    ON public.promotions FOR ALL
    TO authenticated
    USING (public.authorize_admin())
    WITH CHECK (public.authorize_admin());

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ────────────────────────────────────────────
-- 2. coupons (쿠폰 코드)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    usage_limit INTEGER DEFAULT 0,        -- 0 = 무제한
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (쿠폰 유효성 확인용)
CREATE POLICY "coupons_public_select"
    ON public.coupons FOR SELECT
    TO public
    USING (true);

-- 관리자만 CRUD
CREATE POLICY "coupons_admin_all"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.authorize_admin())
    WITH CHECK (public.authorize_admin());


-- ────────────────────────────────────────────
-- 3. coupon_usages (쿠폰 사용 이력)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discount_applied DECIMAL(15,2) DEFAULT 0,
    used_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자별 쿠폰 중복 사용 방지 인덱스 (per_user_limit > 1 대응은 RPC에서 처리)
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_usages_unique
    ON public.coupon_usages(coupon_id, user_id);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 이력만 조회
CREATE POLICY "coupon_usages_own_select"
    ON public.coupon_usages FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 사용자는 본인 이력만 INSERT (쿠폰 등록 시)
CREATE POLICY "coupon_usages_own_insert"
    ON public.coupon_usages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 관리자는 전체 조회 가능
CREATE POLICY "coupon_usages_admin_select"
    ON public.coupon_usages FOR SELECT
    TO authenticated
    USING (public.authorize_admin());


-- ────────────────────────────────────────────
-- 4. marketing_banners (마케팅 배너)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    banner_type TEXT NOT NULL CHECK (banner_type IN ('top_bar', 'popup', 'hero_slide', 'inline_card')),
    content TEXT,                          -- 배너 텍스트 내용
    image_url TEXT,                        -- 외부 이미지 URL (Storage 부담 없음)
    link_url TEXT,                         -- 클릭 시 이동할 URL
    bg_color TEXT DEFAULT '#6366f1',
    text_color TEXT DEFAULT '#ffffff',
    target_page TEXT DEFAULT 'all',        -- 'all', 'study', 'goods', 'sns', 'landing'
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'guest', 'free', 'subscriber')),
    priority INTEGER DEFAULT 0,           -- 높을수록 우선 노출
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketing_banners ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (사용자 측 배너 노출용)
CREATE POLICY "marketing_banners_public_select"
    ON public.marketing_banners FOR SELECT
    TO public
    USING (true);

-- 관리자만 CRUD
CREATE POLICY "marketing_banners_admin_all"
    ON public.marketing_banners FOR ALL
    TO authenticated
    USING (public.authorize_admin())
    WITH CHECK (public.authorize_admin());

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_marketing_banners_updated_at
    BEFORE UPDATE ON public.marketing_banners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ────────────────────────────────────────────
-- 5. subscriptions (구독 플랜)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자당 하나의 활성 구독만 허용 (active 상태 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_user
    ON public.subscriptions(user_id) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 구독만 조회
CREATE POLICY "subscriptions_own_select"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 관리자는 전체 관리 가능
CREATE POLICY "subscriptions_admin_all"
    ON public.subscriptions FOR ALL
    TO authenticated
    USING (public.authorize_admin())
    WITH CHECK (public.authorize_admin());

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ────────────────────────────────────────────
-- 6. validate_coupon() RPC 함수
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_promo RECORD;
    v_usage_count INTEGER;
BEGIN
    -- 1. 쿠폰 조회 (대소문자 무관)
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(TRIM(p_code)) AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', '존재하지 않거나 비활성화된 쿠폰입니다.');
    END IF;

    -- 2. 연결된 프로모션 확인
    SELECT * INTO v_promo
    FROM public.promotions
    WHERE id = v_coupon.promotion_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', '해당 프로모션이 종료되었습니다.');
    END IF;

    -- 3. 기간 확인
    IF now() < v_promo.starts_at THEN
        RETURN jsonb_build_object('valid', false, 'error', '아직 사용 기간이 아닙니다. 시작일: ' || to_char(v_promo.starts_at, 'YYYY-MM-DD'));
    END IF;

    IF now() > v_promo.ends_at THEN
        RETURN jsonb_build_object('valid', false, 'error', '사용 기간이 만료되었습니다.');
    END IF;

    -- 4. 전체 사용 횟수 확인
    IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', '쿠폰 사용 한도가 초과되었습니다.');
    END IF;

    -- 5. 사용자별 중복 확인
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_usages
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

    IF v_usage_count >= v_coupon.per_user_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', '이미 사용한 쿠폰입니다.');
    END IF;

    -- 6. 유효한 쿠폰
    RETURN jsonb_build_object(
        'valid', true,
        'coupon_id', v_coupon.id,
        'promotion_id', v_promo.id,
        'title', v_promo.title,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'max_discount', v_promo.max_discount,
        'min_order_amount', v_promo.min_order_amount
    );
END;
$$;

-- validate_coupon 함수 실행 권한: 인증된 사용자만
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, UUID) TO authenticated;


-- ============================================================================
-- ✅ 완료
-- 생성된 테이블: promotions, coupons, coupon_usages, marketing_banners, subscriptions
-- 생성된 함수:  validate_coupon(TEXT, UUID)
-- 생성된 트리거: 3개 (promotions, marketing_banners, subscriptions)
-- 생성된 인덱스: 2개 (coupon_usages unique, subscriptions active user)
--
-- ⚠️ 기존 데이터/테이블 영향: 없음
-- ============================================================================
