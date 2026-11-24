import type { User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { InstanceRepository } from "../ports/index.ts";

const SIGNUP_OPEN = "signup_open";

export interface InstanceSettings {
  /** Whether a new account can be created right now. */
  signupOpen: boolean;
  /** False until the first account exists (the first sign-up is always open). */
  hasUsers: boolean;
}

/**
 * Instance-wide settings. A scrobbler instance is usually personal: sign-up is open until the first account
 * exists, then closed unless its owner (the first account) reopens it.
 */
export class InstanceService {
  constructor(
    private readonly instance: InstanceRepository,
    /** Set by the operator (env DISABLE_SIGNUP): closes sign-up whatever the setting says. */
    private readonly forceClosed = false,
  ) {}

  async settings(): Promise<InstanceSettings> {
    const [hasUsers, open] = await this.instance.hasUsersAndSetting(SIGNUP_OPEN);
    return { hasUsers, signupOpen: !this.forceClosed && (!hasUsers || open === "true") };
  }

  async signupOpen(): Promise<boolean> {
    return (await this.settings()).signupOpen;
  }

  /** What anyone may know (the sign-in and sign-up pages): whether sign-up is open, nothing else. */
  async publicSettings(): Promise<{ signupOpen: boolean }> {
    return { signupOpen: await this.signupOpen() };
  }

  async isOwner(user: User): Promise<boolean> {
    return (await this.instance.ownerUserId()) === user.id;
  }

  private async assertOwner(user: User): Promise<void> {
    if (!(await this.isOwner(user)))
      throw ApiError.forbidden("Only the owner of this instance can see or change its settings.");
  }

  /** Only the owner (the first account) reads the full instance settings. */
  async ownerSettings(user: User): Promise<InstanceSettings> {
    await this.assertOwner(user);
    return this.settings();
  }

  /** Only the owner (the first account) changes instance settings. */
  async update(user: User, body: unknown): Promise<InstanceSettings> {
    await this.assertOwner(user);
    const changes = (typeof body === "object" && body !== null ? body : {}) as Record<
      string,
      unknown
    >;
    if ("signupOpen" in changes) {
      if (typeof changes.signupOpen !== "boolean")
        throw ApiError.badRequest("signupOpen must be true or false.");
      await this.instance.setSetting(SIGNUP_OPEN, changes.signupOpen ? "true" : "false");
    }
    return this.settings();
  }
}
