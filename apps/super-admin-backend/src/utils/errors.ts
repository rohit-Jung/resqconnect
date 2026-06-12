export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
  static badRequest(msg: string) {
    return new AppError(400, msg);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(401, msg);
  }
  static notFound(msg = 'Not found') {
    return new AppError(404, msg);
  }
  static conflict(msg: string) {
    return new AppError(409, msg);
  }
  static internal(msg = 'Internal server error') {
    return new AppError(500, msg);
  }
}
