import type {APIContext} from "astro";
import {DEFAULT_USER_ID} from "@/db/supabase.client.ts";
import type {CreateCourierCommand} from "@/types.ts";
import {CourierService} from "@/lib/services/courier.service.ts";
import {CreateCourierSchema} from "./courier.schema";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    const couriers = await CourierService.getCouriers();
    const responsePayload = {
      data: couriers,
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Unexpected error in GET /couriers:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



export async function POST(context: APIContext): Promise<Response> {
  // 1. Validate body
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

  // 2. Call service
  try {
    const newCourier = await CourierService.createCourier(
      DEFAULT_USER_ID,
      validationResult.data
    );
    return new Response(JSON.stringify(newCourier), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'Forbidden':
          return new Response(JSON.stringify({ error: "Forbidden: User does not have the required 'gomez' role." }), { status: 403, headers: { "Content-Type": "application/json" } });
        case 'Conflict':
           return new Response(
            JSON.stringify({ error: `Conflict: A courier with the name '${validationResult.data.name}' already exists.` }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        default:
          break; // Fallthrough for other errors
      }
    }
    console.error("Unexpected error in POST /couriers:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}