const KEY = "ti_admin_key";

/**
 * Admin unlock for pool-management actions (e.g. redeem). The key is never
 * shipped: an admin unlocks the session by visiting `?adminKey=…` (persisted to
 * localStorage). Regular users have no key, so admin controls stay hidden and
 * the backend rejects any call with a 403.
 */
export function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("adminKey");
    if (fromUrl) window.localStorage.setItem(KEY, fromUrl);
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
