# Roles and Permissions

Permissions are stored as 63-bit fields and represented as decimal strings in
JSON. Strings avoid precision loss in JavaScript, where ordinary numbers cannot
represent every supported bit exactly.

## Permission bits

Each permission occupies one bit. Common values include:

| Permission           |         Decimal value |
| -------------------- | --------------------: |
| View channels        |                   `1` |
| Send messages        |                   `2` |
| Read message history |                   `4` |
| Manage messages      |                   `8` |
| Manage channels      |                 `512` |
| Manage roles         |                `1024` |
| Create invites       |                `2048` |
| Kick members         |                `4096` |
| Ban members          |                `8192` |
| View audit log       |               `16384` |
| Manage server        |               `32768` |
| Administrator        | `4611686018427387904` |

Combine permissions with bitwise OR using `bigint`. For example, viewing a
channel and sending messages produces `"3"`.

## Create a role

```bash
curl --request POST http://localhost:3000/api/servers/$SERVER_ID/roles \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"name":"Editor","color":"#7C3AED","permissions":"15"}'
```

The API prevents callers from granting permissions above their own authority.
The default role cannot be deleted, and role hierarchy updates require the full
ordered list of non-default role IDs.

## Channel overrides

An override targets either a role or one member. It contains separate allow and
deny bitsets:

```bash
curl --request PUT \
  http://localhost:3000/api/channels/$CHANNEL_ID/permission-overwrites/role/$ROLE_ID \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"allowBits":"1","denyBits":"2"}'
```

This example allows the role to view the channel and denies sending messages.

## Evaluation order

The API resolves channel permission in this order:

1. combine the member's base role permissions;
2. apply the default-role overwrite;
3. combine and apply all matching role overwrites;
4. apply the member-specific overwrite.

Within each step, denied bits are removed before allowed bits are added. The
`Administrator` bit bypasses ordinary permission checks, but ownership and
anti-escalation rules still protect sensitive management operations.
