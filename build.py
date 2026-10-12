#!/usr/bin/env python3
"""Bundle BLACKLINE into one offline HTML file: dist/index.html (+ docs/index.html for GitHub Pages)
Usage:  python3 build.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
ORDER = ["voicepack.js", "core.js", "post.js", "input.js", "fx.js", "voice.js", "models.js", "world.js", "builders.js", "entities.js", "entities2.js", "player.js", "hud.js", "mission.js", "story.js",
         "m1.js", "f1.js", "m2.js", "m3.js", "f2.js", "m3b.js", "m4.js", "f3.js", "m5.js", "main.js"]

three = (ROOT / "vendor" / "three.min.js").read_text(encoding="utf-8")
game = "\n".join(f"/* ---- {n} ---- */\n" + (SRC / n).read_text(encoding="utf-8") for n in ORDER)
html = (SRC / "index.template.html").read_text(encoding="utf-8")
html = html.replace("<!--THREE-->", "<script>\n" + three + "\n</script>")
html = html.replace("<!--GAME-->", "<script>\n(function(){\n" + game + "\n})();\n</script>")
out = ROOT / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
# GitHub Pages serves the playable build from docs/
(ROOT / "docs").mkdir(exist_ok=True); (ROOT / "docs" / "index.html").write_text(html, encoding="utf-8")
(ROOT / "dist" / "game.bundle.js").write_text("(function(){\n" + game + "\n})();\n", encoding="utf-8")
print(f"Built {out}  ({out.stat().st_size/1024:.0f} KB)")
