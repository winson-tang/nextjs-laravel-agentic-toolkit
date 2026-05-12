/**
 * Phase: 1 (PHI redaction)
 * Failure scenarios covered: F-8 (PHI in error log).
 *
 * These tests verify behavior through the public redactPhi/redactValue surface.
 * No mocking. No private internals. If we change the regex set, these should
 * still describe the right behavior.
 */

import { redactPhi, redactValue } from "@/app/lib/redact";

describe("redactPhi", () => {
  it("redacts SSN-shaped strings", () => {
    const input = "Patient SSN is 123-45-6789. Please verify.";
    const output = redactPhi(input);
    expect(output).not.toContain("123-45-6789");
    expect(output).toContain("[REDACTED:SSN]");
  });

  it("redacts DOB-shaped strings", () => {
    const input = "DOB: 04/12/1984 on file.";
    const output = redactPhi(input);
    expect(output).not.toContain("04/12/1984");
    expect(output).toContain("[REDACTED:DOB]");
  });

  it("redacts MRN-shaped identifiers", () => {
    const input = "Patient record MRN-1234567 is locked.";
    const output = redactPhi(input);
    expect(output).not.toContain("MRN-1234567");
    expect(output).toContain("[REDACTED:MRN]");
  });

  it("redacts email and phone", () => {
    const input = "Contact: jane.doe@example.com or (604) 555-0199.";
    const output = redactPhi(input);
    expect(output).not.toContain("jane.doe@example.com");
    expect(output).not.toContain("604) 555-0199");
    expect(output).toContain("[REDACTED:EMAIL]");
    expect(output).toContain("[REDACTED:PHONE]");
  });

  it("leaves non-PHI text unchanged", () => {
    const input = "Audio uploaded successfully; transcription queued.";
    expect(redactPhi(input)).toBe(input);
  });
});

describe("redactValue", () => {
  it("redacts inside a JSON-serialized object", () => {
    const input = { patientId: "TEST_PATIENT_001", note: "DOB 04/12/1984" };
    const out = redactValue(input);
    expect(out).not.toContain("04/12/1984");
    expect(out).toContain("[REDACTED:DOB]");
  });

  it("handles Error objects without losing the message structure", () => {
    const err = new Error("PHI leak: ssn 123-45-6789");
    const out = redactValue(err);
    expect(out).toContain("[REDACTED:SSN]");
    expect(out).toContain("Error");
  });
});
