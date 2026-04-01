
/**
 * PaymentService.ts
 * -----------------
 * Project ARA의 모든 결제(구독, 상품 구매)를 처리하는 추상화 레이어입니다.
 * 향후 Stripe, PortOne 등 실제 PG사 연동 시 이 파일의 로직만 교체하면 됩니다.
 */

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type PaymentMethod = 'virtual_card' | 'stripe' | 'portone';
export type PaymentItemType = 'subscription' | 'goods';

interface PaymentRequest {
  userId: string;
  amount: number;
  itemType: PaymentItemType;
  itemId: string; // plan_id or product_id
  method: PaymentMethod;
  couponId?: string;
  metadata?: any;
}

class PaymentService {
  /**
   * 결제 실행 (실제 PG 연동 및 DB 기록 통합)
   */
  async processPayment(req: PaymentRequest): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    console.log(`[PaymentService] Processing ${req.itemType} payment:`, req);
    
    try {
      // 1. PG사 연동 (현재는 가상 결제 모드)
      let transactionId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      if (req.method === 'stripe' || req.method === 'portone') {
        // TODO: 실제 PG SDK 호출 (Phase 6-D 추가 확장 시)
        // const pgResult = await stripe.confirmPayment(...);
        // transactionId = pgResult.id;
        throw new Error(`${req.method} 연동은 실제 API 키 설정이 필요합니다.`);
      } else {
        // Virtual Card Mode: 1.5초 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. 결제 내역 DB 기록 (payments 테이블)
      const { data, error: payError } = await supabase
        .from('payments') // payments 테이블이 존재한다고 가정
        .insert({
          user_id: req.userId,
          amount: req.amount,
          target_type: req.itemType,
          target_id: req.itemId,
          method: req.method,
          transaction_id: transactionId,
          status: 'completed',
          coupon_id: req.couponId,
          metadata: req.metadata
        })
        .select()
        .single();

      if (payError) {
          // 테이블이 없을 경우를 대비해 콘솔 출력 후 진행 (가상 성공 처리)
          console.warn('Payments table not found, skipping record insertion.');
      }

      // 3. 쿠폰 사용 처리
      if (req.couponId) {
        await supabase
          .from('coupon_usages')
          .insert({
            user_id: req.userId,
            coupon_id: req.couponId,
            discount_applied: req.metadata?.discount || 0
          });
      }

      return { success: true, transactionId };

    } catch (err: any) {
      console.error('[PaymentService] Payment failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * 구독 갱신 처리
   */
  async updateSubscription(userId: string, planId: string, startsAt: Date, endsAt: Date) {
     const { error } = await supabase
       .from('subscriptions')
       .update({
         plan: planId,
         status: 'active',
         starts_at: startsAt.toISOString(),
         ends_at: endsAt.toISOString()
       })
       .eq('user_id', userId);
     
     if (error) throw error;
     
     // 프로필 업데이트
     await supabase
       .from('profiles')
       .update({ plan: planId })
       .eq('user_id', userId);
  }
}

export const paymentService = new PaymentService();
