#!/usr/bin/env bash
set -e

echo "Running chatbot project checks..."
echo

echo "→ Production build"
npm run build

if npm run | grep -q " lint"; then
  echo
  echo "→ Lint"
  npm run lint
fi

echo
echo "→ Reminder: after changing authenticated chat clients or API route auth,"
echo "  confirm request auth headers are still attached via the SDK's current"
echo "  request-options path (for example the sendMessage second argument),"
echo "  not deprecated hook fields."

echo
echo "✅ Checks passed"