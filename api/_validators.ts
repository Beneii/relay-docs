/**
 * Runtime validation helpers for API endpoints.
 */

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowed.join(", ")}`,
    );
  }
  return value as T;
}

export function assertString(value: unknown, fieldName: string): string {
  if (!value || typeof value !== "string") {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
