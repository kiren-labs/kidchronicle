#!/usr/bin/env bash
# Usage: ./scripts/release.sh 1.1.0
# Bumps the SW cache version, commits, tags, and pushes.

set -e

VERSION="${1:?Usage: ./scripts/release.sh <version>  e.g. 1.1.0}"
SW_FILE="service-worker.js"

# Derive cache name from version (dots → dashes)
CACHE="kidchronicle-v${VERSION//./-}"

# Bump CACHE_NAME in service-worker.js
sed -i '' "s/^const CACHE_NAME = .*/const CACHE_NAME = '${CACHE}';/" "$SW_FILE"

# Commit and tag
git add "$SW_FILE"
git commit -m "chore(sw): bump cache to ${CACHE} for v${VERSION}"
git tag -a "v${VERSION}" -m "v${VERSION}"

echo ""
echo "✓ Tagged v${VERSION} — cache: ${CACHE}"
echo "  Push with: git push origin main --tags"
