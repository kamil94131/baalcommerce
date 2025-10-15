import type { APIContext } from "astro";
import { z } from "zod";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { CreateOfferCommand } from "../../../types";

export const prerender = false;

// Zod schema for validating query parameters
const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(context: APIContext): Promise<Response> {
  // Step 2: Handle Query Parameters & Validation
  const queryParams = Object.fromEntries(context.url.searchParams.entries());
  const validationResult = QuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid query parameters",
        details: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { limit, offset, sortBy, order } = validationResult.data;
  const supabase = supabaseClient;

  try {
    // Step 4: Execute Query and Handle Errors
    const { data, error, count } = await supabase
      .from("Offers")
      .select("*", { count: "exact" })
      .eq("status", "CREATED")
      .order(sortBy, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error in GET /offers:", error.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Construct the Response Payload
    const responsePayload = {
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    };

    // Step 6: Return Success Response
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in GET /offers:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const CreateOfferSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().optional(),
  price: z.coerce.number().int().positive("Price must be a positive number."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number."),
});

export async function POST(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  // Step 1: Validate Body
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

  try {
    // Step 2 & 3: Fetch Seller's Profile and Handle Not Found
    const { data: sellerProfile, error: profileError } = await supabase
      .from("Profiles")
      .select("id, name, camp")
      .eq("userId", DEFAULT_USER_ID)
      .single();

    if (profileError || !sellerProfile) {
      return new Response(
        JSON.stringify({
          error: "Cannot create offer: User profile not found.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // NOTE: Steps 4-6 (preparing data, inserting, and returning response) will be implemented next.
    const { title, description, price, quantity } = validationResult.data;
    const offerDataToInsert = {
        title,
        description,
        price,
        quantity,
        sellerId: sellerProfile.id,
        sellerName: sellerProfile.name,
        sellerCamp: sellerProfile.camp,
    };

    const { data: newOffer, error: insertError } = await supabase
      .from("Offers")
      .insert(offerDataToInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase error in POST /offers:", insertError.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(newOffer), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in POST /offers:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
