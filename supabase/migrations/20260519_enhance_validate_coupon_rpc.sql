-- ============================================================================
-- 20260519_enhance_validate_coupon_rpc.sql
-- validate_coupon RPC 함수 반환 규격 하위 호환성 확장 재정의
--
-- ⚠️ 주의 사항:
--   - 기존 성공시의 flat 필드(valid, coupon_id, promotion_id, title 등) 및 실패시의 error 필드 온전히 유지
--   - 신규 프론트엔드가 요구하는 is_valid, reason, promotion (중첩 객체) 필드 동시 제공 (Double-Binding)
--   - 기존 검증 로직(활성화 여부, 만료 여부, 사용 횟수, 중복 사용)을 철저하게 유지
-- ============================================================================

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
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '존재하지 않거나 비활성화된 쿠폰입니다.',
            'reason', '존재하지 않거나 비활성화된 쿠폰입니다.'
        );
    END IF;

    -- 2. 연결된 프로모션 확인
    SELECT * INTO v_promo
    FROM public.promotions
    WHERE id = v_coupon.promotion_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '해당 프로모션이 종료되었습니다.',
            'reason', '해당 프로모션이 종료되었습니다.'
        );
    END IF;

    -- 3. 기간 확인
    IF now() < v_promo.starts_at THEN
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '아직 사용 기간이 아닙니다. 시작일: ' || to_char(v_promo.starts_at, 'YYYY-MM-DD'),
            'reason', '아직 사용 기간이 아닙니다. 시작일: ' || to_char(v_promo.starts_at, 'YYYY-MM-DD')
        );
    END IF;

    IF now() > v_promo.ends_at THEN
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '사용 기간이 만료되었습니다.',
            'reason', '사용 기간이 만료되었습니다.'
        );
    END IF;

    -- 4. 전체 사용 횟수 확인
    IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '쿠폰 사용 한도가 초과되었습니다.',
            'reason', '쿠폰 사용 한도가 초과되었습니다.'
        );
    END IF;

    -- 5. 사용자별 중복 확인
    SELECT COUNT(*) INTO v_usage_count
    FROM public.coupon_usages
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

    IF v_usage_count >= v_coupon.per_user_limit THEN
        RETURN jsonb_build_object(
            'valid', false,
            'is_valid', false,
            'error', '이미 사용한 쿠폰입니다.',
            'reason', '이미 사용한 쿠폰입니다.'
        );
    END IF;

    -- 6. 유효한 쿠폰 (기존 flat 필드 + 신규 중첩 promotion 객체 및 is_valid/reason 반환)
    RETURN jsonb_build_object(
        'valid', true,
        'is_valid', true,
        'reason', NULL,
        'coupon_id', v_coupon.id,
        'promotion_id', v_promo.id,
        'title', v_promo.title,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'max_discount', v_promo.max_discount,
        'min_order_amount', v_promo.min_order_amount,
        'promotion', jsonb_build_object(
            'id', v_promo.id,
            'title', v_promo.title,
            'discount_type', v_promo.discount_type,
            'discount_value', v_promo.discount_value,
            'max_discount', v_promo.max_discount,
            'min_order_amount', v_promo.min_order_amount
        )
    );
END;
$$;

-- validate_coupon 함수 실행 권한: 인증된 사용자만
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, UUID) TO authenticated;
