#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

# Ensure permissions are limited to root user for the application folder.
chown -R root:root ${APKG_PKG_DIR}


# User
# ====
APKG_USER=admin
APKG_GROUP=root


# Configuration folder
# ====================
if test ! -d ${APKG_CFG_DIR}; then
  mkdir -p ${APKG_CFG_DIR}
  chown -R ${APKG_USER}:${APKG_GROUP} ${APKG_CFG_DIR}
  chmod 750 ${APKG_CFG_DIR}
fi


# Backups
# =======
mkdir ${APKG_CFG_DIR}/backups/
if test ! -f ${APKG_CFG_DIR}/installed.json.$(date +%Y-%m-%d_%H%M).bak; then
  cp /usr/builtin/etc/appcentral/installed.json ${APKG_CFG_DIR}/backups/installed.json.$(date +%Y-%m-%d_%H%M).bak
fi
if test ! -f ${APKG_CFG_DIR}/crontab.$(date +%Y-%m-%d_%H%M).bak; then
  crontab -l > ${APKG_CFG_DIR}/backups/crontab.$(date +%Y-%m-%d_%H%M).bak
fi
chown -R ${APKG_USER}:${APKG_GROUP} ${APKG_CFG_DIR}/backups


# Configuration
# =============
rsync -a --inplace --ignore-existing ${APKG_PKG_DIR}/conf.dist/ ${APKG_CFG_DIR}
chown -R ${APKG_USER}:${APKG_GROUP} ${APKG_CFG_DIR}

if test -f /root/AppCentral/cappysan-persistence/CONTROL/start-stop.sh; then
  export DOCKER_NO_RELOAD=1
  /root/AppCentral/cappysan-persistence/CONTROL/start-stop.sh reload
fi
if test -f /root/AppCentral/cappysan-apache/CONTROL/start-stop.sh; then
  /root/AppCentral/cappysan-apache/CONTROL/start-stop.sh reload
fi
