---
name: strafe-bot-api-typescript-sdk
description: "TypeScript SDK for Strafe Bot API. Use when writing TypeScript code that calls Strafe Bot API with the @strafe/strafe-bot-api package: installing it, constructing and authenticating the client, and calling API operations."
---

# Strafe Bot API TypeScript SDK

Generated TypeScript client for Strafe Bot API, published as `@strafe/strafe-bot-api`. Use the generated client instead of hand-writing HTTP requests.

## Install

```sh
npm install @strafe/strafe-bot-api
```

## Client setup and authentication

```ts
import StrafeBotAPI from '@strafe/strafe-bot-api';

const client = new StrafeBotAPI();
```

Provide credentials using the options below. Environment variables are read automatically when the target runtime supports them:

- `strafeBotToken` (env: `STRAFE_BOT_TOKEN`) — Authenticate using a scoped Strafe bot token with Bearer authorization.

## Calling operations

```ts
import StrafeBotAPI from '@strafe/strafe-bot-api';

const client = new StrafeBotAPI();

const user = await client.users.listCurrent();

console.log(user);
```

Method names, parameter shapes, and response types are generated from the API description — do not guess them. Look up the exact call signature in [api.md](./api.md) before writing a call.

## Error handling

Non-success responses throw generated API errors. Error objects expose status, headers, response body, and request metadata where the target runtime supports it.

```ts
import { APIError } from '@strafe/strafe-bot-api';

try {
  const user = await client.users.listCurrent();
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

## Requirements

- Node.js 20+, a modern browser, or any runtime with `fetch` support

## Reference files

- [README.md](./README.md) — full feature tour: client options, request options, retries and timeouts, logging.
- [api.md](./api.md) — complete catalogue of every operation with request and response types.
