import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import type {CreateOrderCommand} from "@/types.ts";
import {OrderService} from "@/lib/services/order.service.ts";
import {CreateOrderSchema, GetOrdersQuerySchema as QuerySchema} from "./order.schema";

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
    const { data, total } = await OrderService.getOrders(
      DEFAULT_USER_ID,
      validationResult.data
    );

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
    if (error instanceof Error && error.message === 'ProfileNotFound') {
        return new Response(
            JSON.stringify({ error: "Unauthorized: Profile not found for current user." }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
    console.error("Unexpected error in GET /orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



export async function POST(context: APIContext): Promise<Response> {
  // 1. Validate body
  let requestData: CreateOrderCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const validationResult = CreateOrderSchema.safeParse(requestData);
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
    const newOrder = await OrderService.createOrder(
      DEFAULT_USER_ID,
      validationResult.data
    );
    return new Response(JSON.stringify(newOrder), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'OfferNotFound':
          return new Response(JSON.stringify({ error: "Offer not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        case 'ProfileNotFound':
          return new Response(JSON.stringify({ error: "Unauthorized: Buyer profile not found" }), { status: 401, headers: { "Content-Type": "application/json" } });
        case 'OfferNotActive':
          return new Response(JSON.stringify({ error: "Conflict: Offer is not active" }), { status: 409, headers: { "Content-Type": "application/json" } });
        case 'CannotBuyOwnOffer':
          return new Response(JSON.stringify({ error: "Bad Request: Cannot buy your own offer" }), { status: 400, headers: { "Content-Type": "application/json" } });
        default: return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    console.error("Unexpected error in POST /orders:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
