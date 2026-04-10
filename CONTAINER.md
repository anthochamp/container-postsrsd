# PostSRSd Container

Container images based on [PostSRSd](https://github.com/roehling/postsrsd), implementing the Sender Rewriting Scheme (SRS) for Postfix via TCP socketmap.

Sources are available on [GitHub](https://github.com/anthochamp/container-postsrsd).

See [README.md](README.md) for full documentation.

## Image tags

- `x.y.z-postsrsdA.B.C`: Container image version `x.y.z` with PostSRSd `A.B.C`.
- `edge-postsrsdA.B.C`: Latest commit build with PostSRSd `A.B.C`.

**Tag aliases:**

- `x.y-postsrsdA.B.C`: Latest patch of `x.y` with PostSRSd `A.B.C`.
- `x-postsrsdA.B.C`: Latest minor+patch of `x` with PostSRSd `A.B.C`.
- `x.y.z-postsrsdA.B`: Version `x.y.z` with latest patch of PostSRSd `A.B` (only latest container version updated).
- `x.y-postsrsdA.B`: Latest patch of `x.y` with latest patch of PostSRSd `A.B`.
- `x-postsrsdA.B`: Latest minor+patch of `x` with latest patch of PostSRSd `A.B`.
- `x.y.z-postsrsdA`: Version `x.y.z` with latest minor+patch of PostSRSd `A` (only latest container version updated).
- `x.y-postsrsdA`: Latest patch of `x.y` with latest minor+patch of PostSRSd `A`.
- `x-postsrsdA`: Latest minor+patch of `x` with latest minor+patch of PostSRSd `A`.
- `x.y.z`: Version `x.y.z` with latest PostSRSd (only latest container version updated).
- `x.y`: Latest patch of `x.y` with latest PostSRSd.
- `x`: Latest minor+patch of `x` with latest PostSRSd.
- `postsrsdA.B.C`: Latest container with PostSRSd `A.B.C`.
- `postsrsdA.B`: Latest container with latest patch of PostSRSd `A.B`.
- `postsrsdA`: Latest container with latest minor+patch of PostSRSd `A`.
- `latest`: Latest `x.y.z-postsrsdA.B.C` tag.
- `edge-postsrsdA.B`: Latest commit build with latest patch of PostSRSd `A.B`.
- `edge-postsrsdA`: Latest commit build with latest minor+patch of PostSRSd `A`.
- `edge`: Latest `edge-postsrsdA.B.C` tag.
