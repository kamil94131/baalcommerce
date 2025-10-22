import {z} from "zod";
import {PaginatedQuerySchema} from "../common.schema";

export const CreateOrderSchema = z.object({
  offerId: z.number().int().positive(),
  courierId: z.number().int().positive(),
});

export const GetOrdersQuerySchema = PaginatedQuerySchema.extend({
    view: z.enum(["bought", "sold"]).optional(),
});
