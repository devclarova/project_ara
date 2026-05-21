-- ==========================================
-- VIP 전용 시크릿 상자 개봉 보안 RPC
-- ==========================================
-- 클라이언트에서 직접 coupons 테이블에 접근하지 않고,
-- 서버 내부(SECURITY DEFINER)에서만 안전하게 권한 검증 및 쿠폰 발급/적재를 수행합니다.

CREATE OR REPLACE FUNCTION public.open_vip_coupon_box()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_has_premium BOOLEAN;
    v_already_received BOOLEAN;
    v_promo_id UUID;
    v_discount_type TEXT;
    v_discount_value DECIMAL;
    v_secret_code TEXT;
    v_code_exists BOOLEAN;
    v_new_coupon_id UUID;
    v_new_wallet_id UUID;
BEGIN
    -- 1. 현재 로그인 유저 식별 (클라이언트 변조 불가능한 auth.uid 사용)
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'is_valid', false, 'error', 'unauthorized', 'reason', '로그인이 필요한 서비스입니다.');
    END IF;

    -- 2. subscriptions 테이블 기준 Premium 활성 구독 검증 (최상위 Source of Truth)
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE user_id = v_user_id
          AND status = 'active'
          AND plan = 'premium'
          AND (ends_at IS NULL OR ends_at > now())
    ) INTO v_has_premium;

    IF NOT v_has_premium THEN
        RETURN jsonb_build_object('success', false, 'is_valid', false, 'error', 'forbidden', 'reason', 'Premium 멤버십 활성 회원만 VIP 시크릿 상자를 열 수 있습니다.');
    END IF;

    -- 3. 이달 내 기발급 이력 검사 (월 1회 제한)
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_coupons uc
        JOIN public.coupons c ON c.id = uc.coupon_id
        JOIN public.promotions p ON p.id = c.promotion_id
        WHERE uc.user_id = v_user_id
          AND p.title = 'VIP 전용 시크릿 혜택'
          AND uc.created_at >= date_trunc('month', now())
    ) INTO v_already_received;

    IF v_already_received THEN
        RETURN jsonb_build_object('success', false, 'is_valid', false, 'error', 'already_claimed', 'reason', '이번 달의 VIP 시크릿 혜택은 이미 지급되었습니다. 다음 달에 다시 참여해 주세요.');
    END IF;

    -- 4. 프로모션 상태 검증 (유효 기간 내인지 확인)
    SELECT id, discount_type, discount_value
    INTO v_promo_id, v_discount_type, v_discount_value
    FROM public.promotions
    WHERE title = 'VIP 전용 시크릿 혜택'
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at >= now())
    LIMIT 1;

    IF v_promo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'is_valid', false, 'error', 'promo_expired', 'reason', '현재 유효한 VIP 시크릿 혜택 프로모션을 찾을 수 없습니다.');
    END IF;

    -- 5. 고유 코드 생성 및 충돌 방지 루프
    LOOP
        v_secret_code := 'VIP-SECRET-' || UPPER(substring(md5(random()::text) from 1 for 5));
        SELECT EXISTS (
            SELECT 1 FROM public.coupons WHERE code = v_secret_code
        ) INTO v_code_exists;
        EXIT WHEN NOT v_code_exists;
    END LOOP;

    -- 6. coupons에 신규 발급 (트랜잭션 원자성 보장)
    INSERT INTO public.coupons (promotion_id, code, usage_limit, per_user_limit, is_active)
    VALUES (v_promo_id, v_secret_code, 1, 1, true)
    RETURNING id INTO v_new_coupon_id;

    -- 7. 보유 쿠폰함에 안착 (트랜잭션 원자성 보장)
    INSERT INTO public.user_coupons (user_id, coupon_id, is_used)
    VALUES (v_user_id, v_new_coupon_id, false)
    RETURNING id INTO v_new_wallet_id;

    -- 8. 성공 응답 구조체 반환
    RETURN jsonb_build_object(
        'success', true,
        'is_valid', true,
        'code', v_secret_code,
        'coupon_id', v_new_coupon_id,
        'user_coupon_id', v_new_wallet_id,
        'title', 'VIP 전용 시크릿 혜택',
        'discount_type', v_discount_type,
        'discount_value', v_discount_value,
        'reason', null
    );
EXCEPTION WHEN OTHERS THEN
    -- 치명적 오류 발생 시 자동 ROLLBACK 되며 에러 사유 반환
    RETURN jsonb_build_object('success', false, 'is_valid', false, 'error', SQLSTATE, 'reason', SQLERRM);
END;
$$;

-- 보안 강화: 권한이 없는 익명/일반 접근 차단 후 authenticated 유저에게만 위임
REVOKE EXECUTE ON FUNCTION public.open_vip_coupon_box() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_vip_coupon_box() TO authenticated;
