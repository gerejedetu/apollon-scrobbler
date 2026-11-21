/** The API's error body: `{ "code": <status>, "error": "<message>" }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async from(response: Response): Promise<ApiError> {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: unknown; message?: unknown };
      if (typeof body.error === "string") message = body.error;
      else if (typeof body.message === "string") message = body.message;
    } catch {
      // Not JSON: keep the status text.
    }
    return new ApiError(response.status, message);
  }
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
export const isUnauthorized = (e: unknown) => e instanceof ApiError && e.status === 401;
