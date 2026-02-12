#!/bin/bash
# Sync INSTRUCTIONS.md to provider-specific formats
# Run from project root: ./scripts/sync-instructions.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE="$PROJECT_ROOT/INSTRUCTIONS.md"

if [ ! -f "$SOURCE" ]; then
    echo "Error: INSTRUCTIONS.md not found at $SOURCE"
    exit 1
fi

# Sync to Claude Code format (CLAUDE.md)
echo "Syncing to CLAUDE.md..."
cat > "$PROJECT_ROOT/CLAUDE.md" << 'HEADER'
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: This file is auto-generated from INSTRUCTIONS.md. Edit INSTRUCTIONS.md and run `scripts/sync-instructions.sh` to update.

HEADER
# Skip the first 3 lines (title and note about syncing) from INSTRUCTIONS.md
tail -n +4 "$SOURCE" >> "$PROJECT_ROOT/CLAUDE.md"

# Sync to GitHub Copilot format
echo "Syncing to .github/copilot-instructions.md..."
mkdir -p "$PROJECT_ROOT/.github"
cat > "$PROJECT_ROOT/.github/copilot-instructions.md" << 'HEADER'
---
applyTo: '**'
---

# Copilot Instructions

> **Note**: This file is auto-generated from INSTRUCTIONS.md. Edit INSTRUCTIONS.md and run `scripts/sync-instructions.sh` to update.

HEADER
tail -n +4 "$SOURCE" >> "$PROJECT_ROOT/.github/copilot-instructions.md"

# Clean up old instruction files if they exist
if [ -d "$PROJECT_ROOT/.github/instructions" ]; then
    echo "Removing old .github/instructions/ directory..."
    rm -rf "$PROJECT_ROOT/.github/instructions"
fi

echo "Done! Synced INSTRUCTIONS.md to:"
echo "  - CLAUDE.md"
echo "  - .github/copilot-instructions.md"
