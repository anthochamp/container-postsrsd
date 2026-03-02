#!/usr/bin/env sh
set -eu

# shellcheck disable=SC2120,SC3043
replaceEnvSecrets() {
	# replaceEnvSecrets 1.0.0
	# https://gist.github.com/anthochamp/d4d9537f52e5b6c42f0866dd823a605f
	local prefix="${1:-}"

	for envSecretName in $(export | awk '{print $2}' | grep -oE '^[^=]+' | grep '__FILE$'); do
		if [ -z "$prefix" ] || printf '%s' "$envSecretName" | grep "^$prefix" >/dev/null; then
			local envName
			envName=$(printf '%s' "$envSecretName" | sed 's/__FILE$//')

			local filePath
			filePath=$(eval echo '${'"$envSecretName"':-}')

			if [ -n "$filePath" ]; then
				if [ -f "$filePath" ]; then
					echo Using content from "$filePath" file for "$envName" environment variable value.

					export "$envName"="$(cat -A "$filePath")"
					unset "$envSecretName"
				else
					echo ERROR: Environment variable "$envSecretName" is defined but does not point to a regular file. 1>&2
					exit 1
				fi
			fi
		fi
	done
}

replaceEnvSecrets POSTSRSD_

if [ -z "${POSTSRSD_SRS_DOMAIN:-}" ]; then
	echo "$0": missing POSTSRSD_SRS_DOMAIN environment variable
	exit 1
fi

export POSTSRSD_LOCAL_DOMAINS="${POSTSRSD_LOCAL_DOMAINS:-}"
export POSTSRSD_SEPARATOR="${POSTSRSD_SEPARATOR:-=}"
export POSTSRSD_HASH_LENGTH="${POSTSRSD_HASH_LENGTH:-4}"
export POSTSRSD_HASH_MINIMUM="${POSTSRSD_HASH_MINIMUM:-4}"
export POSTSRSD_KEEP_ALIVE="${POSTSRSD_KEEP_ALIVE:-30}"
export POSTSRSD_ORIGINAL_ENVELOPE="${POSTSRSD_ORIGINAL_ENVELOPE:-embedded}"
export POSTSRSD_ENVELOPE_DATABASE="${POSTSRSD_ENVELOPE_DATABASE:-}"
export POSTSRSD_ALWAYS_REWRITE="${POSTSRSD_ALWAYS_REWRITE:-off}"
export POSTSRSD_DEBUG="${POSTSRSD_DEBUG:-off}"

if [ -n "${POSTSRSD_SECRETS:-}" ]; then
	printf '%s' "$POSTSRSD_SECRETS" > /var/lib/postsrsd/postsrsd.secret
elif [ ! -f /var/lib/postsrsd/postsrsd.secret ]; then
	openssl rand -base64 18 > /var/lib/postsrsd/postsrsd.secret
fi

chown postsrsd:postsrsd /var/lib/postsrsd/postsrsd.secret
chmod 600 /var/lib/postsrsd/postsrsd.secret

j2Templates="
/etc/postsrsd.conf
"

for file in $j2Templates; do
	export | jinja2 --format env -o "$file" "$file.j2"

	# can't use --reference with alpine
	chmod "$(stat -c '%a' "$file.j2")" "$file"
	chown "$(stat -c '%U:%G' "$file.j2")" "$file"
done

exec "$@"
