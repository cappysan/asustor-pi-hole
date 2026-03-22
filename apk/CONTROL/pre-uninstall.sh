#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
. ${APKG_PKG_DIR}/env

# Clean
# =====
docker images --format "table {{.ID}} {{.Repository}}:{{.Tag}}" | grep 'pihole/pihole:' | cut -d" " -f1 | xargs docker rmi

exit 0
