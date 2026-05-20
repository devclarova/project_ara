-- ============================================================================
-- 20260519_add_complete_subscription_checkout_rpc.sql
-- 구독 통합 결제 및 쿠폰 소진 원자적 처리 RPC 추가 (Phase 3-B)
-- ============================================================================

-- 1. subscriptions 테이블에 결제 금액 및 Paddle 기록을 위한 컬럼 추가 (ADD COLUMN IF NOT EXISTS)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- 2. 통합 결제 처리 RPC 함수 생성
CREATE OR REPLACE FUNCTION public.complete_subscription_checkout(
    p_plan TEXT,
    p_billing_cycle TEXT,
    p_coupon_id UUID DEFAULT NULL,
    p_expected_final_amount NUMERIC DEFAULT 0.00,
    p_payment_method TEXT DEFAULT 'pending_paddle',
    p_paddle_subscription_id TEXT DEFAULT NULL,
    p_paddle_customer_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_plan_row RECORD;
    v_base_amount NUMERIC;
    v_discount_applied NUMERIC := 0.00;
    v_final_amount NUMERIC;
    v_ends_at TIMESTAMPTZ;
    v_coupon RECORD;
    v_wallet_coupon RECORD;
    v_usage_count INTEGER;
    v_subscription_id UUID;
BEGIN
    -- 1. 사용자 세션 검증
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'reason', '인증되지 않은 사용자입니다.'
        );
    END IF;

    -- 2. 플랜 허용값 검증 (basic, premium만 결제 대상 및 NULL 차단)
    IF p_plan IS NULL OR p_plan NOT IN ('basic', 'premium') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_plan_type',
            'reason', '결제 가능한 플랜이 아닙니다.'
        );
    END IF;

    -- 3. 빌링 사이클 검증 (monthly, yearly만 허용 및 NULL 차단)
    IF p_billing_cycle IS NULL OR p_billing_cycle NOT IN ('monthly', 'yearly') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_billing_cycle',
            'reason', '유효하지 않은 빌링 주기입니다.'
        );
    END IF;

    -- 4. 결제 방식 Whitelist 검증 (pending_paddle만 허용 및 NULL 차단)
    IF p_payment_method IS NULL OR p_payment_method != 'pending_paddle' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_payment_method',
            'reason', '허용되지 않은 결제 수단입니다.'
        );
    END IF;

    -- 5. 요청된 결제 기대 금액 검증 (Null 및 음수 차단)
    IF p_expected_final_amount IS NULL OR p_expected_final_amount < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_expected_amount',
            'reason', '요청된 결제 금액이 올바르지 않습니다.'
        );
    END IF;

    -- 6. plan_configs 테이블에서 가격 및 플랜 상세 조회
    SELECT * INTO v_plan_row
    FROM public.plan_configs
    WHERE name = p_plan AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'plan_not_found',
            'reason', '유효하지 않거나 비활성화된 구독 플랜입니다.'
        );
    END IF;

    -- 7. billing_cycle에 따른 base_amount 산출 및 만료 기간 계산
    IF p_billing_cycle = 'monthly' THEN
        v_base_amount := v_plan_row.monthly_price;
        v_ends_at := now() + INTERVAL '1 month';
    ELSE
        v_base_amount := v_plan_row.yearly_price;
        v_ends_at := now() + INTERVAL '1 year';
    END IF;

    -- 8. 할인액 계산
    IF p_coupon_id IS NOT NULL THEN
        -- 8-1) 이미 사용 완료된 보유 쿠폰(Wallet Coupon) 차단 검증
        SELECT * INTO v_wallet_coupon
        FROM public.user_coupons
        WHERE user_id = v_user_id AND coupon_id = p_coupon_id;

        IF FOUND THEN
            IF v_wallet_coupon.is_used = true THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'wallet_coupon_already_used',
                    'reason', '이미 사용 완료된 보유 쿠폰입니다.'
                );
            END IF;
        END IF;

        -- 8-2) 쿠폰 행 락(FOR UPDATE OF) 획득 및 프로모션 상세 조회 (target_type 추가 조회)
        SELECT c.*, p.discount_type, p.discount_value, p.max_discount, p.min_order_amount, p.starts_at, p.ends_at, p.target_type
        INTO v_coupon
        FROM public.coupons c
        JOIN public.promotions p ON c.promotion_id = p.id
        WHERE c.id = p_coupon_id AND c.is_active = true AND p.is_active = true
        FOR UPDATE OF c;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_coupon',
                'reason', '유효하지 않거나 종료된 프로모션 쿠폰입니다.'
            );
        END IF;

        -- 8-3) 쿠폰 적용 대상(target_type) 검증 (subscription 및 all만 허용)
        IF v_coupon.target_type IS NULL OR v_coupon.target_type NOT IN ('subscription', 'all') THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'coupon_not_applicable_to_subscription',
                'reason', '이 쿠폰은 요금제 결제에 사용할 수 없습니다.'
            );
        END IF;

        -- 8-4) 쿠폰 활성 기간 검증 (Null-Safe)
        IF v_coupon.starts_at IS NOT NULL AND now() < v_coupon.starts_at THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'coupon_not_started',
                'reason', '아직 사용 시작 기간이 아닙니다.'
            );
        END IF;

        IF v_coupon.ends_at IS NOT NULL AND now() > v_coupon.ends_at THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'coupon_expired',
                'reason', '사용 기간이 만료된 쿠폰입니다.'
            );
        END IF;

        -- 8-5) 전체 사용 한도 초과 검증
        IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'coupon_usage_limit_exceeded',
                'reason', '쿠폰 전체 사용 수량이 초과되었습니다.'
            );
        END IF;

        -- 8-6) 사용자별 중복 소진 검증
        SELECT COUNT(*) INTO v_usage_count
        FROM public.coupon_usages
        WHERE coupon_id = p_coupon_id AND user_id = v_user_id;

        IF v_usage_count >= v_coupon.per_user_limit THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'coupon_already_used',
                'reason', '이미 사용 처리된 쿠폰입니다.'
            );
        END IF;

        -- 8-7) 최소 주문 금액 검증
        IF v_coupon.min_order_amount IS NOT NULL AND v_base_amount < v_coupon.min_order_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'min_order_amount_not_met',
                'reason', '최소 주문 금액 조건을 충족하지 않습니다.'
            );
        END IF;

        -- 8-8) discount_type 허용값 검증
        IF v_coupon.discount_type NOT IN ('percent', 'percentage', 'fixed', 'amount') THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_discount_type',
                'reason', '지원되지 않는 할인 유형입니다.'
            );
        END IF;

        -- 8-9) discount_value 및 max_discount 음수/NULL 차단 검증
        IF v_coupon.discount_value IS NULL OR v_coupon.discount_value < 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_discount_value',
                'reason', '쿠폰 할인 값이 올바르지 않습니다.'
            );
        END IF;

        IF v_coupon.max_discount IS NOT NULL AND v_coupon.max_discount < 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_max_discount',
                'reason', '쿠폰 최대 할인 금액이 올바르지 않습니다.'
            );
        END IF;

        -- 8-10) 할인 금액 연산
        IF v_coupon.discount_type IN ('percent', 'percentage') THEN
            v_discount_applied := v_base_amount * (v_coupon.discount_value / 100.0);
            IF v_coupon.max_discount IS NOT NULL THEN
                v_discount_applied := LEAST(v_discount_applied, v_coupon.max_discount);
            END IF;
        ELSIF v_coupon.discount_type IN ('fixed', 'amount') THEN
            v_discount_applied := v_coupon.discount_value;
        END IF;
    ELSE
        -- 3-B 범위에서는 쿠폰이 지정되지 않은 경우 자동 plan_promotions 연산을 스킵합니다.
        v_discount_applied := 0.00;
    END IF;

    -- 할인 상한선 및 최종 수납 금액 연산 (0 미만 불가)
    v_discount_applied := LEAST(v_discount_applied, v_base_amount);
    v_final_amount := GREATEST(0.00, v_base_amount - v_discount_applied);

    -- 9. 최종 결제 금액 정밀 대조 검증 (클라이언트 조작 및 동기화 불일치 차단)
    IF abs(p_expected_final_amount - v_final_amount) > 0.01 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'amount_mismatch',
            'reason', '결제 금액 검증 실패: 서버 계산 금액(' || v_final_amount || '원)과 요청된 결제 금액(' || p_expected_final_amount || '원)이 일치하지 않습니다.'
        );
    END IF;

    -- 10. 사용자 프로필 존재 여부 검증 (profiles.user_id 기준)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE user_id = v_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'profile_not_found',
            'reason', '사용자 프로필 정보를 찾을 수 없습니다.'
        );
    END IF;

    -- 11. 원자적 데이터 쓰기 작업 (ACID 트랜잭션 보장)
    -- 11-1) 기존 활성 구독 비활성화 (status = 'cancelled')
    UPDATE public.subscriptions
    SET status = 'cancelled', updated_at = now()
    WHERE user_id = v_user_id AND status = 'active';

    -- 11-2) 신규 구독 생성
    INSERT INTO public.subscriptions (
        user_id,
        plan,
        status,
        starts_at,
        ends_at,
        payment_method,
        billing_cycle,
        coupon_id,
        base_amount,
        discount_amount,
        paid_amount,
        paddle_subscription_id,
        paddle_customer_id
    ) VALUES (
        v_user_id,
        p_plan,
        'active',
        now(),
        v_ends_at,
        p_payment_method,
        p_billing_cycle,
        p_coupon_id,
        v_base_amount,
        v_discount_applied,
        v_final_amount,
        p_paddle_subscription_id,
        p_paddle_customer_id
    ) RETURNING id INTO v_subscription_id;

    -- 11-3) 쿠폰 적용 후 소진 및 지갑 마킹
    IF p_coupon_id IS NOT NULL THEN
        -- 사용 기록 생성
        INSERT INTO public.coupon_usages (
            user_id,
            coupon_id,
            subscription_id,
            discount_applied
        ) VALUES (
            v_user_id,
            p_coupon_id,
            v_subscription_id,
            v_discount_applied
        );

        -- 지갑의 보유 쿠폰 상태 갱신 (직접 수동 입력 시 매칭 행 없으므로 스킵됨)
        UPDATE public.user_coupons
        SET is_used = true, used_at = now()
        WHERE user_id = v_user_id AND coupon_id = p_coupon_id AND is_used = false;
    END IF;

    -- 11-4) 사용자 프로필의 멤버십 플랜 상태 동기화 (profiles.user_id = auth.uid() 기준)
    UPDATE public.profiles
    SET plan = p_plan
    WHERE user_id = v_user_id;

    -- 12. 최종 성공 응답 반환
    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'paid_amount', v_final_amount
    );
END;
$$;

-- 3. 기본 PUBLIC / anon 실행 권한 회수 및 authenticated 역할 권한 부여
REVOKE EXECUTE ON FUNCTION public.complete_subscription_checkout(TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_subscription_checkout(TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_subscription_checkout(TEXT, TEXT, UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
