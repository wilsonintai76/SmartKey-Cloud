import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import {
  beginRegistration,
  completeRegistration,
  beginAuthentication,
  completeAuthentication,
  verifySession,
  logoutSession,
  getSessionToken,
  WebAuthnUser,
  AuthResult,
} from '../services/webauthnService';

interface UseWebAuthnState {
  isLoading: boolean;
  error: string | null;
  user: WebAuthnUser | null;
  isSupported: boolean;
  isPlatformAvailable: boolean | null;
  sessionToken: string | null;
}

interface UseWebAuthnReturn extends UseWebAuthnState {
  /** Register a new biometric credential for the given username */
  register: (username: string) => Promise<boolean>;
  /** Authenticate with existing biometric credential */
  authenticate: (username: string) => Promise<boolean>;
  /** Log out (revoke session, clear state) */
  logout: () => void;
  /** Dismiss current error */
  clearError: () => void;
  /** Try to recover a previous session from token */
  recoverSession: () => Promise<boolean>;
}

/**
 * React hook for WebAuthn biometric authentication.
 *
 * Registration flow:
 *   1. Call register(username) once per user to enroll fingerprint/face
 *   2. Browser prompts for platform authenticator (Touch ID, Face ID, Windows Hello)
 *   3. Credential is stored server-side in D1
 *
 * Authentication flow:
 *   1. Call authenticate(username) to sign in
 *   2. Browser prompts biometric again
 *   3. Server verifies signature, returns JWT session token
 *   4. Token is stored in sessionStorage and available as sessionToken
 *
 * On app reload, call recoverSession() to restore state from existing token.
 */
export function useWebAuthn(): UseWebAuthnReturn {
  const [state, setState] = useState<UseWebAuthnState>({
    isLoading: false,
    error: null,
    user: null,
    isSupported: false,
    isPlatformAvailable: null,
    sessionToken: getSessionToken(),
  });

  // Check platform authenticator availability on mount
  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    setState(prev => ({ ...prev, isSupported: supported }));

    if (supported) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setState(prev => ({ ...prev, isPlatformAvailable: available })))
        .catch(() => setState(prev => ({ ...prev, isPlatformAvailable: false })));
    }
  }, []);

  // ── Registration ──────────────────────────────────────────────

  const register = useCallback(async (username: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 1. Get registration options from server
      const options = await beginRegistration(username);

      // 2. Trigger platform authenticator (fingerprint/face scan)
      const attestationResponse = await startRegistration(options);

      // 3. Send attestation to server for verification + storage
      await completeRegistration(options.user.id, attestationResponse);

      setState(prev => ({
        ...prev,
        isLoading: false,
        user: {
          id: options.user.id,
          username,
          displayName: options.user.displayName,
        },
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Registration failed. Please try again.',
      }));
      return false;
    }
  }, []);

  // ── Authentication ────────────────────────────────────────────

  const authenticate = useCallback(async (username: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 1. Get authentication options from server
      const options = await beginAuthentication(username);

      // 2. Trigger platform authenticator
      const assertionResponse = await startAuthentication(options);

      // 3. Verify + get JWT session token
      const result: AuthResult = await completeAuthentication(assertionResponse, options.challenge);

      setState(prev => ({
        ...prev,
        isLoading: false,
        user: result.user,
        sessionToken: result.token,
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Authentication failed.',
      }));
      return false;
    }
  }, []);

  // ── Session recovery ──────────────────────────────────────────

  const recoverSession = useCallback(async (): Promise<boolean> => {
    const token = getSessionToken();
    if (!token) return false;

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await verifySession();
      if (result && result.user) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          user: result.user,
          sessionToken: token,
        }));
        return true;
      }
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await logoutSession();
    setState(prev => ({ ...prev, user: null, error: null, sessionToken: null }));
  }, []);

  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  return { ...state, register, authenticate, logout, clearError, recoverSession };
}
