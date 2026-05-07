import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Serve our public JWKS so Convex can verify JWTs we sign in /api/convex-token
http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    const publicKeyJwk = JSON.parse(process.env.AUTH_PUBLIC_KEY_JWK!);
    return new Response(JSON.stringify({ keys: [{ ...publicKeyJwk, kid: "senimatik-1" }] }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
