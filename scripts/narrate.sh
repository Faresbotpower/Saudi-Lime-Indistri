#!/usr/bin/env bash
# Render the explainer narration to public/walkthrough/chapterN.m4a with a macOS voice.
# Usage: scripts/narrate.sh "Ava (Premium)"   (default: Samantha)
# Install premium voices in System Settings > Accessibility > Spoken Content > System Voice > Manage Voices.
set -euo pipefail
VOICE="${1:-Samantha}"
RATE="${2:-172}"
cd "$(dirname "$0")/.."
mkdir -p public/walkthrough
for f in docs/walkthrough/explainer/chapter*.txt; do
  n=$(basename "$f" .txt)
  say -v "$VOICE" -r "$RATE" -o "/tmp/$n.aiff" -f "$f"
  afconvert -f m4af -d aac -b 64000 "/tmp/$n.aiff" "public/walkthrough/$n.m4a"
  rm "/tmp/$n.aiff"
  printf "%s " "$n"; afinfo "public/walkthrough/$n.m4a" | grep "estimated duration" | awk '{print $3" s"}'
done
