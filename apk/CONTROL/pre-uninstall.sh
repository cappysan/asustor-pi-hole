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
  rm -f /share/Configuration/apache/sites-*/pi-hole.conf
  rm -f /share/Configuration/pi-hole/deps.d/apache/sites-*/pi-hole.conf

  # Remove certbot renewal hook
  logger "[${WHAT}] Removing certbot renewal hook..."
  rm -f /share/Configuration/certbot/letsencrypt/renewal-hooks/deploy/10-pi-hole
  rm -f /share/Configuration/pi-hole/deps.d/certbot/renewal-hooks/deploy/10-pi-hole

  /usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload >/dev/null 2>&1
fi

exit 0
