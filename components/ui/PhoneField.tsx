"use client";

import type { ChangeEvent } from "react";

type PhoneFieldProps = {
  name?: string;
  required?: boolean;
  invalid?: boolean;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
};

/** Country code stays in its own box. The input is only the 10-digit mobile. */
export function PhoneField({
  name = "phone",
  required,
  invalid,
  value,
  onChange,
  autoComplete = "tel-national",
}: PhoneFieldProps) {
  return (
    <div className="phone-field">
      <span className="phone-prefix">+91</span>
      <input
        className="input"
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder="10-digit number"
        required={required}
        aria-invalid={invalid || undefined}
        aria-label="10-digit mobile number"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
