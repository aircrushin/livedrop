"use server";

import { createClient } from "./server";
import { revalidatePath } from "next/cache";

interface BrandingConfig {
  logoUrl: string | null;
  bannerUrl: string | null;
  logoPosition: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  qrStyle: "default" | "rounded" | "dots";
  primaryColor: string;
  backgroundColor: string;
}

export async function updateEventBranding(
  eventId: string,
  branding: BrandingConfig
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify user owns the event
    const { data: event } = await supabase
      .from("events")
      .select("host_id, slug")
      .eq("id", eventId)
      .single();

    if (!event || event.host_id !== user.id) {
      return { error: "Unauthorized" };
    }

    // Update branding - convert to plain object
    const brandingData = JSON.parse(JSON.stringify(branding));
    const { error } = await supabase
      .from("events")
      .update({ branding: brandingData })
      .eq("id", eventId);

    if (error) {
      console.error("Error updating branding:", error);
      return { error: "Failed to update branding" };
    }

    revalidatePath(`/dashboard/event/${event.slug}`);
    return { success: true };
  } catch (error) {
    console.error("Error in updateEventBranding:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getEventBranding(
  eventId: string
): Promise<{ branding?: BrandingConfig; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("events")
      .select("branding")
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching branding:", error);
      return { error: "Failed to fetch branding" };
    }

    const defaultBranding: BrandingConfig = {
      logoUrl: null,
      bannerUrl: null,
      logoPosition: "center",
      qrStyle: "default",
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
    };

    const rawBranding = data?.branding;
    const mergedBranding: BrandingConfig = {
      ...defaultBranding,
      ...(typeof rawBranding === 'object' && rawBranding !== null ? rawBranding as Partial<BrandingConfig> : {}),
    };
    
    return { branding: mergedBranding };
  } catch (error) {
    console.error("Error in getEventBranding:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function setEventActiveStatus(
  eventId: string,
  isActive: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    const { data: event } = await supabase
      .from("events")
      .select("host_id, slug")
      .eq("id", eventId)
      .single();

    if (!event || event.host_id !== user.id) {
      return { error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("events")
      .update({ is_active: isActive })
      .eq("id", eventId);

    if (error) {
      console.error("Error updating event active status:", error);
      return { error: "Failed to update event status" };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/event/${event.slug}`);
    revalidatePath(`/e/${event.slug}`);
    revalidatePath(`/live/${event.slug}`);

    return { success: true };
  } catch (error) {
    console.error("Error in setEventActiveStatus:", error);
    return { error: "An unexpected error occurred" };
  }
}
