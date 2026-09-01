# Create a Community

This walkthrough creates a server, adds a category and channel, and produces an
invite. Every request after registration uses an access token.

## Create the server

```bash
curl --request POST http://localhost:3000/api/servers \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "Workshop",
    "description": "A place for project discussion",
    "visibility": "private"
  }'
```

The response includes the server and its `defaultChannelId`. Keep the server ID
for later requests. The creator becomes the owner and receives the initial
membership and default role.

## Add a category

```bash
curl --request POST http://localhost:3000/api/servers/$SERVER_ID/channels \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"name":"Projects","type":"category"}'
```

Use the returned category ID as `parentId` when creating a child channel:

```bash
curl --request POST http://localhost:3000/api/servers/$SERVER_ID/channels \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"name\":\"build-log\",\"type\":\"text\",\"parentId\":\"$CATEGORY_ID\",\"topic\":\"Daily progress and decisions\"}"
```

Categories and channels use the same resource model. Reordering replaces the
complete active channel list through `PUT /api/servers/{serverId}/channels/order`.

## Create an invite

```bash
curl --request POST http://localhost:3000/api/servers/$SERVER_ID/invites \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"expiresInSeconds":86400,"maxUses":25}'
```

Another authenticated user joins with `POST /api/invites/{code}/join`. The API
checks expiry, usage limits, bans, and existing membership in one transaction.

## Continue configuring

- Create roles and channel rules with the
  [permissions guide](./permissions.md).
- Use `GET /api/servers/{serverId}/audit-log` to review administrative changes.
- Use the [interactive API reference](../../api/reference.md) for update,
  ownership transfer, moderation, and member-management request shapes.
