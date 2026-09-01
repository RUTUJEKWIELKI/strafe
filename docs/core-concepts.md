# Core Concepts

Strafe uses a small set of domain concepts across REST, realtime events, and the
database. Learning these terms makes the API easier to follow.

## Accounts, devices, and sessions

A user owns an account and may have several devices. Logging in creates a
server-side session associated with a device and returns an access token plus a
refresh token. Access tokens authenticate ordinary API and gateway requests.
Refresh tokens rotate credentials and can be revoked without deleting the
account.

## Servers and members

A server is a community with one owner. Users participate through membership
records, which carry role assignments, timeout state, and a permission version.
Invites create or reactivate memberships. Leaving, kicking, banning, and
transferring ownership are separate operations with different authorization
rules.

## Channels and categories

Channels belong to a server or to a direct-message conversation. Categories are
channels used as parents for display ordering. Text, announcement, forum, voice,
stage, thread, and direct-message types share the same basic channel model.

Channel order is replaced as a complete list. This makes reordering atomic and
prevents two partial updates from leaving duplicate or missing positions.

## Roles and permissions

Roles contain permission bitsets encoded as decimal strings. Members inherit the
combined permissions of their roles. A channel can then allow or deny bits for a
role or a specific member.

The server owner remains the final authority. Role editing and channel
overwrites reject changes that would let an actor grant permissions they do not
hold. See [Roles and permissions](./guides/permissions.md) for the evaluation
model.

## Messages and attachments

Messages belong to channels. The API checks channel visibility and send
permission for every mutation. Attachments must be ready, owned by the author,
and scoped to the relevant server or direct-message conversation before they can
be referenced by a message.

## Presence and realtime events

Presence is ephemeral and belongs in Redis rather than PostgreSQL. Durable
changes first commit to PostgreSQL with an outbox event. Workers then publish the
event to connected API instances. Clients deduplicate events by `eventId` and
store the latest `streamId` for reconnection.

## Source of truth

PostgreSQL is authoritative for accounts, membership, permissions, messages,
files, and moderation history. Redis may accelerate delivery, but losing Redis
must not invent or rewrite durable state. When a resume window is unavailable,
the gateway requests a full client resync.
