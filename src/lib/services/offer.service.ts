import { supabaseClient } from "@/db/supabase.client.ts";
import type { CreateOfferCommand, OfferDto, UpdateOfferCommand } from "@/types.ts";

interface PaginationOptions {
    limit: number;
    offset: number;
    sortBy: string;
    order: 'asc' | 'desc';
}

interface PaginatedOffers {
    data: OfferDto[];
    total: number;
}

class OfferServiceController {
    private supabase = supabaseClient;

    async getOffers(options: PaginationOptions): Promise<PaginatedOffers> {
        const { limit, offset, sortBy, order } = options;

        const { data, error, count } = await this.supabase
            .from("Offers")
            .select("*", { count: "exact" })
            .eq("status", "CREATED")
            .order(sortBy, { ascending: order === "asc" })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Supabase error in getOffers:", error.message);
            throw new Error("Database query failed");
        }

        return {
            data: data || [],
            total: count || 0,
        };
    }

    async getOfferById(id: number): Promise<OfferDto> {
        const { data: offer, error } = await this.supabase
            .from("Offers")
            .select("*")
            .eq("id", id)
            .eq("status", "CREATED")
            .single();

        if (error && error.code !== "PGRST116") {
            console.error(`Supabase error in getOfferById for id ${id}:`, error.message);
            throw new Error("Database query failed");
        }

        if (!offer) {
            throw new Error("NotFound");
        }

        return offer;
    }

    async createOffer(userId: string, offerData: CreateOfferCommand): Promise<OfferDto> {
        // 1. Get seller's profile
        const { data: sellerProfile, error: profileError } = await this.supabase
            .from("Profiles")
            .select("id, name, camp")
            .eq("userId", userId)
            .single();

        if (profileError || !sellerProfile) {
            throw new Error("ProfileNotFound");
        }

        // 2. Prepare and insert offer
        const offerToInsert = {
            ...offerData,
            sellerId: sellerProfile.id,
            sellerName: sellerProfile.name,
            sellerCamp: sellerProfile.camp,
        };

        const { data: newOffer, error: insertError } = await this.supabase
            .from("Offers")
            .insert(offerToInsert)
            .select()
            .single();

        if (insertError) {
            console.error("Supabase error in createOffer:", insertError.message);
            throw new Error("Insert failed");
        }

        return newOffer;
    }

    async updateOffer(userId: string, offerId: number, updateData: UpdateOfferCommand): Promise<OfferDto> {
        // 1. Fetch user profile and offer in parallel
        const [userProfileRes, offerRes] = await Promise.all([
            this.supabase.from("Profiles").select("id").eq("userId", userId).single(),
            this.supabase.from("Offers").select("sellerId, status").eq("id", offerId).single()
        ]);
    
        const { data: userProfile, error: userProfileError } = userProfileRes;
        const { data: offer, error: offerError } = offerRes;
    
        // 2. Perform checks
        if (userProfileError) {
            throw new Error("ProfileNotFound"); // Or Unauthorized
        }
        if (offerError) {
            throw new Error("NotFound");
        }
        if (offer.sellerId !== userProfile.id) {
            throw new Error("Forbidden");
        }
        if (offer.status !== 'CREATED') {
            throw new Error("Conflict");
        }
    
        // 3. Update offer
        const { data: updatedOffer, error: updateError } = await this.supabase
            .from("Offers")
            .update(updateData)
            .eq("id", offerId)
            .select()
            .single();
    
        if (updateError) {
            console.error(`Supabase error in updateOffer for id ${offerId}:`, updateError.message);
            throw new Error("Update failed");
        }
    
        return updatedOffer;
    }

    async deleteOffer(userId: string, offerId: number): Promise<void> {
        // 1. Fetch user profile and offer in parallel
        const [userProfileRes, offerRes] = await Promise.all([
            this.supabase.from("Profiles").select("id").eq("userId", userId).single(),
            this.supabase.from("Offers").select("sellerId, status").eq("id", offerId).single()
        ]);
    
        const { data: userProfile, error: userProfileError } = userProfileRes;
        const { data: offer, error: offerError } = offerRes;
    
        // 2. Perform checks
        if (userProfileError) {
            throw new Error("ProfileNotFound");
        }
        if (offerError) {
            throw new Error("NotFound");
        }
        if (offer.sellerId !== userProfile.id) {
            throw new Error("Forbidden");
        }
        if (offer.status !== 'CREATED') {
            throw new Error("Conflict");
        }
    
        // 3. Delete offer
        const { error: deleteError } = await this.supabase
            .from("Offers")
            .delete()
            .eq("id", offerId);
    
        if (deleteError) {
            console.error(`Supabase error in deleteOffer for id ${offerId}:`, deleteError.message);
            throw new Error("Delete failed");
        }
    }
}

export const OfferService = new OfferServiceController();
