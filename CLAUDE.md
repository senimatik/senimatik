# Senimatik — Claude Code Guidelines

## Project Stack
Next.js 15 (App Router) · Convex · Solana Wallet Adapter · Solana · TailwindCSS · framer-motion · tw-animate-css

---

## Rules (from Vercel React Best Practices Audit)

### 1. Wallet Address — Always use the shared hook
Never extract the wallet address inline. Use the shared hook:
```ts
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
const walletAddress = useWalletAddress();
```
Do NOT copy-paste the `publicKey.toBase58()` pattern throughout components.

---

### 2. Wallet Connection State — Use useWallet
For wallet connection state, use the wallet adapter hook:
```ts
import { useWallet } from "@solana/wallet-adapter-react";
const { connected, connecting, disconnect } = useWallet();
```
For opening the connect modal:
```ts
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
const { setVisible: openWalletModal } = useWalletModal();
openWalletModal(true);
```

---

### 3. Providers — Instantiate clients inside the component
`QueryClient` and `ConvexReactClient` must be created inside `useState` in `Providers`, not at module scope. Module-level instances are shared across SSR requests and can leak data between users.
```ts
// ✅ correct (app/providers.tsx)
const [queryClient] = useState(() => new QueryClient());
const [convex] = useState(() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!));
```

---

### 4. Solana Connection — Hoist to module level
`new Connection(...)` is expensive. Never create it inside a `queryFn` or component body. Hoist it to module scope.
```ts
// ✅ correct (top of file, outside component)
const solanaConnection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
```

---

### 5. Navigation — Use router.push, never window.location.href
Always use Next.js client-side navigation to avoid full page reloads.
```ts
// ✅
router.push("/discover");
// ❌
window.location.href = "/discover";
```

---

### 6. next/image — Always add sizes on fill images
Every `<Image fill>` must have a `sizes` prop. Without it, Next.js defaults to `100vw` and serves oversized images.
```tsx
// ✅
<Image fill sizes="(max-width: 768px) 100vw, 320px" ... />
// ❌
<Image fill ... />
```

---

### 7. framer-motion — Use only where needed
framer-motion is always loaded (Navbar uses it on every page), so the bundle cost is fixed. Only use it where it provides features CSS cannot replicate:

| Use framer-motion | Use CSS (`animate-in` from tw-animate-css) |
|---|---|
| `drag` interactions | Simple entrance (opacity, translate) |
| `layoutId` shared element transitions | Staggered list entrances |
| `AnimatePresence` exit animations | Progress bar width animations |
| Spring physics transitions | Hover/focus transitions |

For staggered CSS entrances use `animationDelay` inline style:
```tsx
<div
  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
  style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
/>
```

For progress bar animations use the `progress-grow` keyframe (defined in `globals.css`):
```tsx
<div
  style={{
    "--progress-width": `${value}%`,
    width: `${value}%`,
    animation: "progress-grow 1.5s ease-out",
  } as React.CSSProperties}
/>
```

---

### 8. State Updates — Use functional setState when reading previous state
```ts
// ✅
setCards((prev) => {
  const next = [...prev];
  next.push(next.shift()!);
  return next;
});
// ❌
const newCards = [...cards];
newCards.push(newCards.shift()!);
setCards(newCards);
```

---

### 9. Long lists — Add content-visibility: auto
For grids or lists that can grow large, add `[content-visibility:auto]` to each item so the browser skips off-screen rendering.
```tsx
<div className="... [content-visibility:auto]">
```
Do not apply to items inside framer-motion `layout` animated grids — it may interfere with layout measurements.

---

### 10. Barrel imports — Phosphor icons are fine
`@phosphor-icons/react` barrel imports are already tree-shaken by the bundler. No need for individual path imports.

---

## Security

### Role Cookie — HttpOnly, server-side set
The `senimatik_role` cookie MUST be set server-side with HttpOnly to prevent client-side forgery. Never use `document.cookie` to set role.

Flow (Sign-In With Solana):
1. User connects wallet via Solana Wallet Adapter
2. `useWalletAuth` hook fetches nonce from `/api/auth/nonce`
3. User signs SIWS message with wallet
4. Hook sends { publicKey, message, signature } to `/api/auth`
5. Server verifies ed25519 signature, issues Convex JWT, sets HttpOnly role cookie

The middleware provides UX-level route hiding only. Real security is enforced server-side in Convex via `requireRole` helpers. Never trust the role cookie for access control.

---

## Architecture Notes
- **Auth**: Solana Wallet Adapter with SIWS (Sign-In With Solana). Wallet signs a message to prove ownership, server verifies and issues Convex JWT.
- **Role guard**: Cookie-based (`senimatik_role`) in `middleware.ts`. Role is verified server-side via `/api/auth` after SIWS.
- **Database**: Convex. All mutations require `walletAddress` as caller identity — backend verifies role via `requireRole`.
- **File uploads**: R2 via presigned URLs (Step1Artwork). Upload flow is partially stubbed.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
