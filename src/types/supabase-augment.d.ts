import type { Database as BaseDB } from './database';

export type Database = BaseDB;

/**
 * Merge Utility
 * - 목적: 기존 인터페이스의 특정 키를 새로운 타입으로 안전하게 덮어쓰기 위함 (Intersection의 never 이슈 해결)
 */
type Merge<T, U> = Omit<T, keyof U> & U;

export type DatabaseWithRPC = Merge<
  Database,
  {
    public: Merge<
      Database['public'],
      {
        Tables: Merge<
          Database['public']['Tables'],
          {
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
            // Direct Chat Tables
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
            // Commerce tables
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
                options: any; // Record<string, string>
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
            // Payment tables
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
            subscriptions: {
              Row: {
                id: string;
                user_id: string;
                plan: string;
                status: string;
                starts_at: string;
                ends_at: string;
                created_at: string;
              };
              Insert: {
                id?: string;
                user_id: string;
                plan: string;
                status: string;
                starts_at: string;
                ends_at: string;
                created_at?: string;
              };
              Update: {
                id?: string;
                user_id?: string;
                plan?: string;
                status?: string;
                starts_at?: string;
                ends_at?: string;
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
            // Pathing existing tables using Merge to ensure override
            reports: Merge<
              Database['public']['Tables']['reports'],
              {
                Row: Merge<
                  Database['public']['Tables']['reports']['Row'],
                  {
                    reported_message_ids: string[];
                    report_context_url: string | null;
                  }
                >;
              }
            >;
            posts: Merge<
              Database['public']['Tables']['posts'],
              {
                Row: Database['public']['Tables']['posts']['Row'] & {
                  deleted_at: string | null;
                };
                Insert: Database['public']['Tables']['posts']['Insert'] & {
                  deleted_at?: string | null;
                };
                Update: Database['public']['Tables']['posts']['Update'] & {
                  deleted_at?: string | null;
                };
              }
            >;
            profiles: Merge<
              Database['public']['Tables']['profiles'],
              {
                Row: Database['public']['Tables']['profiles']['Row'] & {
                  is_admin: boolean;
                };
                Insert: Database['public']['Tables']['profiles']['Insert'] & {
                  is_admin?: boolean;
                };
                Update: Database['public']['Tables']['profiles']['Update'] & {
                  is_admin?: boolean;
                };
              }
            >;
          }
        >;
        Functions: Merge<
          Database['public']['Functions'],
          {
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
            check_promotion_code: {
              Args: { p_code: string; p_user_id: string };
              Returns: {
                is_valid: boolean;
                reason: string | null;
                promotion: any | null;
              };
            };
          }
        >;
      }
    >;
  }
>;
