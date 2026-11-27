export function normalizeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(value);
}

export function isValidDisplayName(value: string): boolean {
  const length = value.trim().length;
  return length >= 2 && length <= 40;
}

export function isValidBio(value: string): boolean {
  return value.trim().length <= 160;
}
