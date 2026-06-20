#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
. ${APKG_PKG_DIR}/env

# Clean
# =====
if test "x${APKG_PKG_STATUS}" != "xupgrade"; then
  logger "[${WHAT}] Delete docker images..."
  docker images --format "table {{.ID}} {{.Repository}}:{{.Tag}}" | grep 'pihole/pihole:' | cut -d" " -f1 | xargs docker rmi

  # Remove Apache proxy config (our own deps.d copy; apache start-hook will
  # then no longer pick it up, and a reload clears it from sites-enabled/available)
  logger "[${WHAT}] Removing Apache pi-hole configuration..."
  rm -f ${APKG_CFG_DIR}/deps.d/apache/sites-enabled/pi-hole.conf
  rm -f ${APKG_CFG_DIR}/deps.d/apache/sites-available/pi-hole.conf
  /usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload >/dev/null 2>&1

  # Remove certbot renewal hook
  logger "[${WHAT}] Removing certbot renewal hook..."
  rm -f /share/Configuration/pi-hole/deps.d/certbot/renewal-hooks/deploy/10-pi-hole
fi

exit 0
