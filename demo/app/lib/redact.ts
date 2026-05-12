/**
 * Tiny PHI redactor used by the logger and by error reporters.
 *
 * Scope: catches obvious patterns (SSN, DOB, MRN-shaped IDs, common name+DOB combos).
 * Not a substitute for a vendor like DLP/Macie or a formal compliance review.
 * Use everywhere PHI might appear in logs.
 *
 * Test coverage lives in tests/unit/redact.test.ts.
 */

const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const DOB = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g;
const MRN = /\b[A-Z]{2,4}-?\d{6,10}\b/g;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE = /\b(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "SSN", re: SSN },
  { name: "DOB", re: DOB },
  { name: "MRN", re: MRN },
  { name: "EMAIL", re: EMAIL },
  { name: "PHONE", re: PHONE },
];

export function redactPhi(input: string): string {
  let output = input;
  for (const { name, re } of PATTERNS) {
    output = output.replace(re, `[REDACTED:${name}]`);
  }
  return output;
}

/**
 * Wrap any value (object, error, primitive) into a JSON-stringifiable form
 * with PHI patterns redacted. Used by the logger before emit.
 */
export function redactValue(value: unknown): string {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value, replacer);
    return redactPhi(raw);
  } catch {
    return "[unserializable]";
  }
}

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}
