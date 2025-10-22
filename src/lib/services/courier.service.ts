import { supabaseClient } from "@/db/supabase.client.ts";
import type { CourierDto, CreateCourierCommand } from "@/types.ts";

class CourierServiceController {
    private supabase = supabaseClient;

    async getCouriers(): Promise<CourierDto[]> {
        const { data: couriers, error } = await this.supabase
            .from("Couriers")
            .select("*");

        if (error) {
            console.error("Supabase error in getCouriers:", error.message);
            throw new Error("Database query failed");
        }

        return couriers || [];
    }

    async createCourier(userId: string, courierData: CreateCourierCommand): Promise<CourierDto> {
        // 1. Authorize user: must have 'gomez' role
        const { data: hasRole, error: rpcError } = await this.supabase.rpc("has_role", {
            role_name: "gomez",
        });

        if (rpcError || !hasRole) {
            throw new Error("Forbidden");
        }

        // 2. Insert new courier
        const { data: newCourier, error: insertError } = await this.supabase
            .from("Couriers")
            .insert(courierData)
            .select()
            .single();

        if (insertError) {
            // Handle unique name conflict
            if (insertError.code === '23505') { // unique_violation
                throw new Error("Conflict");
            }
            console.error("Supabase error in createCourier:", insertError.message);
            throw new Error("Insert failed");
        }

        return newCourier;
    }

    async deleteCourier(userId: string, courierId: number): Promise<void> {
        // 1. Authorize user: must have 'gomez' role
        const { data: hasRole, error: rpcError } = await this.supabase.rpc("has_role", {
            role_name: "gomez",
        });

        if (rpcError || !hasRole) {
            throw new Error("Forbidden");
        }

        // 2. Check if courier exists and delete
        const { error: deleteError, count } = await this.supabase
            .from("Couriers")
            .delete({ count: 'exact' })
            .eq("id", courierId);

        if (deleteError) {
            // Handle foreign key violation (courier associated with orders)
            if (deleteError.code === '23503') { // foreign_key_violation
                throw new Error("Conflict");
            }
            console.error(`Supabase error in deleteCourier for id ${courierId}:`, deleteError.message);
            throw new Error("Delete failed");
        }

        // If count is 0, no courier was found with that ID
        if (count === 0) {
            throw new Error("NotFound");
        }
    }
}

export const CourierService = new CourierServiceController();
