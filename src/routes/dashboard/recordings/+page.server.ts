import { redirect } from "@sveltejs/kit";
import type { ServerLoad } from '@sveltejs/kit';
import { fetchApiClientSettings } from '$lib/models/apiClient';

export const load: ServerLoad = async ({ locals }: { locals: { pb: any; user: any } }) => {
  const { pb, user } = locals;
  
  // Protect this route - only authenticated users can access it
  if (!user) {
    throw redirect(303, "/login");
  }
  
  let apiClientSettings = null;
  
  try {
    apiClientSettings = await fetchApiClientSettings(pb, user.id);
  } catch (error) {
    console.error('Error fetching API client settings:', error);
  }
  
  return {
    user,
    apiClientSettings
  };
};