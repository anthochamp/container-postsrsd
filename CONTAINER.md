# PostSRSd Container

Container images based on [PostSRSd](https://github.com/roehling/postsrsd), implementing the Sender Rewriting Scheme (SRS) for Postfix via TCP socketmap.

Sources are available on [GitHub](https://github.com/anthochamp/container-postsrsd).

See [README.md](README.md) for full documentation.

## Image tags

- `x.y.z-postsrsdA.B.C`: Container image version `x.y.z` with PostSRSd `A.B.C`.
- `edge-postsrsdA.B.C`: Latest commit build with PostSRSd `A.B.C`.

**Tag aliases:**

- `x.y-postsrsdA.B.C`: Latest patch of `x.y` (major.minor) with PostSRSd `A.B.C`.
- `x-postsrsdA.B.C`: Latest minor+patch of `x` (major) with PostSRSd `A.B.C`.
- `x.y.z`: Version `x.y.z` with latest PostSRSd (only latest container version updated).
- `x.y`: Latest patch of `x.y` (major.minor) with latest PostSRSd (only latest container major.minor updated).
- `x`: Latest minor+patch of `x` (major) with latest PostSRSd (only latest container major updated).
- `postsrsdA.B`: Latest container with latest patch of PostSRSd `A.B` (major.minor).
- `postsrsdA`: Latest container with latest minor+patch of PostSRSd `A` (major).
- `latest`: Latest `x.y.z-postsrsdA.B.C` tag.
- `edge-postsrsdA.B`: Latest commit build with latest patch of PostSRSd `A.B` (major.minor).
- `edge-postsrsdA`: Latest commit build with latest minor+patch of PostSRSd `A` (major).
- `edge`: Latest `edge-postsrsdA.B.C` tag.
