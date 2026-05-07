/**
 * Server-side SIWS utilities (no "use client" directive).
 * Parses Sign-In With Solana messages.
 */

export function parseSIWSMessage(message: string): {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
} | null {
  const lines = message.split("\n");

  const domainMatch = lines[0]?.match(/^(.+) wants you to sign in/);
  const domain = domainMatch?.[1];
  const address = lines[1];
  const nonceMatch = lines.find((l) => l.startsWith("Nonce:"))?.match(/Nonce: (.+)/);
  const issuedAtMatch = lines.find((l) => l.startsWith("Issued At:"))?.match(/Issued At: (.+)/);
  const expiresAtMatch = lines.find((l) => l.startsWith("Expiration Time:"))?.match(/Expiration Time: (.+)/);

  if (!domain || !address || !nonceMatch || !issuedAtMatch || !expiresAtMatch) {
    return null;
  }

  return {
    domain,
    address,
    nonce: nonceMatch[1],
    issuedAt: issuedAtMatch[1],
    expiresAt: expiresAtMatch[1],
  };
}
