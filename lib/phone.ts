/** Shared Indian mobile helpers used by forms and tests. */

export function normalizeIndianMobile(value: string): string {
  const digits = value.trim().replace(/[\s-]/g, "").replace(/^\+/, "");
  // 91 is the country code only when it sits in front of a full 10-digit mobile.
  // A 10-digit number that itself starts with 91 must be left intact.
  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  return digits;
}

export function isIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value));
}
