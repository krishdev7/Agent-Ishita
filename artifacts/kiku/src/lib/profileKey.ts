const KEY = "ishita_profile_key_v1";

export function getOrCreateProfileKey(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const key = crypto.randomUUID();
    localStorage.setItem(KEY, key);
    return key;
  } catch {
    return "default-profile";
  }
}
