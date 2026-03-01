FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659

# hadolint ignore=DL3018
RUN apk add --update --no-cache jinja2-cli postsrsd

COPY --chmod=644 /rootfs/postsrsd.conf.j2 /etc
COPY --chmod=755 /rootfs/docker-entrypoint.sh /

EXPOSE 11380

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD [ "/usr/sbin/postsrsd", "-c", "/etc/postsrsd.conf" ]

HEALTHCHECK \
	CMD pgrep postsrsd || exit 1
