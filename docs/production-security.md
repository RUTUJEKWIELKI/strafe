# Production security baseline

Production configuration is intentionally fail closed. `APP_PUBLIC_URL` and every
CORS origin must be explicit HTTPS origins. Set `TRUST_PROXY_CIDRS` to the comma
separated CIDRs of the actual load balancers; never use `true` or a hop count.
HSTS is emitted only when Fastify observes HTTPS through one of those trusted
proxies.

PostgreSQL uses certificate validation when `DATABASE_SSL=require`. Redis must use
`rediss://`, and a custom S3 endpoint must use HTTPS. Production rate limiting and
realtime require Redis. Keep the database CA in the platform trust store.

## Secret delivery and JWT rotation

Workload identity should grant the API service account read access only to its own
secret-manager paths. The deployment agent renders secrets into memory-backed,
read-only files under `/run/secrets`; it must not create a production `.env` file.
`AUTH_JWT_KEYSET_FILE` points at JSON in this form:

```json
{
  "activeKid": "2026-09",
  "keys": [
    {
      "kid": "2026-09",
      "privateKey": "-----BEGIN PRIVATE KEY-----...",
      "publicKey": "-----BEGIN PUBLIC KEY-----..."
    },
    {
      "kid": "2026-08",
      "publicKey": "-----BEGIN PUBLIC KEY-----...",
      "retireAt": "2026-09-03T12:00:00Z"
    }
  ]
}
```

Generate RSA keys in the secret manager/HSM. Rotate by publishing the new public
key, then making its `kid` active. Retain only the previous public key until
`retireAt`, which should be no longer than access-token TTL plus clock skew; remove
the old private key immediately. Access tokens are capped at 15 minutes in
production. Protect enabled metrics with `METRICS_BEARER_TOKEN_FILE` and a
network policy.

## Least privilege, backups, and recovery

Use distinct service accounts for API, migrations, backup, and restore-test jobs.
The API gets DML on its schema and object access only to its bucket prefix; only
migrations get DDL. The backup account gets snapshot/export permissions but no
application secret access. Encrypt backups with a dedicated KMS key whose admins
differ from production KMS administrators, enable immutable retention, and deny
the API account decrypt permission.

Run encrypted PostgreSQL and object-store backups daily. Each month, restore the
latest backup into an isolated account/network using a restore-only identity,
validate checksums and migrations, run API smoke tests, record RPO/RTO, then
destroy the environment. Alert if either the backup or restore-test evidence is
missing. CI scans dependencies and Git history, emits a CycloneDX SBOM, and
keylessly attests it; production promotion must verify the attestation and commit
identity before deployment.
