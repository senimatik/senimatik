import { AuthConfig } from "convex/server";

// Convex validates JWTs signed by our /api/auth route.
// The route verifies SIWS signature, then signs a JWT with sub = walletAddress.
// Public key is served from the Convex HTTP action at /.well-known/jwks.
export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "senimatik",
      issuer: "https://sleek-caterpillar-31.convex.site",
      jwks: "https://sleek-caterpillar-31.convex.site/.well-known/jwks.json",
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
