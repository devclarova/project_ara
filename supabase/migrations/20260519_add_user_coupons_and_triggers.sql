-- ============================================================================
-- 20260519_add_user_coupons_and_triggers.sql
-- 보유 쿠폰함 테이블 생성 및 사용 자동 누적 트리거 설계 (Phase 2-Step 1)
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. user_coupons (보유 쿠폰함) 테이블 생성
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at TIMESTAMPTZ,
    UNIQUE (user_id, coupon_id)
);

-- ────────────────────────────────────────────
-- 2. RLS 정책 활성화 및 설정
-- ────────────────────────────────────────────
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- 재실행 안전성을 위한 기존 정책 선제 삭제 (Idempotency 보장)
DROP POLICY IF EXISTS "user_coupons_own_select" ON public.user_coupons;
DROP POLICY IF EXISTS "user_coupons_own_insert" ON public.user_coupons;
DROP POLICY IF EXISTS "user_coupons_own_update" ON public.user_coupons;
DROP POLICY IF EXISTS "user_coupons_admin_all" ON public.user_coupons;

-- 1) 사용자는 본인의 보유 쿠폰만 조회 가능
CREATE POLICY "user_coupons_own_select"
    ON public.user_coupons FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2) 사용자는 본인 쿠폰함에 직접 쿠폰 등록 가능 (Claim 전용)
CREATE POLICY "user_coupons_own_insert"
    ON public.user_coupons FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3) 사용자의 직접 UPDATE 정책은 보안 취약점 사전 보완을 위해 배제 처리
-- [보안 사유]: 클라이언트 사이드에서 직접 UPDATE를 허용할 경우, 사용자가 본인의 쿠폰 상태를 is_used = false로 위조 조작해 무한 사용할 수 있는 위협을 원천 예방합니다.
-- [보완 대책]: 3단계 결제 최종 확정 시점에 SECURITY DEFINER를 준수한 서버 사이드 트랜잭션을 통해서만 상태를 차단 업데이트하도록 강제합니다.

-- 4) 관리자는 전체 조회/조작 가능 (public.authorize_admin 함수 존재 전제)
CREATE POLICY "user_coupons_admin_all"
    ON public.user_coupons FOR ALL
    TO authenticated
    USING (public.authorize_admin())
    WITH CHECK (public.authorize_admin());

-- ────────────────────────────────────────────
-- 3. coupon_usages INSERT 시 사용 횟수 자동 누적 트리거
-- ────────────────────────────────────────────

-- 1) 트리거 함수 선언 (보안을 위한 SET search_path = public 추가)
CREATE OR REPLACE FUNCTION public.handle_coupon_usage_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$;

-- 2) 트리거 바인딩 (AFTER INSERT)
DROP TRIGGER IF EXISTS trg_coupon_usage_inserted ON public.coupon_usages;
CREATE TRIGGER trg_coupon_usage_inserted
    AFTER INSERT ON public.coupon_usages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coupon_usage_inserted();

-- ────────────────────────────────────────────
-- 4. VIP 혜택 Seed 조건부 적재
-- ────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.promotions 
        WHERE title = 'VIP 전용 시크릿 혜택'
    ) THEN
        INSERT INTO public.promotions (
            title,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount,
            target_type,
            starts_at,
            ends_at,
            is_active
        ) VALUES (
            'VIP 전용 시크릿 혜택',
            'Premium 플랜 구독자를 위한 특별 시크릿 할인 혜택입니다.',
            'percent',
            15.00,
            0.00,
            NULL,
            'subscriber',
            now(),
            now() + INTERVAL '10 years',
            true
        );
    END IF;
END $$;
