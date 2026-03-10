FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659 AS builder

# hadolint ignore=DL3018
RUN apk add --no-cache cmake build-base openssl-dev patch sqlite-dev hiredis-dev git autoconf automake libtool

# renovate: datasource=github-releases depName=roehling/postsrsd
ARG POSTSRSD_VERSION=2.0.11

RUN set -ex; \
	wget -q "https://github.com/roehling/postsrsd/archive/refs/tags/${POSTSRSD_VERSION}.tar.gz" -O /tmp/postsrsd.tar.gz; \
	tar xzf /tmp/postsrsd.tar.gz -C /tmp; \
	cmake -S /tmp/postsrsd-${POSTSRSD_VERSION} -B /tmp/postsrsd-build \
	-DCMAKE_BUILD_TYPE=Release \
	-DCMAKE_INSTALL_PREFIX=/usr \
	-DCMAKE_INSTALL_SYSCONFDIR=/etc \
	-DINSTALL_SYSTEMD_SERVICE=OFF \
	-DWITH_SQLITE=ON \
	-DWITH_REDIS=ON \
	-DCMAKE_POLICY_VERSION_MINIMUM=3.5 \
	-DBUILD_TESTING=OFF; \
	cmake --build /tmp/postsrsd-build; \
	cmake --install /tmp/postsrsd-build

FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659

# hadolint ignore=DL3018
RUN apk add --update --no-cache jinja2-cli openssl sqlite-libs hiredis \
	&& addgroup -S postsrsd \
	&& adduser -S -G postsrsd postsrsd \
	&& mkdir -p /var/lib/postsrsd \
	&& chown postsrsd:postsrsd /var/lib/postsrsd

COPY --from=builder /usr/sbin/postsrsd /usr/sbin/postsrsd

COPY --chmod=644 /rootfs/postsrsd.conf.j2 /etc/
COPY --chmod=755 /rootfs/docker-entrypoint.sh /

EXPOSE 11380

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD [ "/usr/sbin/postsrsd", "-C", "/etc/postsrsd.conf" ]

HEALTHCHECK \
	CMD pgrep postsrsd || exit 1
