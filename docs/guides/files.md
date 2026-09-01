# Files and Attachments

Files are uploaded directly to S3-compatible storage with signed multipart
URLs. The API records ownership and lifecycle state, but it does not proxy the
file body.

```mermaid
flowchart LR
  Pending[pending] --> Quarantine[quarantined]
  Quarantine --> Processing[processing]
  Processing --> Ready[ready]
  Processing --> Rejected[rejected]
  Pending --> Deleted[deleted]
  Ready --> Deleted
```

## 1. Initiate an upload

```bash
curl --request POST http://localhost:3000/api/files/uploads \
  --header "Authorization: Bearer $STRAFE_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "originalName": "diagram.png",
    "mimeType": "image/png",
    "purpose": "attachment",
    "sizeBytes": 248392,
    "serverId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

The response contains `uploadId`, `fileId`, part size, expiry, and initial signed
part URLs. MIME type, purpose, configured size limit, and user quota are checked
before storage is allocated.

## 2. Upload every part

Send each byte range to its signed URL with `PUT`. Save the `ETag` response
header. Request another URL through
`POST /api/files/uploads/{uploadId}/parts` when a part URL expires.

## 3. Complete the upload

```json
{
  "parts": [{ "partNumber": 1, "etag": "returned-storage-etag" }]
}
```

POST this body to `/api/files/uploads/{uploadId}/complete`. Parts must be unique,
ordered, and complete. The object moves to `quarantined`; it is not attachable
yet.

## 4. Wait for processing

Poll `GET /api/files/{fileId}` or listen for `file.ready` and `file.rejected`
events. Processing verifies detected MIME type, scans with ClamAV, removes image
metadata through re-encoding, and creates supported image, video, or audio
variants.

When scanning is required but unavailable, the file remains quarantined rather
than becoming public. This is intentional fail-closed behavior.

## 5. Attach or download

Only a `ready` file can be attached to a message. The message service verifies
ownership and conversation scope. Downloads use
`GET /api/files/{fileId}/download`, which returns a short-lived authorized URL.

Abort an unfinished upload with `DELETE /api/files/uploads/{uploadId}`. A cleanup
worker also expires abandoned multipart uploads.
