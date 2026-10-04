/**
 * Single home of the client-side admin definition (Q7). Mirrors the
 * `isAdmin()` transition rule in firestore.rules: the `admin` custom claim,
 * or the verified owner email until the claim is set.
 */
export const ADMIN_EMAIL = 'gabsvm@gmail.com';

export const isAdminIdentity = (input: {
    adminClaim: unknown;
    email: string | null | undefined;
    emailVerified: boolean;
}): boolean =>
    input.adminClaim === true || (input.email === ADMIN_EMAIL && input.emailVerified === true);
