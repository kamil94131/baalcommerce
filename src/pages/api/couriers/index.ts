import type { APIContext } from "astro";
import { supabaseClient } from "../../../db/supabase.client";
import { z } from "zod";
import type { CreateCourierCommand } from "../../../types";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  try {
    const { data: couriers, error } = await supabase.from("Couriers").select("*");

    if (error) {
      console.error("Supabase error in GET /couriers:", error.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const responsePayload = {
      data: couriers || [],
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in GET /couriers:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const CreateCourierSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters long."),
  camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
});

export async function POST(context: APIContext): Promise<Response> {
  const supabase = supabaseClient;

  // Validate body
  let requestData: CreateCourierCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const validationResult = CreateCourierSchema.safeParse(requestData);
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
    // Authorize user: must have 'gomez' role
    // RLS policy is the true enforcer, but this provides a clearer error response.
    const { data: hasRole, error: rpcError } = await supabase.rpc("has_role", {
      role_name: "gomez",
    });

    if (rpcError || !hasRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden: User does not have the required 'gomez' role." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert new courier
    const { data: newCourier, error: insertError } = await supabase
      .from("Couriers")
      .insert(validationResult.data)
      .select()
      .single();

    if (insertError) {
      // Handle unique name conflict
      if (insertError.code === '23505') { // unique_violation
        return new Response(
          JSON.stringify({ error: `Conflict: A courier with the name '${validationResult.data.name}' already exists.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      console.error("Supabase error in POST /couriers:", insertError.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(newCourier), { status: 201, headers: { "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in POST /couriers:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
