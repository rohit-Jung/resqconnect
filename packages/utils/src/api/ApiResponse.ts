export default class ApiResponse<T = unknown> {
  private statusCode: number;
  private message: string;
  private data: T;
  private success: boolean;

  constructor(statusCode: number, message: string = 'success', data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = this.handleBigInt(data) as T;
    this.success = statusCode < 400;
  }

  private handleBigInt(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      return data.map(d => this.handleBigInt(d));
    }

    if (typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(record)) {
        result[key] = this.handleBigInt(record[key]);
      }
      return result;
    }

    return data;
  }
}
