#!/bin/sh
# SPDX-License-Identifier: MIT
#
# ------------------------------------------------------------------------------
# Save variables
APKG_PKG_DIR=/usr/local/AppCentral/${APKG_PKG_NAME}
APKG_PKG_SHORT_NAME="${APKG_PKG_NAME#*-}"
APKG_PKG_SHORT_VER="${APKG_PKG_VER%-*}"
APKG_CFG_DIR=/share/Configuration/${APKG_PKG_SHORT_NAME}
APKG_TAR_FILE=/tmp/${APKG_PKG_SHORT_NAME}.tar.xz
export APKG_PKG_SHORT_NAME APKG_CFG_DIR APKG_PKG_VER APKG_PKG_SHORT_VER
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

rsync -av --inplace --ignore-existing ${APKG_PKG_DIR}/conf.dist/ ${APKG_CFG_DIR}

exit 0
