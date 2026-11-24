import { api, type Instance } from "../api/index.ts";

/**
 * Instance settings for the sign-in and sign-up pages. If the API cannot be reached, offer sign-up anyway:
 * the server still refuses it when closed, so the worst case is a clear error on submit.
 */
export async function loadInstance(): Promise<Instance> {
  try {
    return await api.instance.get();
  } catch {
    return { signupOpen: true };
  }
}
