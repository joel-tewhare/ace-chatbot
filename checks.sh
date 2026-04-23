#!/usr/bin/env bash
set -euo pipefail

# Full checks for LLM app projects
# Use before review, handoff, merge, or release.
#
# Sections:
# 1. Deterministic code checks
# 2. Manual verification reminders
# 3. LLM output evaluation reminders
#
# Customise per project:
# - Keep deterministic checks first
# - Add/remove npm scripts depending on project support
# - Keep manual checks short and high-value
# - Treat LLM output checks as evaluation prompts unless fully automated

echo "Running full project checks..."
echo

echo "=== Deterministic code checks ==="
echo

echo "→ Production build"
npm run build
echo

if npm run | grep -q " lint"; then
  echo "→ Lint"
  npm run lint
  echo
fi

if npm run | grep -q " typecheck"; then
  echo "→ Typecheck"
  npm run typecheck
  echo
fi

if npm run | grep -q " test"; then
  echo "→ Tests"
  npm run test
  echo
fi

echo "=== Manual verification reminders ==="
echo
echo "→ Auth / API reminder"
echo "  After auth, SDK, or API client changes, confirm request headers,"
echo "  tokens, cookies, or request options are still attached through the"
echo "  current supported path."
echo
echo "→ Chat flow reminder"
echo "  Confirm the intended request and response flow still works in the UI"
echo "  after changes to chat hooks, route handlers, or provider wiring."
echo

echo "=== LLM output evaluation reminders ==="
echo
echo "Check recent outputs against these questions:"
echo
echo "1. On-topic"
echo "   - Does the response actually answer the user's question?"
echo
echo "2. Valid JSON"
echo "   - If JSON was requested, is the output parseable and shaped as expected?"
echo
echo "3. Concise"
echo "   - If brevity was requested, does the response stay within the intended"
echo "     word, sentence, or structure limit?"
echo

echo "✅ Full checks passed"