import { redirect } from "@sveltejs/kit";

export const load = async (event: any) => {
  // Protect this route - only authenticated users can access it
  if (!event.locals.user) {
    throw redirect(303, "/login");
  }

  // Return user data and any other data needed for the dashboard
  return {
    user: event.locals.user,
  };
};
