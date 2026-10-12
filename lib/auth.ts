// Single-owner passcode login. Works in both the edge middleware and node routes.

export const SESSION_COOKIE = "tracker_session";

export const authEnabled = () => Boolean(process.env.APP_PASSWORD);

// In production a missing passcode locks the app instead of leaving it open.
const failClosed = () => process.env.NODE_ENV === "production" && !authEnabled();

export async function sessionToken(): Promise<string> {
  const secret = process.env.APP_SECRET ?? "local-dev-secret";
  const data = new TextEncoder().encode(`${process.env.APP_PASSWORD}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (failClosed()) return false;
  if (!authEnabled()) return true;
  return Boolean(value) && value === (await sessionToken());
}
