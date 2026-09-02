# E2EE verification and release gate

E2EE protocol version 1 remains **experimental**. Shared, deterministic vectors
in `packages/shared/test-vectors/e2ee-v1.json` are consumed without translation
by both the browser TypeScript and Tauri Rust suites. They cover session setup,
out-of-order and missing messages, epoch rotation, device addition/removal, and
membership changes. The suites also reject replay, ciphertext/tag modification,
bad device signatures, nonce reuse, key rollback, stale epochs, and unregistered
devices.

The API residue-control helper must be wired to dumps/readers for PostgreSQL,
Redis, the search index, transactional outbox, captured application logs, and
object storage in a production-like CI environment. Its sentinels are a unique
message plaintext and attachment filename. A hit in any byte stream fails the
run; encrypting or deleting only the primary message row is not sufficient.

Parser fuzzing is deterministic in the ordinary test suite (20,000 gateway
frames plus Rust `proptest` envelope cases), making regressions reproducible.
Long-running coverage-guided fuzz jobs and deployment-capacity load tests belong
in the security CI environment and must retain their corpus and reports.

## Stable-release gate

Do not change `security/e2ee-release.json` to `stable` until an independent
cryptography specialist has reviewed the protocol, key/device lifecycle,
implementations, and threat model. The audit report, scope, auditor identity,
date, commit hash, findings, and remediation evidence must be committed or
linked in `independentAudit`. Product or implementation-team review is not an
independent audit. A test suite cannot substitute for one.
