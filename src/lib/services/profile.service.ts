import { supabaseClient } from "@/db/supabase.client.ts";
import type { CreateProfileCommand, ProfileDto, UpdateProfileCommand } from "@/types.ts";

class ProfileServiceController {
  private supabase = supabaseClient;

  async getProfileByUserId(userId: string): Promise<ProfileDto> {
    const { data: profile, error } = await this.supabase
      .from("Profiles")
      .select("*")
      .eq("userId", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase error in getProfileByUserId:", error.message);
      // In a real app, you might want to use a more specific error type
      throw new Error("Database query failed");
    }

    if (!profile) {
      // Custom error message to be caught by the API layer
      throw new Error("NotFound");
    }

    return profile;
  }

  async updateProfileByUserId(userId: string, updateData: UpdateProfileCommand): Promise<ProfileDto> {
    // 1. Check if the profile exists first
    const { data: existingProfile, error: fetchError } = await this.supabase
        .from("Profiles")
        .select("id, name")
        .eq("userId", userId)
        .single();

    if (fetchError || !existingProfile) {
        throw new Error("NotFound");
    }

    // 2. Check for name conflict if name is being updated
    if (updateData.name && updateData.name !== existingProfile.name) {
        const { data: conflictingProfile, error: conflictError } = await this.supabase
            .from("Profiles")
            .select("id")
            .eq("name", updateData.name)
            .maybeSingle();

        if (conflictError) {
            console.error("Supabase error in updateProfileByUserId (conflict check):", conflictError.message);
            throw new Error("Database query failed");
        }
        if (conflictingProfile) {
            throw new Error("Conflict");
        }
    }

    // 3. Update the profile
    const { data: updatedProfile, error: updateError } = await this.supabase
        .from("Profiles")
        .update(updateData)
        .eq("userId", userId)
        .select()
        .single();

    if (updateError || !updatedProfile) {
        console.error("Supabase error in updateProfileByUserId (update):", updateError?.message);
        throw new Error("Update failed");
    }

    return updatedProfile;
  }

  async createProfile(userId: string, profileData: CreateProfileCommand): Promise<ProfileDto> {
    // 1. Check for existing profile or name
    const { data: existingProfile, error: existingProfileError } = await this.supabase
        .from("Profiles")
        .select("id, name")
        .or(`userId.eq.${userId},name.eq.${profileData.name}`)
        .maybeSingle();

    if (existingProfileError) {
        console.error("Supabase error in createProfile (conflict check):", existingProfileError.message);
        throw new Error("Database query failed");
    }

    if (existingProfile) {
        const reason = existingProfile.name === profileData.name ? "NameConflict" : "UserConflict";
        throw new Error(reason);
    }

    // 2. Create the new profile
    const newProfileData = {
      userId,
      ...profileData,
    };

    const { data: createdProfile, error: createError } = await this.supabase
      .from("Profiles")
      .insert(newProfileData)
      .select()
      .single();

    if (createError || !createdProfile) {
        console.error("Supabase error in createProfile (insert):", createError?.message);
        throw new Error("Insert failed");
    }

    return createdProfile;
  }
}

export const ProfileService = new ProfileServiceController();
