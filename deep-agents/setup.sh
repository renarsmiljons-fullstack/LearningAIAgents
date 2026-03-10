#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

node_major=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/' || echo 0)
if [ "$node_major" -lt 20 ]; then
  echo "Error: Node.js >= 20 is required (found: $(node -v 2>/dev/null || echo 'none'))"
  exit 1
fi

echo "Installing dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — fill in your API key(s) before running."
else
  echo ".env already exists, skipping."
fi

echo ""
echo "Setup complete. Next steps:"
echo "  1. Add your OPENAI_API_KEY to .env"
echo "  2. npm run dev   — run with file watching"
echo "  3. npm start      — single run"
