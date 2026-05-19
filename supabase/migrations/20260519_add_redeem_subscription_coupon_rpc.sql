-- ============================================================================
-- 20260519_add_redeem_subscription_coupon_rpc.sql
-- 구독 결제 확정 후 안전한 쿠폰 사용 및 소진 처리를 위한 RPC 마이그레이션 (Phase 3-A)
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. subscriptions 및 coupon_usages 테이블 컬럼 보강 (Additive)
-- ────────────────────────────────────────────

-- subscriptions 테이블에 coupon_id 및 billing_cycle 컬럼이 누락된 경우를 대비해 추가
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly'));

-- coupon_usages 테이블에 subscription_id 컬럼 추가 (결제-쿠폰 관계 매핑)
ALTER TABLE public.coupon_usages 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- 한 구독(subscription_id)에 여러 쿠폰이 중복 사용되는 것을 스키마 단에서 방지하는 Partial Unique Index 생성
CREATE UNIQUE INDEX IF NOT EXISTS coupon_usages_subscription_id_unique
ON public.coupon_usages(subscription_id)
WHERE subscription_id IS NOT NULL;

-- ────────────────────────────────────────────
-- 2. redeem_subscription_coupon_after_payment RPC 함수 선언
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_subscription_coupon_after_payment(
    p_coupon_id UUID,
    p_subscription_id UUID,
    p_discount_applied NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_sub RECORD;
    v_coupon RECORD;
    v_promo RECORD;
    v_usage_count INTEGER;
    v_user_coupon RECORD;
    v_usage_id UUID;
BEGIN
    -- 1) 사용자 세션 인증 상태 검증
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'reason', '인증되지 않은 사용자입니다.'
        );
    END IF;

    -- 2) p_discount_applied 값의 유효성 검사 (NULL 또는 음수 차단)
    IF p_discount_applied IS NULL OR p_discount_applied < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_discount',
            'reason', '할인 금액이 올바르지 않습니다.'
        );
    END IF;

    -- 3) p_subscription_id의 실재 여부 및 소유권 검증
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE id = p_subscription_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'subscription_not_found',
            'reason', '구독 정보를 찾을 수 없습니다.'
        );
    END IF;

    IF v_sub.user_id <> v_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'forbidden',
            'reason', '해당 구독에 대한 조작 권한이 없습니다.'
        );
    END IF;

    -- 3-1) 구독 상태가 active 인지 정밀 검증
    IF v_sub.status IS DISTINCT FROM 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'subscription_not_active',
            'reason', '활성화된 구독 결제에 대해서만 쿠폰을 사용 처리할 수 있습니다.'
        );
    END IF;

    -- 4) 구독에 실제 적용한 coupon_id와 요청받은 p_coupon_id의 일치 여부 정밀 검증 (위조 방지)
    IF v_sub.coupon_id IS DISTINCT FROM p_coupon_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'coupon_mismatch',
            'reason', '구독 결제 시 적용된 쿠폰과 소진하려는 쿠폰이 일치하지 않습니다.'
        );
    END IF;

    -- 5) 해당 구독(subscription_id)에 이미 쿠폰이 소진 완료되었는지 중복 소진 검사
    IF EXISTS (
        SELECT 1
        FROM public.coupon_usages
        WHERE subscription_id = p_subscription_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'subscription_coupon_already_redeemed',
            'reason', '이미 이 구독 결제에 쿠폰 사용 처리가 완료되었습니다.'
        );
    END IF;

    -- 6) 쿠폰 존재 및 활성 여부 검증 (동시성 방지를 위한 배타적 잠금 적용)
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE id = p_coupon_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'coupon_not_found',
            'reason', '존재하지 않거나 비활성화된 쿠폰입니다.'
        );
    END IF;

    -- 7) 연계 프로모션 활성 여부 및 기간 유효성 검증 (Null-Safe 보장)
    SELECT * INTO v_promo
    FROM public.promotions
    WHERE id = v_coupon.promotion_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'promotion_not_found',
            'reason', '해당 프로모션이 비활성화되었거나 존재하지 않습니다.'
        );
    END IF;

    IF v_promo.starts_at IS NOT NULL AND now() < v_promo.starts_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'promotion_not_started',
            'reason', '아직 쿠폰 사용 기간이 아닙니다.'
        );
    END IF;

    IF v_promo.ends_at IS NOT NULL AND now() > v_promo.ends_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'promotion_expired',
            'reason', '쿠폰 사용 기간이 만료되었습니다.'
        );
    END IF;

    -- 8) 쿠폰의 전체 사용 한도(usage_limit) 확인
    IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'usage_limit_exceeded',
            'reason', '쿠폰 전체 사용 가능 한도를 초과했습니다.'
        );
    END IF;

    -- 9) 사용자별 사용 한도(per_user_limit) 및 coupon_usages 중복 내역 확인
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_usages
    WHERE coupon_id = p_coupon_id AND user_id = v_user_id;

    IF v_usage_count >= v_coupon.per_user_limit THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'already_used',
            'reason', '이미 사용 처리된 쿠폰입니다.'
        );
    END IF;

    -- 10) user_coupons (보유 쿠폰 지갑) 상태 처리
    SELECT * INTO v_user_coupon
    FROM public.user_coupons
    WHERE user_id = v_user_id AND coupon_id = p_coupon_id;

    IF FOUND THEN
        -- B안: 이미 지갑에 존재하는 보유 쿠폰인 경우
        IF v_user_coupon.is_used = true THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'already_used',
                'reason', '지갑 안에서 이미 사용 완료 처리된 쿠폰입니다.'
            );
        END IF;

        -- 사용 완료로 상태 업데이트
        UPDATE public.user_coupons
        SET is_used = true,
            used_at = now()
        WHERE id = v_user_coupon.id;
    
    -- C안: 지갑에 없는 경우 (직접 입력 쿠폰)
    -- 지갑에 강제 인서트하지 않고 통과 처리 (user_coupons = 보유함 의미 보존)
    END IF;

    -- 11) coupon_usages 사용 이력 인서트 (used_count 트리거 연동 작동)
    INSERT INTO public.coupon_usages (
        coupon_id,
        user_id,
        discount_applied,
        subscription_id
    ) VALUES (
        p_coupon_id,
        v_user_id,
        p_discount_applied,
        p_subscription_id
    )
    RETURNING id INTO v_usage_id;

    -- 12) 성공 객체 반환
    RETURN jsonb_build_object(
        'success', true,
        'coupon_usage_id', v_usage_id,
        'reason', NULL
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLSTATE,
        'reason', SQLERRM
    );
END;
$$;

-- ────────────────────────────────────────────
-- 3. 실행 권한 제어
-- ────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.redeem_subscription_coupon_after_payment(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_subscription_coupon_after_payment(UUID, UUID, NUMERIC) TO authenticated;
