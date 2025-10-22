import { supabaseClient } from "@/db/supabase.client.ts";
import type { CreateOrderCommand, OrderDto } from "@/types.ts";

interface PaginationOptions {
    view?: 'bought' | 'sold';
    limit: number;
    offset: number;
    sortBy: string;
    order: 'asc' | 'desc';
}

interface PaginatedOrders {
    data: OrderDto[];
    total: number;
}

class OrderServiceController {
    private supabase = supabaseClient;

    async getOrders(userId: string, options: PaginationOptions): Promise<PaginatedOrders> {
        const { view, limit, offset, sortBy, order } = options;

        // 1. Get user's profile ID
        const { data: userProfile, error: profileError } = await this.supabase
            .from("Profiles")
            .select("id")
            .eq("userId", userId)
            .single();

        if (profileError || !userProfile) {
            throw new Error("ProfileNotFound");
        }
        const userId = userProfile.userId;

        // 2. Build and execute query
        let query = this.supabase.from("Orders").select("*", { count: "exact" });

        if (view === 'bought') {
            query = query.eq('buyerId', userId);
        } else if (view === 'sold') {
            query = query.eq('sellerId', userId);
        } else {
            query = query.or(`buyerId.eq.${userId},sellerId.eq.${userId}`);
        }

        query = query.order(sortBy, { ascending: order === "asc" })
                     .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error("Supabase error in getOrders:", error.message);
            throw new Error("Database query failed");
        }

        return {
            data: data || [],
            total: count || 0,
        };
    }

    async createOrder(userId: string, command: CreateOrderCommand): Promise<OrderDto> {
        const { data, error } = await this.supabase.rpc("create_order_and_update_offer", {
            p_offer_id: command.offerId,
            p_courier_id: command.courierId,
            p_buyer_user_id: userId,
        });

        if (error) {
            console.error("Supabase RPC error in createOrder:", error.message);
            
            // Translate custom DB errors to specific service errors
            switch (error.code) {
                case 'P0001': // Offer not found
                    throw new Error("OfferNotFound");
                case 'P0002': // Buyer profile not found
                    throw new Error("ProfileNotFound");
                case 'P0003': // Offer not active
                    throw new Error("OfferNotActive");
                case 'P0004': // Cannot buy own offer
                    throw new Error("CannotBuyOwnOffer");
                default:
                    throw new Error("OrderCreationFailed");
            }
        }

        // The function returns an array with a single object: { j: <the_new_order_json> }
        if (!data || data.length === 0 || !data[0].j) {
            console.error("Unexpected response from RPC function in createOrder");
            throw new Error("OrderCreationFailed: Unexpected RPC response");
        }
        
        return data[0].j as OrderDto;
    }
}

export const OrderService = new OrderServiceController();
