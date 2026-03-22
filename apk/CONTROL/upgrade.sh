#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-pi-hole/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

cat ${APKG_PKG_DIR}/conf.dist/version > ${APKG_CFG_DIR}/version

# Beware of symlinks
cat ${APKG_CFG_DIR}/custom.env \
  ${APKG_CFG_DIR}/version > ${APKG_CFG_DIR}/.env
chmod 640 ${APKG_CFG_DIR}/.env ${APKG_CFG_DIR}/custom.env
