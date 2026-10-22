import axios from "axios";

export type FieldErrors = Record<string, string>;

export type ParsedApiError = {
  message: string;
  fieldErrors: FieldErrors;
};

function firstMessage(value: unknown): string {
  if (Array.isArray(value)) return firstMessage(value[0]);
  if (typeof value === "string") return value;
  return "";
}

/**
 * Turn any API failure into something a person can read.
 * Handles the shapes the backend produces: {error}, {detail}, DRF field errors
 * like {email: ["..."]}, and network failures with no response at all.
 */
export function parseApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return { message: fallback, fieldErrors: {} };
  }

  if (!error.response) {
    return {
      message:
        "Could not reach the server. Check that the backend is running and try again.",
      fieldErrors: {},
    };
  }

  const { status, data } = error.response;

  if (status === 403) {
    return {
      message: "You do not have permission to do that. Ask an administrator.",
      fieldErrors: {},
    };
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const general =
      firstMessage(record.error) ||
      firstMessage(record.detail) ||
      firstMessage(record.non_field_errors);

    const fieldErrors: FieldErrors = {};
    for (const [key, value] of Object.entries(record)) {
      if (["error", "detail", "non_field_errors"].includes(key)) continue;
      const message = firstMessage(value);
      if (message) fieldErrors[key] = message;
    }

    if (general) return { message: general, fieldErrors };

    const firstField = Object.keys(fieldErrors)[0];
    if (firstField) {
      return { message: fieldErrors[firstField], fieldErrors };
    }
  }

  return { message: fallback, fieldErrors: {} };
}
