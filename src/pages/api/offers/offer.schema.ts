import {z} from "zod";
import {PaginatedQuerySchema} from "../common.schema";

export const CreateOfferSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(20, "Title must be at most 20 characters long."),
  description: z.string().min(5, "Description must be at least 5 characters long.").max(200, "Description must be at most 200 characters long."),
  price: z.coerce.number().int().min(0, "Price must be at least 0.").max(999, "Price must be at most 999."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(99, "Quantity must be at most 99."),
});

export const UpdateOfferSchema = CreateOfferSchema.partial();

export const GetOffersQuerySchema = PaginatedQuerySchema;
