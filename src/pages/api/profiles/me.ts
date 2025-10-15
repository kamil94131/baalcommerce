import type { APIContext } from "astro";
import { z } from "zod";
import {
  DEFAULT_USER_ID,
  supabaseClient,
} from "../../../db/supabase.client";
import type { UpdateProfileCommand } from "../../../types";

export const prerender = false;

const UpdateProfileSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters long."),
    camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
    defaultCourierId: z.number().int().positive(),
  })
  .partial(); // All fields are optional

export async function PATCH(context: APIContext): Promise<Response> {
  // NOTE: Auth is skipped for now, using a default user ID.
  const userId = DEFAULT_USER_ID;
  const supabase = supabaseClient;

  let requestData: UpdateProfileCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if there's anything to update
  if (Object.keys(requestData).length === 0) {
    return new Response(
      JSON.stringify({ error: "Request body is empty. Nothing to update." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const validationResult = UpdateProfileSchema.safeParse(requestData);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Step 3: Fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("Profiles")
      .select("id, name")
      .eq("userId", userId)
      .single();

    if (fetchError || !existingProfile) {
      return new Response(JSON.stringify({ error: "Profile not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Check for name conflict if name is being updated
    const { name } = validationResult.data;
    if (name && name !== existingProfile.name) {
      const { data: conflictingProfile, error: conflictError } = await supabase
        .from("Profiles")
        .select("id")
        .eq("name", name)
        .single();

      if (conflictError && conflictError.code !== "PGRST116") {
        // PGRST116 = "exact one row not found"
        throw new Error("Failed to check for name conflicts.");
      }

      if (conflictingProfile) {
        return new Response(
          JSON.stringify({ error: "Profile name already taken." }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Step 5: Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("Profiles")
      .update(requestData)
      .eq("userId", userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      throw new Error("Failed to update profile.");
    }

    // Step 6: Return the success response
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Internal server error:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(context: APIContext): Promise<Response> {
  // NOTE: Auth is skipped for now, using a default user ID.
  const userId = DEFAULT_USER_ID;
  const supabase = supabaseClient;

  try {
    const { data: profile, error } = await supabase
      .from("Profiles")
      .select("*")
      .eq("userId", userId)
      .single();

    // Step 5: Handle Other Database Errors
    // PostgREST error `PGRST116` means "exact one row not found", which is our "Not Found" case.
    // We handle it separately. Any other error is a 500.
    if (error && error.code !== "PGRST116") {
      console.error("Supabase error during GET /profiles/me:", error.message);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Handle "Not Found" Error
    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found for the current user." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Return Success Response
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // This catch block is for unexpected errors in the try block itself.
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Unexpected error in GET /profiles/me:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
