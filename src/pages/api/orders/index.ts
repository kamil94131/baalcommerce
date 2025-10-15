import type { APIContext } from "astro";
import { z } from "zod";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { CreateOrderCommand } from "../../../types";

export const prerender = false;

const QuerySchema = z.object({
  view: z.enum(["bought", "sold"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  // Validate query params
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

  const { view, limit, offset, sortBy, order } = validationResult.data;

  try {
    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("Profiles")
      .select("id")
      .eq("userId", DEFAULT_USER_ID)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Profile not found for current user." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const profileId = userProfile.id;

    // Build query
    let query = supabase
      .from("Orders")
      .select("*", { count: "exact" });

    // Apply view filter
    if (view === 'bought') {
        query = query.eq('buyerId', profileId);
    } else if (view === 'sold') {
        query = query.eq('sellerId', profileId);
    } else {
        query = query.or(`buyerId.eq.${profileId},sellerId.eq.${profileId}`);
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: order === "asc" })
                 .range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase error in GET /orders:", error.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Construct and return response
    const responsePayload = {
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in GET /orders:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const CreateOrderSchema = z.object({
  offerId: z.number().int().positive(),
  courierId: z.number().int().positive(),
});

export async function POST(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  // Validate body
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

  const { offerId, courierId } = validationResult.data;

  try {
    const { data, error } = await supabase.rpc("create_order_and_update_offer", {
      p_offer_id: offerId,
      p_courier_id: courierId,
      p_buyer_user_id: DEFAULT_USER_ID,
    });

    if (error) {
      console.error("Supabase RPC error in POST /orders:", error.message);
      
      // Translate custom DB errors to HTTP status codes
      if (error.code === 'P0001') { // Offer not found
        return new Response(JSON.stringify({ error: "Offer not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      if (error.code === 'P0002') { // Buyer profile not found
        return new Response(JSON.stringify({ error: "Unauthorized: Buyer profile not found" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      if (error.code === 'P0003') { // Offer not active
        return new Response(JSON.stringify({ error: "Conflict: Offer is not active" }), { status: 409, headers: { "Content-Type": "application/json" } });
      }
      if (error.code === 'P0004') { // Cannot buy own offer
        return new Response(JSON.stringify({ error: "Bad Request: Cannot buy your own offer" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      // Generic error for other DB issues
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // The function returns an array with a single object: { j: <the_new_order_json> }
    if (!data || data.length === 0 || !data[0].j) {
        console.error("Unexpected response from RPC function in POST /orders");
        return new Response(JSON.stringify({ error: "Internal Server Error: Failed to retrieve created order." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const newOrder = data[0].j;

    return new Response(JSON.stringify(newOrder), { status: 201, headers: { "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in POST /orders:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
