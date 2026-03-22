#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

function logger() {
  echo "${@}" >&2
  syslog --log 0 --level 0 --user SYSTEM --event "${@}"
}

export HOME=/share/Configuration/pi-hole
case $1 in
  start)
    logger "[pi-hole] Starting docker container..."
    touch "${APKG_CFG_DIR}/active"
    ./CONTROL/start.sh

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
    docker-compose up -d
    ;;

  stop)
    logger "[pi-hole] Stopping docker container..."
    rm -f "${APKG_CFG_DIR}/active"

    cd ${APKG_CFG_DIR:-/nonexistent} || exit 1
    docker-compose down
    ;;

  restart)
    ./CONTROL/start-stop.sh stop
    ./CONTROL/start-stop.sh start
    ;;

  reload)
    if test -f "${APKG_CFG_DIR}/active"; then
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
