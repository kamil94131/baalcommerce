import type { APIContext } from "astro";
import { z } from "zod";
import {
  DEFAULT_USER_ID,
  supabaseClient,
} from "../../../db/supabase.client";
import type { CreateProfileCommand } from "../../../types";

export const prerender = false;

const CreateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."),
  camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
});

export async function POST(context: APIContext): Promise<Response> {
  // NOTE: Auth is skipped for now, using a default user ID.
  const userId = DEFAULT_USER_ID;

  let requestData: CreateProfileCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = CreateProfileSchema.safeParse(requestData);

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

  const { name, camp } = validationResult.data;
  const supabase = supabaseClient; // Using imported client as per feedback

  try {
    // Step 4: Check for existing profile or name
    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("Profiles")
        .select("id, name")
        .or(`userId.eq.${userId},name.eq.${name}`)
        .maybeSingle();

    if (existingProfileError) {
      // Log the error for debugging
      console.error("Supabase error:", existingProfileError.message);
      throw new Error("Failed to query existing profiles.");
    }

    if (existingProfile) {
      const conflictReason =
        existingProfile.name === name
          ? "Profile name already taken."
          : "A profile for this user already exists.";
      return new Response(JSON.stringify({ error: conflictReason }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Create the new profile
    const newProfileData = {
      userId,
      name,
      camp,
    };

    const { data: createdProfile, error: createError } = await supabase
      .from("Profiles")
      .insert(newProfileData)
      .select()
      .single();

    if (createError || !createdProfile) {
      // Log the error for debugging
      console.error("Supabase error:", createError?.message);
      throw new Error("Failed to create profile.");
    }

    // Step 6: Return the success response
    return new Response(JSON.stringify(createdProfile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    // Log the error for debugging
    console.error("Internal server error:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
