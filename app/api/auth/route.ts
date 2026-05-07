import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { importJWK, SignJWT } from "jose";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyNonce } from "./nonce/route";
import { parseSIWSMessage } from "@/lib/siws-server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// POST /api/auth — verify SIWS signature and issue Convex JWT + role cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, message, signature, nonce, expiresAt, nonceSignature } = body;

    // 1. Validate required fields
    if (!publicKey || !message || !signature || !nonce || !expiresAt || !nonceSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify the nonce is valid and not expired
    if (!verifyNonce(nonce, expiresAt, nonceSignature)) {
      return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
    }

    // 3. Parse and validate the SIWS message
    const parsed = parseSIWSMessage(message);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    // Verify nonce in message matches the provided nonce
    if (parsed.nonce !== nonce) {
      return NextResponse.json({ error: "Nonce mismatch" }, { status: 401 });
    }

    // Verify the wallet address in the message matches the public key
    if (parsed.address !== publicKey) {
      return NextResponse.json({ error: "Address mismatch" }, { status: 401 });
    }

    // 4. Verify the ed25519 signature
    const messageBytes = new TextEncoder().encode(message);
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;

    try {
      signatureBytes = bs58.decode(signature);
      publicKeyBytes = bs58.decode(publicKey);
    } catch {
      return NextResponse.json({ error: "Invalid signature encoding" }, { status: 400 });
    }

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 5. The wallet address is the public key (base58 encoded)
    const walletAddress = publicKey;

    // 6. Look up user's role from Convex (or create user if doesn't exist)
    const convex = new ConvexHttpClient(CONVEX_URL);
    let user = await convex.query(api.users.getByWalletWithRole, { walletAddress });

    if (!user) {
      // Create user if this is their first sign-in
      const newUser = await convex.mutation(api.users.getOrCreate, { walletAddress });
      user = { role: newUser?.role ?? "user" };
    }

    // 7. Sign a Convex JWT with sub = walletAddress
    const privateKeyJwk = JSON.parse(process.env.AUTH_SIGNING_PRIVATE_KEY_JWK!);
    const privateKey = await importJWK(privateKeyJwk, "ES256");

    const token = await new SignJWT({
      walletAddress,
    })
      .setProtectedHeader({ alg: "ES256", kid: "senimatik-1" })
      .setIssuedAt()
      .setIssuer(process.env.NEXT_PUBLIC_CONVEX_SITE_URL!)
      .setAudience("senimatik")
      .setSubject(walletAddress)
      .setExpirationTime("1h")
      .sign(privateKey);

    // 8. Set HttpOnly cookie with server-verified role
    const response = NextResponse.json({ token, role: user.role });
    response.cookies.set("senimatik_role", user.role, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

// DELETE /api/auth — clear the role cookie
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("senimatik_role");
  return response;
}
