# Voice with LiveKit

Strafe authorizes voice access; LiveKit transports audio, video, and data. The
API does not relay media and does not expose LiveKit server credentials.

## Join flow

1. Authenticate to Strafe and choose a `voice` or `stage` channel.
2. Call `POST /api/channels/{channelId}/voice/token` with the access token.
3. The API verifies `ConnectVoice` and channel type.
4. Connect the LiveKit client to the returned `livekitUrl` with the returned
   token before `expiresAt`.

The token lasts 60 seconds, uses the Strafe user ID as its LiveKit identity, and
is restricted to the channel ID as its room. It permits joining, publishing,
subscribing, and data publishing. Once connected, LiveKit owns participant and
media transport behavior.

The endpoint returns `400` for a non-voice channel, `403` when authorization
fails, and `503` when `LIVEKIT_URL`, `LIVEKIT_API_KEY`, or
`LIVEKIT_API_SECRET` is not configured. Request a fresh token for a new join;
never persist it as a long-lived session credential.
