#!/bin/bash
# One-time publish to GitHub (run on your Mac from this folder):   bash publish.sh
# Creates github.com/<you>/blackline-last-hour, pushes the code, turns on GitHub Pages
# (the playable web version), and uploads the Mac app as a release download.
set -euo pipefail
cd "$(dirname "$0")"
REPO=blackline-last-hour
ZIP="${1:-../BLACKLINE-mac.zip}"
command -v git >/dev/null || { echo "Install Apple's developer tools first:  xcode-select --install"; exit 1; }
command -v gh  >/dev/null || { echo "Install the GitHub CLI first:  brew install gh   (no Homebrew? get the installer at https://cli.github.com)"; exit 1; }
gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
U=$(gh api user -q .login); ID=$(gh api user -q .id)
echo "Publishing as $U"
perl -pi -e "s/GH_USER/$U/g" README.md
[ -d .git ] || git init -q -b main
git config user.name  >/dev/null || git config user.name "$U"
git config user.email >/dev/null || git config user.email "$ID+$U@users.noreply.github.com"
git add -A
git diff --cached --quiet || git commit -q -m "BLACKLINE: LAST HOUR: 7 chapters, 3 playable flashbacks"
gh repo view "$U/$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public \
  --description "A cinematic, story-driven FPS that runs in your browser. 7 chapters, 3 playable flashbacks, all art and audio generated in code. Built with Three.js." \
  --homepage "https://$U.github.io/$REPO/"
git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$U/$REPO.git"
git push -u origin main
gh api -X POST "repos/$U/$REPO/pages" -f "source[branch]=main" -f "source[path]=/docs" >/dev/null 2>&1 || true
gh api -X PUT "repos/$U/$REPO/topics" -f "names[]=game" -f "names[]=fps" -f "names[]=threejs" -f "names[]=webgl" -f "names[]=javascript" -f "names[]=procedural-generation" -f "names[]=ai-assisted" >/dev/null || true
if [ -f "$ZIP" ]; then
  gh release view v2.0 --repo "$U/$REPO" >/dev/null 2>&1 || gh release create v2.0 "$ZIP" --repo "$U/$REPO" --title "BLACKLINE: LAST HOUR v2.0" \
    --notes "Mac app for Apple Silicon. Install: see the Mac app section of the README. Or play in your browser: https://$U.github.io/$REPO/"
else echo "(No Mac app zip at $ZIP, skipping the release)"; fi
echo
echo "Repo:  https://github.com/$U/$REPO"
echo "Play:  https://$U.github.io/$REPO/   (GitHub Pages takes 1-2 minutes to go live the first time)"
