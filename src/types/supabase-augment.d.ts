import type { Database as BaseDB } from './database';

// 1. 확장 테이블 정의 (Augmented Tables)
type AugmentedTables = {
  site_config: {
    Row: {
      id: number;
      notice_enabled: boolean;
      notice_text: string | null;
      notice_color: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled: boolean;
      maintenance_message: string | null;
      maintenance_end_time: string | null;
      site_title: string;
      site_description: string | null;
      site_logo_url: string | null;
      sec_ip_restriction: boolean;
      sec_ip_whitelist: string[];
      updated_at: string;
    };
    Insert: {
      id?: number;
      notice_enabled?: boolean;
      notice_text?: string | null;
      notice_color?: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled?: boolean;
      maintenance_message?: string | null;
      maintenance_end_time?: string | null;
      site_title?: string;
      site_description?: string | null;
      site_logo_url?: string | null;
      sec_ip_restriction?: boolean;
      sec_ip_whitelist?: string[];
      updated_at?: string;
    };
    Update: {
      id?: number;
      notice_enabled?: boolean;
      notice_text?: string | null;
      notice_color?: 'blue' | 'red' | 'amber' | 'emerald' | null;
      maintenance_enabled?: boolean;
      maintenance_message?: string | null;
      maintenance_end_time?: string | null;
      site_title?: string;
      site_description?: string | null;
      site_logo_url?: string | null;
      sec_ip_restriction?: boolean;
      sec_ip_whitelist?: string[];
      updated_at?: string;
    };
  };
  feedback: {
    Row: {
      area: string | null;
      category: string | null;
      content: string;
      created_at: string;
      id: string;
      page_path: string | null;
      rating: number | null;
      user_id: string | null;
      status: 'unread' | 'read' | 'replied' | null;
      admin_reply: string | null;
      replied_at: string | null;
    };
    Insert: {
      area?: string | null;
      category?: string | null;
      content: string;
      created_at?: string;
      id?: string;
      page_path?: string | null;
      rating?: number | null;
      user_id?: string | null;
      status?: 'unread' | 'read' | 'replied' | null;
      admin_reply?: string | null;
      replied_at?: string | null;
    };
    Update: {
      area?: string | null;
      category?: string | null;
      content?: string;
      created_at?: string;
      id?: string;
      page_path?: string | null;
      rating?: number | null;
      user_id?: string | null;
      status?: 'unread' | 'read' | 'replied' | null;
      admin_reply?: string | null;
      replied_at?: string | null;
    };
    Relationships: [];
  };
  direct_chats: {
    Row: {
      id: string;
      user1_id: string;
      user2_id: string;
      user1_active: boolean;
      user2_active: boolean;
      user1_notified: boolean;
      user2_notified: boolean;
      user1_left_at: string | null;
      user2_left_at: string | null;
      last_message_at: string | null;
      created_at: string;
      is_active: boolean;
    };
    Insert: {
      id?: string;
      user1_id: string;
      user2_id: string;
      user1_active?: boolean;
      user2_active?: boolean;
      user1_notified?: boolean;
      user2_notified?: boolean;
      user1_left_at?: string | null;
      user2_left_at?: string | null;
      last_message_at?: string | null;
      created_at?: string;
      is_active?: boolean;
    };
    Update: {
      id?: string;
      user1_id?: string;
      user2_id?: string;
      user1_active?: boolean;
      user2_active?: boolean;
      user1_notified?: boolean;
      user2_notified?: boolean;
      user1_left_at?: string | null;
      user2_left_at?: string | null;
      last_message_at?: string | null;
      created_at?: string;
      is_active?: boolean;
    };
  };
  direct_messages: {
    Row: {
      id: string;
      chat_id: string;
      sender_id: string;
      content: string;
      is_read: boolean;
      read_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      chat_id: string;
      sender_id: string;
      content: string;
      is_read?: boolean;
      read_at?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      chat_id?: string;
      sender_id?: string;
      content?: string;
      is_read?: boolean;
      read_at?: string | null;
      created_at?: string;
    };
  };
  direct_message_attachments: {
    Row: {
      id: string;
      message_id: string;
      type: 'image' | 'video' | 'file';
      url: string;
      name: string | null;
      width: number | null;
      height: number | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      message_id: string;
      type: 'image' | 'video' | 'file';
      url: string;
      name?: string | null;
      width?: number | null;
      height?: number | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      message_id?: string;
      type?: 'image' | 'video' | 'file';
      url?: string;
      name?: string | null;
      width?: number | null;
      height?: number | null;
      created_at?: string;
    };
  };
  user_blocks: {
    Row: {
      id: string;
      blocker_id: string;
      blocked_id: string;
      created_at: string;
      ended_at: string | null;
    };
    Insert: {
      id?: string;
      blocker_id: string;
      blocked_id: string;
      created_at?: string;
      ended_at?: string | null;
    };
    Update: {
      id?: string;
      blocker_id?: string;
      blocked_id?: string;
      created_at?: string;
      ended_at?: string | null;
    };
  };
  products: {
    Row: {
      id: string;
      name: string;
      category: string;
      price: number;
      discount_percent: number;
      sale_price: number;
      summary: string;
      description: string;
      status: 'draft' | 'active' | 'soldout' | 'archived';
      main_image_url: string;
      gallery_urls: string[];
      stock: number;
      badge_new: boolean;
      badge_best: boolean;
      badge_sale: boolean;
      shipping_fee: number;
      free_shipping_threshold: number;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      category: string;
      price: number;
      discount_percent?: number;
      sale_price?: number;
      summary?: string;
      description?: string;
      status?: 'draft' | 'active' | 'soldout' | 'archived';
      main_image_url?: string;
      gallery_urls?: string[];
      stock?: number;
      badge_new?: boolean;
      badge_best?: boolean;
      badge_sale?: boolean;
      shipping_fee?: number;
      free_shipping_threshold?: number;
      is_hidden?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      category?: string;
      price?: number;
      discount_percent?: number;
      sale_price?: number;
      summary?: string;
      description?: string;
      status?: 'draft' | 'active' | 'soldout' | 'archived';
      main_image_url?: string;
      gallery_urls?: string[];
      stock?: number;
      badge_new?: boolean;
      badge_best?: boolean;
      badge_sale?: boolean;
      shipping_fee?: number;
      free_shipping_threshold?: number;
      is_hidden?: boolean;
      created_at?: string;
      updated_at?: string;
    };
  };
  product_options: {
    Row: {
      id: string;
      product_id: string;
      name: string;
      values: string[];
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      name: string;
      values: string[];
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      name?: string;
      values?: string[];
      created_at?: string;
    };
  };
  product_variants: {
    Row: {
      id: string;
      product_id: string;
      options: any;
      stock: number;
      additional_price: number;
      sku: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      options: any;
      stock?: number;
      additional_price?: number;
      sku: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      options?: any;
      stock?: number;
      additional_price?: number;
      sku?: string;
      created_at?: string;
    };
  };
  product_reviews: {
    Row: {
      id: string;
      product_id: string;
      user_id: string | null;
      user_name: string;
      user_avatar_url: string | null;
      rating: number;
      content: string;
      image_urls: string[] | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      user_id?: string | null;
      user_name: string;
      user_avatar_url?: string | null;
      rating: number;
      content: string;
      image_urls?: string[] | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      product_id?: string;
      user_id?: string | null;
      user_name?: string;
      user_avatar_url?: string | null;
      rating?: number;
      content?: string;
      image_urls?: string[] | null;
      created_at?: string;
    };
  };
  product_review_likes: {
    Row: {
      id: string;
      review_id: string;
      user_id: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      review_id: string;
      user_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      review_id?: string;
      user_id?: string;
      created_at?: string;
    };
  };
  payments: {
    Row: {
      id: string;
      user_id: string;
      amount: number;
      target_type: string;
      target_id: string;
      method: string;
      transaction_id: string;
      status: string;
      coupon_id: string | null;
      metadata: any | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      amount: number;
      target_type: string;
      target_id: string;
      method: string;
      transaction_id: string;
      status: string;
      coupon_id?: string | null;
      metadata?: any | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      amount?: number;
      target_type?: string;
      target_id?: string;
      method?: string;
      transaction_id?: string;
      status?: string;
      coupon_id?: string | null;
      metadata?: any | null;
      created_at?: string;
    };
  };
  coupon_usages: {
    Row: {
      id: string;
      user_id: string;
      coupon_id: string;
      discount_applied: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      coupon_id: string;
      discount_applied: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      coupon_id?: string;
      discount_applied?: number;
      created_at?: string;
    };
  };
  orders: {
    Row: {
      id: string;
      user_id: string;
      status: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      status: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      status?: string;
      created_at?: string;
    };
  };
  order_items: {
    Row: {
      id: string;
      order_id: string;
      product_id: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      product_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      product_id?: string;
      created_at?: string;
    };
  };
  plan_configs: {
    Row: {
      id: string;
      name: string;
      display_name: string;
      description: string | null;
      monthly_price: number;
      yearly_price: number;
      is_active: boolean;
      is_popular: boolean;
      sort_order: number;
      color: string | null;
      features: { label: string; active: boolean }[];
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      display_name: string;
      description?: string | null;
      monthly_price?: number;
      yearly_price?: number;
      is_active?: boolean;
      is_popular?: boolean;
      sort_order?: number;
      color?: string | null;
      features?: { label: string; active: boolean }[];
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      display_name?: string;
      description?: string | null;
      monthly_price?: number;
      yearly_price?: number;
      is_active?: boolean;
      is_popular?: boolean;
      sort_order?: number;
      color?: string | null;
      features?: { label: string; active: boolean }[];
      created_at?: string;
      updated_at?: string;
    };
  };
  plan_promotions: {
    Row: {
      id: string;
      plan_id: string | null;
      label: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      is_active: boolean;
      starts_at: string | null;
      ends_at: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      plan_id?: string | null;
      label: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      is_active?: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      plan_id?: string | null;
      label?: string;
      discount_type?: 'percentage' | 'fixed';
      discount_value?: number;
      is_active?: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
      created_at?: string;
    };
  };
  // 기존 테이블 확장

  reports: Omit<BaseDB['public']['Tables']['reports'], 'Row'> & {
    Row: BaseDB['public']['Tables']['reports']['Row'] & {
      reported_message_ids: string[];
      report_context_url: string | null;
    };
  };
  posts: Omit<BaseDB['public']['Tables']['posts'], 'Row' | 'Insert' | 'Update'> & {
    Row: BaseDB['public']['Tables']['posts']['Row'] & {
      deleted_at: string | null;
    };
    Insert: BaseDB['public']['Tables']['posts']['Insert'] & {
      deleted_at?: string | null;
    };
    Update: BaseDB['public']['Tables']['posts']['Update'] & {
      deleted_at?: string | null;
    };
  };
};

// 2. 확장 함수 정의 (Augmented Functions)
type AugmentedFunctions = {
  email_exists: {
    Args: { _email: string };
    Returns: boolean;
  };
  nickname_exists: {
    Args: { _nickname: string };
    Returns: boolean;
  };
  validate_coupon: {
    Args: { p_code: string; p_user_id: string };
    Returns: {
      is_valid: boolean;
      reason: string | null;
      promotion: {
        id: string;
        name: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
      } | null;
    };
  };
  check_user_subscription: {
    Args: { p_user_id: string };
    Returns: void;
  };
  expire_subscriptions: {
    Args: Record<string, never>;
    Returns: void;
  };
  check_promotion_code: {
    Args: { p_code: string; p_user_id: string };
    Returns: {
      is_valid: boolean;
      reason: string | null;
      promotion: any | null;
    };
  };
};

// 3. 최종 DatabaseWithRPC 구성
export type DatabaseWithRPC = Omit<BaseDB, 'public'> & {
  public: Omit<BaseDB['public'], 'Tables' | 'Functions'> & {
    Tables: BaseDB['public']['Tables'] & AugmentedTables;
    Functions: BaseDB['public']['Functions'] & AugmentedFunctions;
  };
};

export type Database = DatabaseWithRPC;
