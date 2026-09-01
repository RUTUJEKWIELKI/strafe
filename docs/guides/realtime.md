# Realtime Gateway

The WebSocket gateway delivers presence, typing, messages, membership changes,
and other outbox-backed events. Connect to:

```text
ws://localhost:3000/api/gateway
```

Frames use `{ "op": string, "d": object }`.

## Identify the connection

The server first sends `hello` with a gateway session ID, heartbeat interval,
and resume mode. Send `identify` within 10 seconds:

```json
{
  "op": "identify",
  "d": {
    "token": "STRAFE_ACCESS_TOKEN",
    "lastStreamId": "1725123456789-0"
  }
}
```

Omit `lastStreamId` on a new connection. After authentication, `ready` contains
the user ID, active server IDs, presence, and gateway session ID.

## Keep the connection alive

Send a heartbeat at the interval from `hello`, currently 25 seconds:

```json
{ "op": "heartbeat", "d": {} }
```

The server replies with `heartbeat_ack`. A connection that misses the interval
plus the configured grace period is closed.

## Subscribe to a channel

```json
{
  "op": "subscribe",
  "d": { "channelId": "123e4567-e89b-12d3-a456-426614174000" }
}
```

The gateway verifies `ViewChannel` before adding the subscription. Server-wide
events are available from membership rooms; channel-specific events require a
channel subscription.

## Resume safely

Persist the greatest `streamId` after applying each event. On reconnect, include
it in `identify`. The gateway replays later visible events and sends `resumed`.
If Redis no longer contains the requested window, it sends:

```json
{
  "op": "resync_required",
  "d": { "reason": "resume_window_unavailable" }
}
```

In that case, reload durable state through REST before accepting new realtime
events. Always deduplicate by `eventId`; a reconnect may overlap an event already
applied by the client.

## Limits and failures

- Frames larger than `GATEWAY_MAX_FRAME_BYTES` close with code `1009`.
- Excess commands or outbound backpressure close with code `4008`.
- Five invalid frames close with code `4002`.
- Typing events are accepted at most once per channel every four seconds and
  expire after ten seconds.
- Presence may be `online`, `idle`, `dnd`, or `invisible` while connected.
