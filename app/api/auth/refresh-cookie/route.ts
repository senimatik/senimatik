import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { importJWK, jwtVerify } from "jose";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// POST /api/auth/refresh-cookie — refresh the HttpOnly role cookie
// Requires JWT authentication to prevent impersonation
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Extract public key from private key JWK (ES256 uses ECDSA)
    // The public key is the private key without the 'd' parameter
    const privateKeyJwk = JSON.parse(process.env.AUTH_SIGNING_PRIVATE_KEY_JWK!);
    const publicKeyJwk = {
      kty: privateKeyJwk.kty,
      crv: privateKeyJwk.crv,
      x: privateKeyJwk.x,
      y: privateKeyJwk.y,
    };

    const publicKey = await importJWK(publicKeyJwk, "ES256");

    const verified = await jwtVerify(token, publicKey, {
      issuer: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
      audience: "senimatik",
    });

    // Extract walletAddress from JWT subject (set during /api/auth signing)
    const walletAddress = verified.payload.sub;
    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Look up user's role from Convex (source of truth)
    const convex = new ConvexHttpClient(CONVEX_URL);
    const user = await convex.query(api.users.getByWalletWithRole, { walletAddress });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set HttpOnly cookie with server-verified role
    const response = NextResponse.json({ role: user.role });
    response.cookies.set("senimatik_role", user.role, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to refresh cookie" }, { status: 401 });
  }
}
