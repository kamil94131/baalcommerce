import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import {CourierService} from "@/lib/services/courier.service.ts";
import {IdSchema} from "../common.schema";

export const prerender = false;

export async function DELETE(context: APIContext): Promise<Response> {
  // 1. Validate ID
  const id = context.params.id;
  const idValidationResult = IdSchema.safeParse(id);
  if (!idValidationResult.success) {
    return new Response(JSON.stringify({ error: "Invalid ID parameter." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const validatedId = idValidationResult.data;

  // 2. Call service
  try {
    await CourierService.deleteCourier(DEFAULT_USER_ID, validatedId);
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'Forbidden':
          return new Response(JSON.stringify({ error: "Forbidden: User does not have the required 'gomez' role." }), { status: 403, headers: { "Content-Type": "application/json" } });
        case 'NotFound':
          return new Response(JSON.stringify({ error: `Courier with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
        case 'Conflict':
          return new Response(JSON.stringify({ error: `Conflict: Courier with ID ${validatedId} is associated with existing orders and cannot be deleted.` }), { status: 409, headers: { "Content-Type": "application/json" } });
        default:
          break;
      }
    }
    console.error(`Unexpected error in DELETE /couriers/${validatedId}:`, error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}