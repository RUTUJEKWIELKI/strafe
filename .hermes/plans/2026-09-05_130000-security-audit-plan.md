# Security Audit & Implementation Plan: Strafe App

## Goal

Implement missing OWASP security controls (XSS sanitization, Web CSP, CAPTCHA bot protection, and PII at-rest encryption) to complete the security posture, building on top of the already robust existing protections.

## Current Context / What is ALREADY DONE

Based on the codebase analysis, Strafe already has excellent security foundations:

1. **Infrastructure & DDoS:** Strict per-route rate limiting is fully implemented using `@fastify/rate-limit` across sensitive endpoints (auth, files, messages).
2. **WebRTC IP Leaks:** Completely mitigated by using the **LiveKit** SDK (SFU architecture), meaning users connect to the server, never P2P, protecting their IPs.
3. **Session & Auth:** Strong WebAuthn/2FA support, Argon2 password hashing, and excellent session management (opaque refresh tokens with rotation and reuse detection).
4. **File Uploads:** Async processing with **ClamAV** integration exists (`file-processing.service.ts`). Isolation is handled by returning **S3 presigned URLs** (files are on a separate domain). **EXIF data is automatically stripped** because `sharp` does not retain metadata by default during optimization.
5. **E2EE:** End-to-end encryption is heavily implemented for both messages and file uploads.

## Architecture / Proposed Approach for MISSING Items

While the API and desktop environments are secure, the web client lacks a strict Content Security Policy (CSP). Furthermore, Markdown rendering dependencies exist (`micromark`, `dompurify`) but are not yet wired up securely. Lastly, automated bot protection (CAPTCHA) on registration and at-rest database encryption for PII (emails) are missing.
We will add a strict CSP to the HTML, create a guaranteed-safe Markdown rendering helper, integrate a Turnstile CAPTCHA validator into the auth route, and implement AES-256-GCM for database fields.

## Step-by-Step Tasks

### Task 1: Add Content Security Policy to Web App

**File:** `apps/web/index.html`
**Action:** Add a strict CSP meta tag in the `<head>` to prevent malicious inline scripts and unauthorized external resources.
**Code:**

```html
<!-- Add this inside the <head> block, below the viewport meta tag -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; connect-src 'self' wss: https:; font-src 'self' data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;"
/>
```

**Verification:**
Run `pnpm --filter @strafe/web dev`. Open the browser console and verify no legitimate assets are blocked by CSP, but inline `<script>alert(1)</script>` injected via DevTools throws a CSP violation.

### Task 2: Create a Secure Markdown + DOMPurify Renderer

**File:** `apps/web/src/lib/markdown.ts` (Create this file)
**Action:** Wire up `micromark` and `dompurify` to create a strictly sanitized HTML output for user messages.
**Code:**

```typescript
import DOMPurify from 'dompurify'
import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'

/**
 * Parses Markdown to HTML and sanitizes it to prevent XSS.
 * All user-generated rich text must pass through this function.
 */
export function renderSafeMarkdown(rawMarkdown: string): string {
  const rawHtml = micromark(rawMarkdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  })

  // DOMPurify strips out <script>, on* handlers, and malicious links (javascript:)
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'del',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  })
}
```

**Verification:**
Write a quick test file `apps/web/src/lib/markdown.test.ts`.
Run `pnpm --filter @strafe/web test` to ensure `renderSafeMarkdown('<script>alert("XSS")</script>')` outputs an empty string or sanitized text without the script tag.

### Task 3: Add CAPTCHA (Turnstile) validation to Registration

**File:** `apps/api/src/routes/auth.ts`
**Action:** Require a `captchaToken` in the registration body and validate it against the Cloudflare Turnstile API.
**Code:**

1. In `packages/shared/src/schemas/...` (or wherever `RegisterBodySchema` is), add `captchaToken: Type.String()`.
2. In `auth.ts`, update the `register` route handler:

```typescript
// Inside the POST /auth/register handler, before creating the user:
if (app.config.NODE_ENV === 'production') {
  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: app.config.TURNSTILE_SECRET_KEY,
        response: request.body.captchaToken,
        remoteip: request.ip,
      }),
    },
  )
  const outcome = await verifyRes.json()
  if (!outcome.success) {
    throw new AppError({
      code: 'CAPTCHA_FAILED',
      message: 'Bot verification failed',
      statusCode: 400,
    })
  }
}
```

**Verification:**
Run `pnpm api:dev`. Send a POST request to `/api/auth/register` without a valid token and assert it fails with 400 `CAPTCHA_FAILED`.

### Task 4: Implement At-Rest Encryption Utility for PII

**File:** `apps/api/src/lib/encryption.ts` (Create this file)
**Action:** Create a standard AES-256-GCM encrypt/decrypt wrapper to be used on the `users.email` field in the database.
**Code:**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'

// In a real implementation, this key comes from app.config.DB_ENCRYPTION_KEY (32 bytes)
export function encryptPII(text: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag().toString('base64')
  return `${iv.toString('base64')}:${authTag}:${encrypted}`
}

export function decryptPII(cipherText: string, key: Buffer): string {
  const [iv64, authTag64, encrypted] = cipherText.split(':')
  if (!iv64 || !authTag64 || !encrypted)
    throw new Error('Invalid cipher format')

  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag64, 'base64'))
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

**Verification:**
Create `apps/api/src/lib/encryption.test.ts`. Write a test that encrypts and decrypts an email address successfully. Verify that modifying the cipher text throws an Auth Tag validation error. Run with `pnpm api:test`.

## Risks & Tradeoffs

- **Searchability:** Encrypting the `email` column at-rest means we can no longer do `LIKE %@domain.com%` searches in the database. Exact matches require encrypting the search term first (deterministic encryption) or hashing the email to a blind index column.
- **CSP strictness:** The CSP in Task 1 blocks `eval()`. If any SolidJS dev tools or dependencies rely on `eval`, they may break in development, requiring a looser CSP for `NODE_ENV=development`.
- **CAPTCHA UX:** Adding CAPTCHA adds friction to signup, but is practically required for public communication platforms to stop spam accounts. Turnstile was chosen over reCAPTCHA as it is mostly invisible and privacy-respecting.
