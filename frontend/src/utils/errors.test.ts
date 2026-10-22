import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { parseApiError } from "./errors";

function apiError(status: number, data: unknown) {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    data,
    statusText: "",
    headers: {},
    config: {} as never,
  };
  return error;
}

describe("parseApiError", () => {
  it("reads the {error} shape used by the action endpoints", () => {
    const result = parseApiError(apiError(400, { error: "Insufficient funds." }));

    expect(result.message).toBe("Insufficient funds.");
    expect(result.fieldErrors).toEqual({});
  });

  it("reads DRF {detail} messages", () => {
    expect(parseApiError(apiError(404, { detail: "Not found." })).message).toBe(
      "Not found."
    );
  });

  it("maps DRF field errors and uses the first one as the message", () => {
    const result = parseApiError(
      apiError(400, { email: ["Investor with this email already exists."] })
    );

    expect(result.fieldErrors).toEqual({
      email: "Investor with this email already exists.",
    });
    expect(result.message).toBe("Investor with this email already exists.");
  });

  it("explains permission failures in plain language", () => {
    const result = parseApiError(apiError(403, { detail: "Forbidden" }));

    expect(result.message).toMatch(/do not have permission/i);
  });

  it("reports an unreachable server when there is no response", () => {
    const result = parseApiError(new AxiosError("Network Error"));

    expect(result.message).toMatch(/could not reach the server/i);
  });

  it("falls back for non-API errors and unknown payloads", () => {
    expect(parseApiError(new Error("boom"), "Fallback").message).toBe("Fallback");
    expect(parseApiError(apiError(500, "<html>"), "Fallback").message).toBe(
      "Fallback"
    );
  });
});
