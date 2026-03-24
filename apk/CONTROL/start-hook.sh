#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
. ${APKG_PKG_DIR}/env

# Env
# ===
# Beware of symlinks
cat ${APKG_CFG_DIR}/custom.env ${APKG_PKG_DIR}/version > ${APKG_CFG_DIR}/.env
chmod 640 ${APKG_CFG_DIR}/.env ${APKG_CFG_DIR}/custom.env


# Dependencies
# ============
# Apache calls certbot and persistence, but it sets DOCKER_NO_RELOAD=1
/usr/local/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload


# SSL
# ===
# Copy the current SSL to pihole
# Certificate can be other than Asustor or Certbot
cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
if test -f /usr/builtin/etc/certificate/ssl.pem; then
  cp -f /usr/builtin/etc/certificate/ssl.pem etc/pihole/tls.pem
elif test -f /usr/builtin/etc/certificate/ssl.chain; then
  cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.chain /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
else
  cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
fi


exit 0
