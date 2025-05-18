import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }: any) => {
  return {
    user: locals.user,
  };
};
