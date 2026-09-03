export const SESSION_COOKIE_NAME = "olw_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * The session cookie's value is simply the passcode itself. That's fine here:
 * the cookie is httpOnly + secure (in production) so client-side JS and casual
 * inspection can't read it, and the passcode is already the single shared
 * secret for this private, two-person app. Keeping it this simple avoids
 * needing a session store or signing keys for something with no user accounts.
 */
export function isCorrectPasscode(input: string): boolean {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    throw new Error(
      "APP_PASSCODE is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return input.trim() === expected.trim();
}

export function isValidSessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const expected = process.env.APP_PASSCODE;
  if (!expected) return false;
  return value === expected.trim();
}
