# Environment variables

## Required

POSTSRSD_SRS_DOMAIN (required, e.g., srs.cc.com - the domain used for SRS rewriting)
POSTSRSD_LOCAL_DOMAINS (required, e.g., ac.com,bc.com - comma-separated list of domains that should NOT be rewritten)
POSTSRSD_SECRETS (required, content for secrets file - one secret per line, or use POSTSRSD_SECRETS__FILE for Docker secrets)

## Optional

POSTSRSD_SEPARATOR (default: = - SRS tag separator: =|+|-)
POSTSRSD_HASH_LENGTH (default: 4 - SRS hash signature length)
POSTSRSD_HASH_MINIMUM (default: 4 - minimum acceptable hash signature length)

POSTSRSD_KEEP_ALIVE (default: 30 - socketmap connection keep-alive timeout in seconds)

POSTSRSD_ORIGINAL_ENVELOPE (default: embedded - how to store original sender: embedded|database)
POSTSRSD_ENVELOPE_DATABASE (default: empty - database for envelope storage, e.g., sqlite:./senders.db or redis:host:port)

POSTSRSD_ALWAYS_REWRITE (default: off - force rewrite even for already-rewritten addresses)
POSTSRSD_DEBUG (default: off - enable verbose debug logging)

## Hardcoded Values (Docker-specific)

The following values are hardcoded in the Docker container configuration:

- secrets-file = "/var/lib/postsrsd/postsrsd.secret" (created from POSTSRSD_SECRETS)
- unprivileged-user = "postsrsd" (dedicated user created in Dockerfile)
- maxage = 21 days (SRS token expiration - hardcoded in PostSRSd source, not configurable)

## Notes

- Uses TCP socketmap on port 11380 for cross-container communication (exposed in Dockerfile)
- Logs to stderr (captured by Docker logs)
- No chroot (container provides isolation)
- Secret file must be persistent across restarts (`/var/lib/postsrsd` volume)
- Postfix connects via canonical maps:
  - sender_canonical_maps = socketmap:inet:postsrsd:11380:forward
  - recipient_canonical_maps = socketmap:inet:postsrsd:11380:reverse
- For multi-domain setups, use a dedicated SRS domain (subdomain of server)
- `embedded` mode is recommended for most use cases (stateless, limits to 51 char senders)
- `database` mode requires SQLite/Redis and removes length restrictions
