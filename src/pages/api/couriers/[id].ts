import type { APIContext } from "astro";
import { z } from "zod";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

const IdSchema = z.coerce.number().int().positive();

export async function DELETE(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  // Validate ID
  const id = context.params.id;
  const idValidationResult = IdSchema.safeParse(id);
  if (!idValidationResult.success) {
    return new Response(JSON.stringify({ error: "Invalid ID parameter." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const validatedId = idValidationResult.data;

  try {
    // Authorize user: must have 'gomez' role
    const { data: hasRole, error: rpcError } = await supabase.rpc("has_role", {
      role_name: "gomez",
    });

    if (rpcError || !hasRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: User does not have the required 'gomez' role." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete courier
    const { error: deleteError, count } = await supabase
      .from("Couriers")
      .delete({ count: 'exact' })
      .eq("id", validatedId);

    if (deleteError) {
      // Handle foreign key violation
      if (deleteError.code === '23503') { // foreign_key_violation
        return new Response(
          JSON.stringify({ error: `Conflict: Courier with ID ${validatedId} is associated with existing orders and cannot be deleted.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      console.error(`Supabase error during DELETE /couriers/${validatedId}:`, deleteError.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Check if a row was actually deleted
    if (count === 0) {
        return new Response(JSON.stringify({ error: `Courier with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    return new Response(null, { status: 204 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error(`Unexpected error in DELETE /couriers/${validatedId}:`, errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
