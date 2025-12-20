#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
# Save variables
APKG_PKG_DIR=/usr/local/AppCentral/${APKG_PKG_NAME}
APKG_PKG_SHORT_VER="${APKG_PKG_VER%-*}"
APKG_CFG_DIR=/share/Configuration/pi-hole
APKG_TAR_FILE=/tmp/pi-hole.tar.xz
export APKG_CFG_DIR APKG_PKG_VER APKG_PKG_SHORT_VER
env | grep APKG | grep -v " " | sort > ${APKG_PKG_DIR}/.env.install

# Ensure permissions are limited to root user for the application folder.
chown -R root:root ${APKG_PKG_DIR}

# Create a configuration folder for this application
if test ! -d ${APKG_CFG_DIR}; then
  mkdir -p ${APKG_CFG_DIR}
  chown admin:root ${APKG_CFG_DIR}
  chmod 750 ${APKG_CFG_DIR}
fi
mkdir -p ${APKG_CFG_DIR}/etc/pihole
mkdir -p ${APKG_CFG_DIR}/etc/dnsmasq.d


# Copy available configurations if they don't exist
rsync -av --inplace --ignore-existing ${APKG_PKG_DIR}/conf.dist/ ${APKG_CFG_DIR}
chown -R admin:root ${APKG_CFG_DIR}
chmod 750 ${APKG_CFG_DIR}

# Make backup of the installed.json
if test ! -f ${APKG_CFG_DIR}/installed.json.$(date +%Y-%m-%d_%H%M).bak; then
  cp /usr/builtin/etc/appcentral/installed.json ${APKG_CFG_DIR}/installed.json.$(date +%Y-%m-%d_%H%M).bak
fi

exit 0
