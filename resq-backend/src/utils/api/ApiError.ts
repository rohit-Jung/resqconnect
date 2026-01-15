import type { ZodError } from 'zod';

class ApiError extends Error {
  private statusCode: number;
  private data: any;
  private errors: any[];

  constructor(
    statusCode: number,
    message: string = 'Internal Server Error',
    errors: any[] = [],
    data: any = null,
    stack: string = '',
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;

    if (this.stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
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

  static validationError(errors: ZodError) {
    return new ApiError(
      400,
      'Error validating data',
      errors.issues.map(issue => `${issue.path.join('.')} : ${issue.message}`),
    );
  }
}

export default ApiError;
