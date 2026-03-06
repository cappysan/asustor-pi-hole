#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

export HOME=/share/Configuration/pi-hole
case $1 in
  start)
    touch "${APKG_CFG_DIR}/active"

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1

    # Copy the current SSL to pihole
    # Certificate can be other than Asustor or Certbot
    if test -f /usr/builtin/etc/certificate/ssl.pem; then
      cp -f /usr/builtin/etc/certificate/ssl.pem etc/pihole/tls.pem
    elif test -f /usr/builtin/etc/certificate/ssl.chain; then
      cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.chain /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
    else
      cat /usr/builtin/etc/certificate/ssl.key /usr/builtin/etc/certificate/ssl.crt > etc/pihole/tls.pem
    fi
    docker-compose up -d
    ;;

  stop)
    if test -f "${APKG_CFG_DIR}/active"; then
      rm -f "${APKG_CFG_DIR}/active"
    fi

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
    docker-compose down
    ;;

  restart)
    ./CONTROL/start-stop.sh stop
    ./CONTROL/start-stop.sh start
    ;;

  *)
    echo "usage: $0 {start|stop|restart}"
    exit 1
    ;;

esac
exit 0
