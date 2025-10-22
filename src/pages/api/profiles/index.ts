import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import {ProfileService} from "@/lib/services/profile.service.ts";
import type {CreateProfileCommand} from "@/types.ts";
import {CreateProfileSchema} from "./profile.schema";

export const prerender = false;



export async function POST(context: APIContext): Promise<Response> {
  // 1. Validate body
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
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Call service
  try {
    const newProfile = await ProfileService.createProfile(
      DEFAULT_USER_ID,
      validationResult.data
    );
    return new Response(JSON.stringify(newProfile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'NameConflict') {
        return new Response(
          JSON.stringify({ error: "Profile name already taken." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error.message === 'UserConflict') {
        return new Response(
          JSON.stringify({ error: "A profile for this user already exists." }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    console.error("Unexpected error in POST /profiles:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
