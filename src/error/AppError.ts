export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resourse not found") {
    super(message, 404);
  }
}
export class ValidationError extends AppError {
  constructor(message: string = "Validation faild") {
    super(message, 400);
  }
}
export class unauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}
