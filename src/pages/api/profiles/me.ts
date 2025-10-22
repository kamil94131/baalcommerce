import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import {ProfileService} from "@/lib/services/profile.service.ts";
import type {UpdateProfileCommand} from "@/types.ts";
import {UpdateProfileSchema} from "./profile.schema";

export const prerender = false;

// REFACTORED GET HANDLER
export async function GET(context: APIContext): Promise<Response> {
  try {
    const profile = await ProfileService.getProfileByUserId(DEFAULT_USER_ID);
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NotFound') {
      return new Response(
        JSON.stringify({ error: "Profile not found for the current user." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Unexpected error in GET /profiles/me:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



export async function PATCH(context: APIContext): Promise<Response> {
  // 1. Validate body
  let requestData: UpdateProfileCommand;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (Object.keys(requestData).length === 0) {
    return new Response(
      JSON.stringify({ error: "Request body is empty. Nothing to update." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validationResult = UpdateProfileSchema.safeParse(requestData);

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
    const updatedProfile = await ProfileService.updateProfileByUserId(
      DEFAULT_USER_ID,
      validationResult.data
    );
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'NotFound') {
        return new Response(
          JSON.stringify({ error: "Profile not found." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error.message === 'Conflict') {
        return new Response(
          JSON.stringify({ error: "Profile name already taken." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    console.error("Unexpected error in PATCH /profiles/me:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
