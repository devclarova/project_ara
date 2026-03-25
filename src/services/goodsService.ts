import { supabase } from '@/lib/supabase';

export interface Product {
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
    created_at?: string;
    updated_at?: string;
}

export interface ProductOption {
    id?: string;
    product_id?: string;
    name: string;
    values: string[];
}

export interface ProductVariant {
    id?: string;
    product_id?: string;
    options: Record<string, string>;
    stock: number;
    additional_price: number;
    sku?: string;
}

export const goodsService = {
    // 1. Fetch products for list (User Shop & Admin Management)
    async fetchProducts(filters?: {
        category?: string;
        status?: string;
        is_hidden?: boolean;
        searchTerm?: string;
    }) {
        let query = supabase.from('products').select('*');

        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        if (filters?.is_hidden !== undefined) {
            query = query.eq('is_hidden', filters.is_hidden);
        }
        if (filters?.searchTerm) {
            query = query.ilike('name', `%${filters.searchTerm}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as Product[];
    },

    // 2. Fetch single product with options and variants
    async fetchProductById(id: string) {
        const { data: product, error: pError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        
        if (pError) throw pError;
        if (!product) return null;

        const { data: options, error: oError } = await supabase
            .from('product_options')
            .select('*')
            .eq('product_id', id);
        
        if (oError) throw oError;

        const { data: variants, error: vError } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id);
        
        if (vError) throw vError;

        return {
            ...product,
            options: options || [],
            variants: variants || []
        };
    },

    // 3. Create or Update Product (with options/variants)
    async saveProduct(
        productData: Partial<Product>,
        options: ProductOption[] = [],
        variants: ProductVariant[] = []
    ) {
        const isEdit = !!productData.id;
        
        // Step 1: upsert product
        const { data: product, error: pError } = await supabase
            .from('products')
            .upsert([productData])
            .select()
            .single();
        
        if (pError) throw pError;

        // Step 2: Sync options (Delete old and insert new for simplicity, or sync properly)
        if (isEdit) {
            await supabase.from('product_options').delete().eq('product_id', product.id);
        }
        if (options.length > 0) {
            const optionsToInsert = options.map(o => ({
                product_id: product.id,
                name: o.name,
                values: o.values
            }));
            const { error: oError } = await supabase.from('product_options').insert(optionsToInsert);
            if (oError) throw oError;
        }

        // Step 3: Sync variants
        if (isEdit) {
            await supabase.from('product_variants').delete().eq('product_id', product.id);
        }
        if (variants.length > 0) {
            const variantsToInsert = variants.map(v => ({
                product_id: product.id,
                options: v.options,
                stock: v.stock,
                additional_price: v.additional_price,
                sku: v.sku || `GD-${product.id.slice(0, 4)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
            }));
            const { error: vError } = await supabase.from('product_variants').insert(variantsToInsert);
            if (vError) throw vError;
        }

        return product;
    },

    // 4. Update specific fields (e.g. is_hidden, status)
    async updateProductFields(id: string, fields: Partial<Product>) {
        const { data, error } = await supabase
            .from('products')
            .update(fields)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 5. Delete product
    async deleteProduct(id: string) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // 6. Upload Image to Storage
    async uploadImage(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('products').getPublicUrl(filePath);
        return data.publicUrl;
    },

    // 7. Fetch reviews for a product with pagination
    async fetchReviews(productId: string, limit: number = 5, offset: number = 0) {
        let query = supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
        
        if (limit > 0) {
            query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    },

    // 8. Add a review
    async addReview(reviewData: {
        product_id: string;
        user_id?: string;
        user_name: string;
        user_avatar_url?: string;
        rating: number;
        content: string;
        image_urls?: string[];
    }) {
        const { data, error } = await supabase
            .from('product_reviews')
            .insert([reviewData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // 9. Fetch related products (same category, excluding current)
    async fetchRelatedProducts(productId: string, category: string, limit: number = 4) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('is_hidden', false)
            .neq('id', productId)
            .limit(limit);
        
        if (error) throw error;
        return data as Product[];
    },

    // 10. Check if user has purchased the product (Buyer Certification)
    async checkUserPurchased(userId: string, productId: string): Promise<boolean> {
        // orders (completed) -> order_items (product_id)
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                order_items!inner(product_id)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed')
            .eq('order_items.product_id', productId);

        if (error) {
            console.error('checkUserPurchased error:', error);
            return false;
        }

        return data !== null && data.length > 0;
    },

    // 11. Toggle Review Like (Helpful)
    async toggleReviewLike(reviewId: string, userId: string) {
        // Check if already liked
        const { data: existing, error: checkError } = await supabase
            .from('product_review_likes')
            .select('id')
            .eq('review_id', reviewId)
            .eq('user_id', userId)
            .maybeSingle();
        
        if (checkError) throw checkError;

        if (existing) {
            // Unlike
            const { error: deleteError } = await supabase
                .from('product_review_likes')
                .delete()
                .eq('id', existing.id);
            if (deleteError) throw deleteError;
            return { action: 'unliked' };
        } else {
            // Like
            const { error: insertError } = await supabase
                .from('product_review_likes')
                .insert([{ review_id: reviewId, user_id: userId }]);
            if (insertError) throw insertError;
            return { action: 'liked' };
        }
    },

    // 12. Get User's liked reviews for a product
    async fetchMyReviewLikes(userId: string, productId: string) {
        const { data, error } = await supabase
            .from('product_review_likes')
            .select('review_id')
            .eq('user_id', userId)
            .in('review_id', (
                await supabase.from('product_reviews').select('id').eq('product_id', productId)
            ).data?.map(r => r.id) || []);
        
        if (error) throw error;
        return data.map(d => d.review_id);
    }
};
