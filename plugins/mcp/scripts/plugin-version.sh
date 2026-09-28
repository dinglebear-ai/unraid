#!/usr/bin/env bash
# Map an unraid-rs semver to the fixed-width epoch-3 Unraid plugin version.
#
#   unraid-rs-v0.3.1  ->  3.000.003.001
#
# Unraid compares plugin versions as RAW STRINGS (LC_ALL=C byte order), and the
# last released Python-lane plugin was 2.10.0. A bare Rust semver (0.3.x) sorts
# BEFORE every installed "2.*" version, so installed plugins would silently
# stop updating. Prefixing the fixed epoch "3." sorts after every legacy "2.*"
# string, and the zero-padded %03d components keep the scheme monotonic for all
# semver components < 1000.
#
# This is the single source of truth for the mapping; build-txz.sh,
# verify-package.sh, the release workflows, and
# .github/scripts/check-plg-version-ordering.sh all call it.
#
# Usage: plugin-version.sh <rust-version>
#   <rust-version>  X.Y.Z, vX.Y.Z, or unraid-rs-vX.Y.Z
set -euo pipefail

raw="${1:?usage: plugin-version.sh <rust-version>}"
version="${raw#unraid-rs-v}"
version="${version#v}"

if [[ ! "${version}" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "ERROR: invalid rust version '${raw}' (expected X.Y.Z)" >&2
    exit 1
fi

major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

for component in "${major}" "${minor}" "${patch}"; do
    if [ "${component}" -ge 1000 ]; then
        echo "ERROR: rust version component '${component}' >= 1000 breaks the fixed-width plugin version" >&2
        exit 1
    fi
done

printf '3.%03d.%03d.%03d\n' "${major}" "${minor}" "${patch}"
