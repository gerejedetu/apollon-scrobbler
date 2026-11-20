import type { User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { UserRepository } from "../ports/index.ts";

const USER_NAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;

export function assertValidUserName(name: unknown): asserts name is string {
  if (typeof name !== "string" || !USER_NAME_RE.test(name)) {
    throw ApiError.badRequest("user_name must be 1 to 64 characters: letters, digits, '_', '.' or '-'.");
  }
}

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async requireByName(name: string): Promise<User> {
    const user = await this.users.findByName(name);
    if (!user) throw ApiError.notFound(`Cannot find user: ${name}`);
    return user;
  }
}
