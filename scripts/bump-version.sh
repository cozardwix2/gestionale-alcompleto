#!/bin/sh
set -e

python3 - <<'PY'
from pathlib import Path
import re

files = [Path("index.html"), Path("confermati.html")]

def get_current_version(text):
    match = re.search(r"[?]v=(\d+)", text)
    if not match:
        return None
    return int(match.group(1))

current = None
for path in files:
    text = path.read_text(encoding="utf-8")
    found = get_current_version(text)
    if found is None:
        raise SystemExit(f"Missing ?v= in {path}")
    current = found if current is None else current
    if found != current:
        raise SystemExit("Version mismatch between HTML files.")

next_version = current + 1

for path in files:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"[?]v=\d+", f"?v={next_version}", text)
    path.write_text(text, encoding="utf-8")

print(f"Bumped version to v={next_version}")
PY
