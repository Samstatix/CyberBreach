import { describe, expect, it } from "vitest";
import {
  assessBuffer,
  decodeBase64,
  decodeCaesarCipher,
  forensicEvents,
  simulateInvoiceRequest,
  summarizeFailedLogins,
} from "./labWorkbenchLogic";

describe("multi-discipline lab workbench", () => {
  it("demonstrates broken object authorization and the secure response", () => {
    expect(simulateInvoiceRequest("INV-204", "maya", "vulnerable").status).toBe(200);
    expect(simulateInvoiceRequest("INV-204", "maya", "secure").status).toBe(403);
    expect(simulateInvoiceRequest("INV-101", "maya", "secure").status).toBe(200);
    expect(simulateInvoiceRequest("INV-999", "maya", "secure").status).toBe(404);
  });

  it("decodes a Caesar shift while preserving punctuation and case", () => {
    expect(decodeCaesarCipher("KHOOR Zruog!", 3)).toBe("HELLO World!");
    expect(decodeCaesarCipher("ABC", 29)).toBe("XYZ");
  });

  it("decodes Base64 and rejects invalid input", () => {
    expect(decodeBase64("Q1lCRVJCUkVBQ0g=")).toBe("CYBERBREACH");
    expect(decodeBase64("8J+SgA==")).toBe("💀");
    expect(decodeBase64("Q1lC\\nRVJCUkVBQ0g")).toBe("CYBERBREACH");
    expect(() => decodeBase64("%%%")).toThrow("Invalid Base64 characters");
    expect(() => decodeBase64("A")).toThrow("Invalid Base64 length");
    expect(() => decodeBase64("SGVsbG8===")).toThrow("Invalid Base64 characters");
    expect(() => decodeBase64("/w==")).toThrow("encoded data");
  });

  it("models a buffer boundary and the effect of bounds checking", () => {
    expect(assessBuffer(6)).toEqual({ status: "safe", acceptedBytes: 6, overwrittenBytes: 0 });
    expect(assessBuffer(10, 8, false)).toEqual({ status: "overflow", acceptedBytes: 8, overwrittenBytes: 2 });
    expect(assessBuffer(10, 8, true)).toEqual({ status: "rejected", acceptedBytes: 0, overwrittenBytes: 0 });
  });

  it("keeps invalid numeric input from contaminating buffer calculations", () => {
    expect(assessBuffer(Number.NaN)).toEqual({ status: "safe", acceptedBytes: 0, overwrittenBytes: 0 });
    expect(assessBuffer(Number.POSITIVE_INFINITY, 8, false)).toEqual({ status: "safe", acceptedBytes: 0, overwrittenBytes: 0 });
    expect(assessBuffer(10, Number.NaN, false)).toEqual({ status: "overflow", acceptedBytes: 1, overwrittenBytes: 9 });
  });

  it("finds the most repeated failed-login source without treating blocked or successful events as failures", () => {
    expect(summarizeFailedLogins(forensicEvents)[0]).toEqual({ sourceIp: "203.0.113.24", count: 3 });
  });
});
