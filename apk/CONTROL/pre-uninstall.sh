#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

# Remove previous versions
docker rmi pihole/pihole:2025.11.1
docker rmi pihole/pihole:2026.02.0

exit 0
