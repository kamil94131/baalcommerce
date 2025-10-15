import type { APIContext } from "astro";
import { z } from "zod";
import { supabaseClient, DEFAULT_USER_ID } from "../../../db/supabase.client";
import type { UpdateOfferCommand } from "../../../types";

export const prerender = false;

// Zod schema for validating the ID parameter
const IdSchema = z.coerce.number().int().positive();

export async function GET(context: APIContext): Promise<Response> {
  // Step 2: Get and Validate ID Parameter
  const id = context.params.id;
  const validationResult = IdSchema.safeParse(id);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid ID parameter. Must be a positive integer.",
        details: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const validatedId = validationResult.data;
  const supabase = supabaseClient;

  try {
    // Step 3: Build and Execute Database Query
    const { data: offer, error } = await supabase
      .from("Offers")
      .select("*") // Corrected typo from "* "
      .eq("id", validatedId)
      .eq("status", "CREATED")
      .single();

    // Step 5: Handle Other Database Errors
    if (error && error.code !== "PGRST116") {
      console.error(`Supabase error in GET /offers/${validatedId}:`, error.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Handle "Not Found" Error
    if (!offer) {
      return new Response(
        JSON.stringify({
          error: `Offer with ID ${validatedId} not found or is not active.`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Return Success Response
    return new Response(JSON.stringify(offer), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error(`Unexpected error in GET /offers/${id}:`, errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
    }
  }
  
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
          // Fetch user profile and offer in parallel
          const [userProfileRes, offerRes] = await Promise.all([
              supabase.from("Profiles").select("id").eq("userId", DEFAULT_USER_ID).single(),
              supabase.from("Offers").select("sellerId, status").eq("id", validatedId).single()
          ]);
  
          const { data: userProfile, error: userProfileError } = userProfileRes;
          const { data: offer, error: offerError } = offerRes;
  
          // Handle fetch errors
          if (userProfileError) {
              return new Response(JSON.stringify({ error: "Unauthorized: Profile not found for current user." }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          if (offerError) {
              return new Response(JSON.stringify({ error: `Offer with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
          }
  
          // Authorization & State checks
          if (offer.sellerId !== userProfile.id) {
              return new Response(JSON.stringify({ error: "Forbidden: You are not the author of this offer." }), { status: 403, headers: { "Content-Type": "application/json" } });
          }
          if (offer.status !== 'CREATED') {
              return new Response(JSON.stringify({ error: `Conflict: Offer cannot be deleted because its status is '${offer.status}'.` }), { status: 409, headers: { "Content-Type": "application/json" } });
          }
  
          // Delete offer
          const { error: deleteError } = await supabase
              .from("Offers")
              .delete()
              .eq("id", validatedId);
  
          if (deleteError) {
              console.error(`Supabase error during DELETE /offers/${validatedId}:`, deleteError.message);
              return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
  
          return new Response(null, { status: 204 });
  
      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
          console.error(`Unexpected error in DELETE /offers/${validatedId}:`, errorMessage);
          return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
  }

const UpdateOfferSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  description: z.string().optional(),
  price: z.coerce.number().int().positive("Price must be a positive number."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number."),
}).partial();

export async function PATCH(context: APIContext): Promise<Response> {
    const supabase = supabaseClient;
    
    // Validate ID
    const id = context.params.id;
    const idValidationResult = IdSchema.safeParse(id);
    if (!idValidationResult.success) {
        return new Response(JSON.stringify({ error: "Invalid ID parameter." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const validatedId = idValidationResult.data;

    // Validate body
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

    try {
        // Fetch user profile and offer in parallel
        const [userProfileRes, offerRes] = await Promise.all([
            supabase.from("Profiles").select("id").eq("userId", DEFAULT_USER_ID).single(),
            supabase.from("Offers").select("sellerId, status").eq("id", validatedId).single()
        ]);

        const { data: userProfile, error: userProfileError } = userProfileRes;
        const { data: offer, error: offerError } = offerRes;

        // Handle fetch errors
        if (userProfileError) {
            return new Response(JSON.stringify({ error: "Unauthorized: Profile not found for current user." }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        if (offerError) {
            return new Response(JSON.stringify({ error: `Offer with ID ${validatedId} not found.` }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        // Authorization & State checks
        if (offer.sellerId !== userProfile.id) {
            return new Response(JSON.stringify({ error: "Forbidden: You are not the author of this offer." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        if (offer.status !== 'CREATED') {
            return new Response(JSON.stringify({ error: `Conflict: Offer cannot be updated because its status is '${offer.status}'.` }), { status: 409, headers: { "Content-Type": "application/json" } });
        }

        // Update offer
        const { data: updatedOffer, error: updateError } = await supabase
            .from("Offers")
            .update(bodyValidationResult.data)
            .eq("id", validatedId)
            .select()
            .single();

        if (updateError) {
            console.error(`Supabase error during PATCH /offers/${validatedId}:`, updateError.message);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify(updatedOffer), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        console.error(`Unexpected error in PATCH /offers/${validatedId}:`, errorMessage);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
