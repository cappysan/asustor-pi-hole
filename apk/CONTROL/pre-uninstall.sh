#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# Before deleting the user, we must change permissions to root.
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

docker rmi pihole/pihole:2025.11.1 

exit 0
