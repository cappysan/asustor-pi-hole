#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1
. ${APKG_PKG_DIR}/env

case $1 in
  start)
    logger "[pi-hole] Starting docker container..."
    touch "${APKG_PKG_DIR}/active"
    ./CONTROL/start-hook.sh

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
    docker-compose up -d
    ;;

  stop)
    logger "[pi-hole] Stopping docker container..."
    rm -f "${APKG_PKG_DIR}/active"

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
    docker-compose down
    ;;

  restart)
    ./CONTROL/start-stop.sh stop
    ./CONTROL/start-stop.sh start
    ;;

  reload)
    logger "[Apache] Reloading daemon..."
    if test -f "${APKG_PKG_DIR}/active"; then
      ./CONTROL/start-stop.sh stop
      ./CONTROL/start-stop.sh start
    fi
    ;;

  *)
    echo "usage: $0 {start|stop|restart|reload}"
    exit 1
    ;;

esac
exit 0
