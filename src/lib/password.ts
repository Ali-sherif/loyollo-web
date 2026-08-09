export function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function passwordFeedback(pw: string): string | null {
  if (pw.length === 0) return null;
  const c = passwordChecks(pw);
  if (!c.length) return "Use at least 8 characters";
  const missing: string[] = [];
  if (!c.uppercase) missing.push("an uppercase letter");
  if (!c.lowercase) missing.push("a lowercase letter");
  if (!c.number) missing.push("a number");
  if (!c.special) missing.push("a special character");
  if (missing.length === 0) return null;
  if (missing.length === 1) return `Add ${missing[0]}`;
  if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]}`;
  return `Add ${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;
}
