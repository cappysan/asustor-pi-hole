#!/usr/bin/env sh
# SPDX-License-Identifier: MIT
#
. /usr/local/AppCentral/cappysan-apache/.env.install
cd ${APKG_PKG_DIR:-/nonexistent} || exit 1

rsync -a --inplace ${APKG_PKG_DIR}/conf.dist/version ${APKG_CFG_DIR}/version
