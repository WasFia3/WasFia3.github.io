"""Refresh data/chess.json with your latest chess.com ratings.

Your username is NOT saved anywhere. Run it like this from the site folder:

    python tools/update_chess.py

It asks for the username (or reads the CHESS_USERNAME environment variable),
downloads the public stats, and writes only the numbers to data/chess.json.
"""
import datetime
import json
import os
import pathlib
import urllib.request

username = os.environ.get("CHESS_USERNAME") or input("chess.com username: ").strip()
req = urllib.request.Request(
    f"https://api.chess.com/pub/player/{username.lower()}/stats",
    headers={"User-Agent": "portfolio-rating-update"},
)
with urllib.request.urlopen(req) as res:
    stats = json.load(res)


def pick(mode):
    s = stats.get(f"chess_{mode}", {})
    rec = s.get("record", {})
    return {
        "rating": s.get("last", {}).get("rating"),
        "best": s.get("best", {}).get("rating"),
        "wins": rec.get("win", 0),
        "losses": rec.get("loss", 0),
        "draws": rec.get("draw", 0),
    }


data = {
    "updated": datetime.date.today().isoformat(),
    "rapid": pick("rapid"),
    "blitz": pick("blitz"),
}
out = pathlib.Path(__file__).resolve().parent.parent / "data" / "chess.json"
out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"Saved: rapid {data['rapid']['rating']}, blitz {data['blitz']['rating']}")
