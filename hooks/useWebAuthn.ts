import { useState, useCallback, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import {
  beginRegistration,
  completeRegistration,
  beginAuthentication,
  completeAuthentication,
  WebAuthnUser,
} from '../services/webauthnService';

interface UseWebAuthnState {
  isLoading: boolean;
  error: string | null;
  user: WebAuthnUser | null;
  isSupported: boolean;
  isPlatformAvailable: boolean | null;
}

interface UseWebAuthnReturn extends UseWebAuthnState {
  register: (username: string) => Promise<boolean>;
  authenticate: (username: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

/**
 * React hook for WebAuthn biometric authentication.
 * Uses @simplewebauthn/browser for credential operations.
 *
 * Flow:
 *   1. Call register(username) once per user to enroll fingerprint
 *   2. Call authenticate(username) to login with fingerprint
 *   3. On success, user state is populated with { id, username, displayName }
 */
export function useWebAuthn(): UseWebAuthnReturn {
  const [state, setState] = useState<UseWebAuthnState>({
    isLoading: false,
    error: null,
    user: null,
    isSupported: false,
    isPlatformAvailable: null,
  });

  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    setState(prev => ({ ...prev, isSupported: supported }));

    if (supported) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setState(prev => ({ ...prev, isPlatformAvailable: available })))
        .catch(() => setState(prev => ({ ...prev, isPlatformAvailable: false })));
    }
  }, []);

  const register = useCallback(async (username: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const options = await beginRegistration(username);
      const attestationResponse = await startRegistration(options);
      await completeRegistration(options.user.id, attestationResponse);
      setState(prev => ({
        ...prev, isLoading: false,
        user: { id: options.user.id, username, displayName: options.user.displayName },
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Registration failed.' }));
      return false;
    }
  }, []);

  const authenticate = useCallback(async (username: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const options = await beginAuthentication(username);
      const assertionResponse = await startAuthentication(options);
      const result = await completeAuthentication(assertionResponse, options.challenge);
      setState(prev => ({
        ...prev, isLoading: false,
        user: { id: result.user.id, username: result.user.username, displayName: result.user.display_name || result.user.username },
      }));
      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Authentication failed.' }));
      return false;
    }
  }, []);

  const logout = useCallback(() => setState(prev => ({ ...prev, user: null, error: null })), []);
  const clearError = useCallback(() => setState(prev => ({ ...prev, error: null })), []);

  return { ...state, register, authenticate, logout, clearError };
}
