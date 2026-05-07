import { NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const NONCE_SECRET = process.env.AUTH_NONCE_SECRET || "dev-nonce-secret-change-me";
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function signNonce(nonce: string, expiresAt: number): Buffer {
  const data = `${nonce}:${expiresAt}`;
  return createHmac("sha256", NONCE_SECRET).update(data).digest();
}

export function verifyNonce(nonce: string, expiresAt: number, signature: string): boolean {
  const expectedSig = signNonce(nonce, expiresAt);
  const providedSig = Buffer.from(signature, "hex");

  // Timing-safe comparison to prevent timing attacks
  if (expectedSig.length !== providedSig.length) return false;
  if (!timingSafeEqual(expectedSig, providedSig)) return false;
  if (Date.now() > expiresAt) return false;
  return true;
}

// GET /api/auth/nonce — generate a signed, time-limited nonce
export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + NONCE_EXPIRY_MS;
  const signature = signNonce(nonce, expiresAt).toString("hex");

  return NextResponse.json({
    nonce,
    expiresAt,
    signature,
  });
}
