export class ValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

export function parseObject(input: unknown, message = 'Expected object') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError(message);
  }

  return input as Record<string, unknown>;
}

export function parseNonEmptyString(input: unknown, message: string) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ValidationError(message);
  }

  return input;
}

export function parseOptionalString(input: unknown) {
  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  if (typeof input !== 'string') {
    throw new ValidationError('Expected string value');
  }

  return input;
}

export function parseBoolean(input: unknown, message: string) {
  if (typeof input !== 'boolean') {
    throw new ValidationError(message);
  }

  return input;
}

export function parseOptionalBoolean(input: unknown) {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== 'boolean') {
    throw new ValidationError('Expected boolean value');
  }

  return input;
}

export function parseDateLike(input: unknown, message: string) {
  if (typeof input === 'string' && input.trim()) {
    return input;
  }

  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString();
  }

  if (!(typeof input === 'string' || input instanceof Date)) {
    throw new ValidationError(message);
  }

  throw new ValidationError(message);
}

export function parseOptionalDateLike(input: unknown) {
  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  return parseDateLike(input, 'Expected date value');
}

export function parseArray(input: unknown, message: string) {
  if (!Array.isArray(input)) {
    throw new ValidationError(message);
  }

  return input;
}

export function parseOptionalArray(input: unknown) {
  if (input === undefined) {
    return undefined;
  }

  if (!Array.isArray(input)) {
    throw new ValidationError('Expected array value');
  }

  return input;
}

export function parseOptionalNumber(input: unknown) {
  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  if (typeof input !== 'number' || Number.isNaN(input)) {
    throw new ValidationError('Expected numeric value');
  }

  return input;
}
