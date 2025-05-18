import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }: any) => {
  // Make auth data available to all pages via the layout
  return {
    user: locals.user,
  };
};
