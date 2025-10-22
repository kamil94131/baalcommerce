import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import type {CreateOfferCommand} from "@/types.ts";
import {OfferService} from "@/lib/services/offer.service.ts";
import {CreateOfferSchema, GetOffersQuerySchema as QuerySchema} from "./offer.schema";

export const prerender = false;



export async function GET(context: APIContext): Promise<Response> {
  // 1. Validate query params
  const queryParams = Object.fromEntries(context.url.searchParams.entries());
  const validationResult = QuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid query parameters",
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { limit, offset } = validationResult.data;

  // 2. Call service
  try {
    const { data, total } = await OfferService.getOffers(validationResult.data);

    // 3. Construct and return response
    const responsePayload = {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Unexpected error in GET /offers:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



export async function POST(context: APIContext): Promise<Response> {
  // 1. Validate body
  let requestData: CreateOfferCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = CreateOfferSchema.safeParse(requestData);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Call service
  try {
    const newOffer = await OfferService.createOffer(
      DEFAULT_USER_ID,
      validationResult.data
    );
    return new Response(JSON.stringify(newOffer), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'ProfileNotFound') {
      return new Response(
        JSON.stringify({ error: "Cannot create offer: User profile not found." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Unexpected error in POST /offers:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
