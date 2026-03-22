#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-apache/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

# persistence: take etc/hosts into account
if test -f /root/AppCentral/cappysan-persistence/CONTROL/start-stop.sh; then
  export DOCKER_NO_RELOAD=1
  /root/AppCentral/cappysan-persistence/CONTROL/start-stop.sh reload
fi
# apache: in case we're proxied
if test -f /root/AppCentral/cappysan-apache/CONTROL/start-stop.sh; then
  /root/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload
fi

# Copy the current SSL to pihole
# Certificate can be other than Asustor or Certbot
if test -f /usr/builtin/etc/certificate/ssl.pem; then
  cp -f /usr/builtin/etc/certificate/ssl.pem etc/pihole/tls.pem
elif test -f /usr/builtin/etc/certificate/ssl.chain; then
  cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.chain /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
else
  cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
fi
