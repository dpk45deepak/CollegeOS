/**
 * Extension point for Google / Microsoft sign-in. An implementation verifies the provider's ID token,
 * then maps (provider, providerAccountId) → OAuthAccount → User, and issues the normal session pair via
 * AuthService. Intentionally not wired: tenant mapping (which college a Google account belongs to) is a product decision.
 */
export interface OAuthIdentity {
  provider: 'google' | 'microsoft';
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
}
export interface OAuthProvider {
  readonly name: OAuthIdentity['provider'];
  verifyIdToken(idToken: string): Promise<OAuthIdentity>;
}
