import { redirect } from "@sveltejs/kit";

export const actions = {
  logout: async ({ locals }: any) => {
    // Clear the auth store to logout
    locals.pb.authStore.clear();

    // Redirect to login page
    throw redirect(303, "/login");
  },
};
