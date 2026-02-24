class ApiResponse {
  private statusCode: number;
  private message: string;
  private data: any;
  private success: boolean;

  constructor(statusCode: number, message: string = 'success', data: any) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = this.handleBigInt(data);
    this.success = statusCode < 400;
  }

  private handleBigInt(data: any): any {
    if (data === null || data === undefined) return data;

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      return data.map(this.handleBigInt.bind(this));
    }

    if (typeof data === 'object') {
      const result: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = this.handleBigInt(data[key]);
        }
      }
      return result;
    }

    return data;
  }
}

export default ApiResponse;
