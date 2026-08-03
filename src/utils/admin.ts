export const SUPER_ADMINS = [
  'studio@ideabrews.com',
  'ashwin.gangakhedkar@dentsu.com'
];

/**
 * Checks if a given email belongs to a super admin.
 * Performs a case-insensitive check.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMINS.includes(email.toLowerCase());
}
