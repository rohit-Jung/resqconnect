import type { ZodError } from 'zod';

export default class ApiError extends Error {
  private statusCode: number;
  private data: unknown;
  private errors: unknown[];

  constructor(
    statusCode: number,
    message: string = 'Internal Server Error',
    errors: unknown[] = [],
    data: unknown = null,
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;

    if (this.stack) {
      this.stack = stack;
    } else if ('captureStackTrace' in Error) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      message: this.message,
      errors: this.errors,
      data: this.data,
      statusCode: this.statusCode,
    };
  }

  // validation Errors zod
  static validationError(errors: ZodError) {
    return new ApiError(
      400,
      'Error validating data',
      errors.issues.map(issue => `${issue.path.join('.')} : ${issue.message}`)
    );
  }

  // 4xx - client errors
  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static badRequest(message: string = 'Bad Request') {
    return new ApiError(400, message);
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Not Found') {
    return new ApiError(404, message);
  }

  static methodNotAllowed(message: string = 'Method Not Supported') {
    return new ApiError(405, message);
  }

  static conflict(message: string = 'Conflict with current state') {
    return new ApiError(409, message);
  }

  static tooManyRequest(message: string = 'Too many request at given time') {
    return new ApiError(429, message);
  }

  static gone(message: string = 'Resource no longer available') {
    return new ApiError(410, message);
  }

  // 5xx - server errors
  static internalServerError(message: string = 'Internal Server Error') {
    return new ApiError(500, message);
  }

  static serviceUnavailable(message: string = 'Service Unavailable') {
    return new ApiError(503, message);
  }
}
