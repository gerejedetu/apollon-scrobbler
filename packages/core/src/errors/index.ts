/**
 * An error that maps 1:1 to a ListenBrainz-style HTTP error body: `{ code, error }`.
 */
export class ApiError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Invalid authorization token."): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden."): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  toJSON(): { code: number; error: string } {
    return { code: this.code, error: this.message };
  }
}
