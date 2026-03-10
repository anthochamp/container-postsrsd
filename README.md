# PostSRSd Container

![GitHub License](https://img.shields.io/github/license/anthochamp/container-postsrsd?style=for-the-badge)
![GitHub Release](https://img.shields.io/github/v/release/anthochamp/container-postsrsd?style=for-the-badge&color=457EC4)
![GitHub Release Date](https://img.shields.io/github/release-date/anthochamp/container-postsrsd?style=for-the-badge&display_date=published_at&color=457EC4)

Container images based on [PostSRSd](https://github.com/roehling/postsrsd), implementing the Sender Rewriting Scheme (SRS) for Postfix.

SRS rewrites the envelope sender address of forwarded messages to prevent SPF failures at the final recipient's mail server. PostSRSd exposes this functionality via a TCP socketmap that Postfix queries at delivery time.

## How to use this image

```shell
docker run -d \
  -p 11380:11380 \
  -v postsrsd-data:/var/lib/postsrsd \
  -e POSTSRSD_SRS_DOMAIN=srs.example.com \
  -e POSTSRSD_LOCAL_DOMAINS=example.com,other.example.com \
  anthochamp/postsrsd
```

## Volumes

- `/var/lib/postsrsd/` — Persists the SRS secret file (`postsrsd.secret`) across container restarts. **Mount a persistent volume** here to avoid invalidating previously rewritten addresses after a restart.

## Ports

| Port  | Protocol | Description                    |
|-------|----------|--------------------------------|
| 11380 | TCP      | SRS TCP socketmap (Postfix)    |

## Configuration

Sensitive values may be loaded from files by appending `__FILE` to any supported `POSTSRSD_`-prefixed variable (e.g. `POSTSRSD_SECRETS__FILE=/run/secrets/postsrsd_secrets`).

### POSTSRSD_SRS_DOMAIN

**Required.** Domain used for SRS address rewriting. This should be a subdomain dedicated to SRS (e.g. `srs.example.com` or `bounce.example.com`) so that rewritten addresses are clearly distinguishable from real addresses and can be routed back correctly on reply.

### POSTSRSD_SECRETS

**Default**: auto-generated

SRS signing secrets, one per line. Used to sign and verify rewritten addresses. If not set and no secret file exists in `/var/lib/postsrsd/`, a random secret is generated automatically at startup.

Use `POSTSRSD_SECRETS__FILE` to load secrets from a Docker secret or mounted file.

### POSTSRSD_LOCAL_DOMAINS

**Default**: *empty*

Comma-separated list of domains whose senders should **not** be rewritten (they are local and do not need SRS). Example: `example.com,other.example.com`.

Refer to [PostSRSd documentation](https://github.com/roehling/postsrsd) for details.

### POSTSRSD_SEPARATOR

**Default**: `=`

SRS tag separator character. Valid values: `=`, `+`, `-`.

### POSTSRSD_HASH_LENGTH

**Default**: `4`

Length of the SRS hash signature (in characters).

### POSTSRSD_HASH_MINIMUM

**Default**: `4`

Minimum acceptable hash length when verifying incoming rewritten addresses. Allows rejecting addresses with shorter (weaker) hashes.

### POSTSRSD_KEEP_ALIVE

**Default**: `30`

Socketmap connection keep-alive timeout in seconds.

### POSTSRSD_ORIGINAL_ENVELOPE

**Default**: `embedded`

How the original envelope sender is stored in the rewritten address:

| Value      | Description                                                                 |
|------------|-----------------------------------------------------------------------------|
| `embedded` | Encoded directly in the SRS address. Stateless; limits senders to 51 chars. |
| `database` | Stored in a database (see `POSTSRSD_ENVELOPE_DATABASE`). No length limit.   |

### POSTSRSD_ENVELOPE_DATABASE

**Default**: *empty*

Required when `POSTSRSD_ORIGINAL_ENVELOPE=database`. Connection string for the sender database.

Examples:

- SQLite: `sqlite:/var/lib/postsrsd/senders.db`
- Redis: `redis:redis-host:6379`

Refer to [PostSRSd documentation](https://github.com/roehling/postsrsd) for supported backends.

### POSTSRSD_ALWAYS_REWRITE

**Default**: `off`

When `on`, rewrite all senders unconditionally, even those already in SRS format.

### POSTSRSD_DEBUG

**Default**: `off`

Set to `on` to enable verbose debug logging.

## Postfix integration

Configure Postfix to use PostSRSd via `sender_canonical_maps` (rewrite on outbound) and `recipient_canonical_maps` (reverse-rewrite on inbound bounce):

```ini
sender_canonical_maps = socketmap:inet:postsrsd:11380:forward
sender_canonical_classes = envelope_sender
recipient_canonical_maps = socketmap:inet:postsrsd:11380:reverse
recipient_canonical_classes = envelope_recipient, header_recipient
```

With the Postfix container, use these variables:

```yaml
POSTFIX_SENDER_CANONICAL_MAP_HOST: postsrsd
POSTFIX_SENDER_CANONICAL_MAP_PORT: "11380"
POSTFIX_SENDER_CANONICAL_MAP_TABLE: forward
POSTFIX_RECIPIENT_CANONICAL_MAP_HOST: postsrsd
POSTFIX_RECIPIENT_CANONICAL_MAP_PORT: "11380"
POSTFIX_RECIPIENT_CANONICAL_MAP_TABLE: reverse
```

## Example Docker Compose

```yaml
services:
  postsrsd:
    image: anthochamp/postsrsd
    volumes:
      - postsrsd-data:/var/lib/postsrsd
    environment:
      POSTSRSD_SRS_DOMAIN: srs.example.com
      POSTSRSD_LOCAL_DOMAINS: example.com,other.example.com
      POSTSRSD_SECRETS__FILE: /run/secrets/postsrsd_secrets
    secrets:
      - postsrsd_secrets

volumes:
  postsrsd-data:

secrets:
  postsrsd_secrets:
    file: ./secrets/postsrsd_secrets.txt
```

## References

- [PostSRSd on GitHub](https://github.com/roehling/postsrsd)
- [SRS — Sender Rewriting Scheme](https://en.wikipedia.org/wiki/Sender_Rewriting_Scheme)
