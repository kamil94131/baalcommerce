import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import {OfferService} from "@/lib/services/offer.service.ts";
import type {UpdateOfferCommand} from "@/types.ts";
import {IdSchema} from "../common.schema";
import {UpdateOfferSchema} from "./offer.schema";

export const prerender = false;



export async function GET(context: APIContext): Promise<Response> {
  // 1. Validate ID
  const id = context.params.id;
  const validationResult = IdSchema.safeParse(id);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid ID parameter. Must be a positive integer.",
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const validatedId = validationResult.data;

  // 2. Call service
  try {
    const offer = await OfferService.getOfferById(validatedId);
    return new Response(JSON.stringify(offer), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NotFound') {
      return new Response(
        JSON.stringify({
          error: `Offer with ID ${validatedId} not found or is not active.`,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error(`Unexpected error in GET /offers/${validatedId}:`, error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



export async function PATCH(context: APIContext): Promise<Response> {
  // 1. Validate ID and Body
  const id = context.params.id;
  const idValidationResult = IdSchema.safeParse(id);
  if (!idValidationResult.success) {
    return new Response(JSON.stringify({ error: "Invalid ID parameter." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const validatedId = idValidationResult.data;

  let requestData: UpdateOfferCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (Object.keys(requestData).length === 0) {
    return new Response(JSON.stringify({ error: "Request body is empty." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const bodyValidationResult = UpdateOfferSchema.safeParse(requestData);
  if (!bodyValidationResult.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: bodyValidationResult.error.flatten() }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // 2. Call service
  try {
    const updatedOffer = await OfferService.updateOffer(
      DEFAULT_USER_ID,
      validatedId,
      bodyValidationResult.data
    );
    return new Response(JSON.stringify(updatedOffer), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'ProfileNotFound':
          return new Response(JSON.stringify({ error: "Unauthorized: Profile not found for current user." }), { status: 401, headers: { "Content-Type": "application/json" } });
        case 'NotFound':
          return new Response(JSON.stringify({ error: `Offer with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
        case 'Forbidden':
          return new Response(JSON.stringify({ error: "Forbidden: You are not the author of this offer." }), { status: 403, headers: { "Content-Type": "application/json" } });
        case 'Conflict':
          return new Response(JSON.stringify({ error: "Conflict: Offer cannot be updated because it is not in 'CREATED' status." }), { status: 409, headers: { "Content-Type": "application/json" } });
        default:
          // Fallthrough for "Update failed" or "Database query failed"
          break;
      }
    }
    console.error(`Unexpected error in PATCH /offers/${validatedId}:`, error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

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
    await OfferService.deleteOffer(DEFAULT_USER_ID, validatedId);
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'ProfileNotFound':
          return new Response(JSON.stringify({ error: "Unauthorized: Profile not found for current user." }), { status: 401, headers: { "Content-Type": "application/json" } });
        case 'NotFound':
          return new Response(JSON.stringify({ error: `Offer with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
        case 'Forbidden':
          return new Response(JSON.stringify({ error: "Forbidden: You are not the author of this offer." }), { status: 403, headers: { "Content-Type": "application/json" } });
        case 'Conflict':
          return new Response(JSON.stringify({ error: "Conflict: Offer cannot be deleted because it is not in 'CREATED' status." }), { status: 409, headers: { "Content-Type": "application/json" } });
        default:
          break;
      }
    }
    console.error(`Unexpected error in DELETE /offers/${validatedId}:`, error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
