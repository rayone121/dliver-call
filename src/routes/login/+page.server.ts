import { fail, redirect } from "@sveltejs/kit";

export const load = async ({ locals }: any) => {
  // If the user is already logged in, redirect to home
  if (locals.user) {
    throw redirect(303, "/");
  }

  return {};
};

export const actions = {
  login: async ({ request, locals }: any) => {
    try {
      const formData = await request.formData();
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();

      console.log("Login attempt:", { email, hasPassword: !!password });

      if (!email || !password) {
        return fail(400, {
          error: "Missing email or password",
          email,
        });
      }

      try {
        const authData = await locals.pb
          .collection("users")
          .authWithPassword(email, password);

        console.log("Login successful:", authData.record.id);

        // Redirect to home page after successful login
        throw redirect(303, "/");
      } catch (err) {
        console.error("PocketBase auth error:", err);

        return fail(400, {
          error: "Invalid email or password",
          email,
        });
      }
    } catch (err) {
      console.error("Login server error:", err);

      return fail(500, {
        error: "An unexpected error occurred during login",
        email: "",
      });
    }
  },
};
