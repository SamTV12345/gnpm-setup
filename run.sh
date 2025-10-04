#! /bin/sh
# shellcheck disable=SC2155,SC2088
export HOME="$(pwd)"
export INPUT_VERSION=0.0.6
exec node dist/index.js