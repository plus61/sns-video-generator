#!/bin/bash

# Navigate to the repository root
cd /Users/yuichiroooosuger/sns-video-generator

# Show current status
echo "=== Git Status ==="
git status

# Add all changes
echo -e "\n=== Adding all changes ==="
git add -A

# Create commit with the specified message
echo -e "\n=== Creating commit ==="
git commit -m "$(cat <<'EOF'
fix: Add standalone output for Railway deployment

- Add output: 'standalone' to next.config.mjs
- Create nixpacks.toml for Railway build
- Update railway.toml to use Nixpacks builder
- Fix previous '.next directory not found' issue
EOF
)"

# Push to main branch
echo -e "\n=== Pushing to main branch ==="
git push origin main

echo -e "\n=== Done ==="