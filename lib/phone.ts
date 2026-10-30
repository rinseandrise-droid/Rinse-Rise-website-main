/** Shared Indian mobile helpers used by forms and tests. */

export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  // 91 is the country code only when 12 digits were entered: 91 plus a 10-digit mobile.
  // A 10-digit number that itself starts with 91, such as 9175504996, stays as typed.
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  if (digits.length === 11 && /^0[6-9]\d{9}$/.test(digits)) return digits.slice(1);
  return digits;
}

export function isIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value));
}
