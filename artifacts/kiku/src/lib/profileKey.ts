const OLD_KEY = "ishita_profile_key_v1";
const KEY = "ketika_profile_key_v1";

export function getOrCreateProfileKey(): string {
  try {
    // Migrate from old key — preserves existing user data/UUID
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      localStorage.setItem(KEY, old);
      localStorage.removeItem(OLD_KEY);
    }
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const key = crypto.randomUUID();
    localStorage.setItem(KEY, key);
    return key;
  } catch {
    return "default-profile";
  }
}
