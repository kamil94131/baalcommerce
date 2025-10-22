import {z} from "zod";

export const CreateCourierSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters long.").max(20, "Name must be at most 20 characters long."),
  camp: z.enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"]),
});
