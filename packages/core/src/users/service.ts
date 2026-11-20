import type { User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { Clock, UserRepository } from "../ports/index.ts";

export const USER_NAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;

export function isValidUserName(name: unknown): name is string {
  return typeof name === "string" && USER_NAME_RE.test(name);
}

export function assertValidUserName(name: unknown): asserts name is string {
  if (!isValidUserName(name)) {
    throw ApiError.badRequest("user_name must be 1 to 64 characters: letters, digits, '_', '.' or '-'.");
  }
}

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock,
  ) {}

  async requireByName(name: string): Promise<User> {
    const user = await this.users.findByName(name);
    if (!user) throw ApiError.notFound(`Cannot find user: ${name}`);
    return user;
  }

  /** Creates the scrobbler profile of a new identity-provider account. */
  async createProfile(authUserId: string, name: unknown): Promise<User> {
    assertValidUserName(name);
    const user = await this.users.create(authUserId, name, this.clock());
    if (!user) throw new ApiError(409, `User ${name} already exists.`);
    return user;
  }
}
