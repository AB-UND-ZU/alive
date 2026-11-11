#!/bin/sh
set -eu

# Avoid dependency downloads through the runner-specific Azure mirror.
for source in /etc/apt/sources.list /etc/apt/sources.list.d/*.sources /etc/apt/sources.list.d/*.list; do
  [ -f "$source" ] || continue
  sudo sed -i \
    -e 's|mirror+file:/etc/apt/apt-mirrors.txt|https://archive.ubuntu.com/ubuntu|g' \
    -e 's|mirror+file:/etc/apt/apt-security-mirrors.txt|https://security.ubuntu.com/ubuntu|g' \
    -e 's|http://azure.archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' \
    -e 's|https://azure.archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' \
    "$source"
done

npx playwright install --with-deps chromium
