import {z} from "zod";

export const CreateProfileSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters long.").max(50, "Name must be at most 50 characters long."),
  camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
});

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(5, "Name must be at least 5 characters long.").max(50, "Name must be at most 50 characters long."),
    camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
    defaultCourierId: z.number().int().positive(),
  })
  .partial();
