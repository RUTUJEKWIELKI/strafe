# Authentication

Strafe uses short-lived bearer access tokens and rotating refresh tokens. Treat
them as different credentials: access tokens may be sent to REST endpoints and
the WebSocket gateway, while refresh tokens belong only in session-management
requests and protected client storage.

## Register an account

```bash
curl --request POST http://localhost:3000/api/auth/register \
  --header "Content-Type: application/json" \
  --data '{
    "displayName": "Ada Lovelace",
    "email": "ada@example.test",
    "handle": "ada",
    "password": "correct-horse-battery-staple"
  }'
```

The response contains `user` and `tokens`. Save the refresh token before making
another authentication request. The default access lifetime is 15 minutes; the
default refresh lifetime is 30 days.

## Authorize a request

```bash
curl http://localhost:3000/api/users/@me \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN"
```

An access token identifies one user session. Do not put it in a query string or
application log.

## Refresh a session

```bash
curl --request POST http://localhost:3000/api/auth/refresh \
  --header "Content-Type: application/json" \
  --data "{\"refreshToken\":\"$STRAFE_REFRESH_TOKEN\"}"
```

A successful refresh returns a new access token and a new refresh token. Replace
the stored pair as one operation. Reusing an old rotated token is treated as a
security event and may revoke the token family.

## Log out and revoke devices

`POST /api/auth/logout` revokes the supplied refresh token. Account-security
endpoints provide broader controls:

- `GET /api/users/@me/sessions` lists active devices and sessions;
- `DELETE /api/users/@me/sessions/{sessionId}` revokes one session;
- `DELETE /api/users/@me/sessions` revokes all sessions, optionally preserving
  the current one.

Password changes, password resets, e-mail changes, and session revocations are
recorded in the account security log.

## Client rules

- Keep access tokens in memory where possible.
- Store refresh tokens with the platform's protected credential mechanism.
- Refresh once after an authentication failure, then require login if rotation
  fails.
- Never send a refresh token to Scalar's **Authorize** control or to the
  WebSocket gateway.
