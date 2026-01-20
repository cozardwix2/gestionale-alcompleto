#!/bin/sh
set -e

MESSAGE=${1:-"Update site"}

./scripts/bump-version.sh

git add -A
git commit -m "$MESSAGE"
git push
