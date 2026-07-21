import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';

const RP_ID = 'localhost'; // Override per-environment via wrangler.toml vars
const RP_NAME = 'Key Cabinet System';
const ORIGIN = 'http://localhost:3000';

export function getRegistrationOptions(user: { id: string; username: string; displayName: string }) {
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: user.id,
    userName: user.username,
    userDisplayName: user.displayName,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'required',
    },
    supportedAlgorithmIDs: [-7, -257],
  });
}

export function getAuthOptions(allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[]) {
  return generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: allowCredentials as any,
    userVerification: 'required',
  });
}
