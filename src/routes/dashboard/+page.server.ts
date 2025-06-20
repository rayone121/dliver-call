import { redirect, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from './$types';
import { fetchApiClientSettings, saveApiClientSettings } from '$lib/models/apiClient';

export const load: PageServerLoad = async ({ locals }) => {
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

export const actions: Actions = {
  updateApiSettings: async ({ locals, request }) => {
    const { pb, user } = locals;

    if (!user) {
      throw redirect(303, "/login");
    }

    const formData = await request.formData();
    const host = formData.get('host')?.toString();
    const apiKey = formData.get('apiKey')?.toString();

    if (!host || !apiKey) {
      return fail(400, {
        success: false,
        message: "Host and API key are required"
      });
    }

    try {
      await saveApiClientSettings(pb, user.id, { host, apiKey });
      return {
        success: true,
        message: "API settings updated successfully"
      };
    } catch (error) {
      console.error('Error saving API settings:', error);
      return fail(500, {
        success: false,
        message: `Error saving settings: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
};