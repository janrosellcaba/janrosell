#!/usr/bin/env python3
"""Build the password-protected visit timelines from data/visits.jsonl."""

import html
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

LOG = Path("/home/jan/janrosell/data/visits.jsonl")
OUT = Path("/var/www/janrosell-admin/visits/index.html")
KEEP_DAYS = 30
GAP = timedelta(minutes=30)


def esc(value):
    return html.escape(str(value), quote=True)


def load_rows():
    if not LOG.exists():
        return []
    rows = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)
    kept = []
    for line in LOG.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            received = datetime.fromisoformat(row["received"])
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            continue
        if received.tzinfo is None:
            received = received.replace(tzinfo=timezone.utc)
        if received < cutoff:
            continue
        row["received_at"] = received
        rows.append(row)
        kept.append(json.dumps({k: v for k, v in row.items() if k != "received_at"}, ensure_ascii=False))
    if LOG.exists():
        uid, gid = LOG.stat().st_uid, LOG.stat().st_gid
        LOG.write_text("\n".join(kept) + ("\n" if kept else ""), encoding="utf-8")
        os.chown(LOG, uid, gid)
    return rows


def sessions(rows):
    events = []
    for row in rows:
        for event in row.get("events") or []:
            if not isinstance(event, dict):
                continue
            when = event.get("t")
            if not isinstance(when, (int, float)):
                when = row["received_at"].timestamp() * 1000
            item = dict(event)
            item["path"] = row.get("path") or "/"
            item["when"] = datetime.fromtimestamp(when / 1000, timezone.utc)
            item["sid"] = row.get("sid") or "?"
            events.append(item)
    events.sort(key=lambda item: (item["sid"], item["when"]))

    grouped = []
    for event in events:
        if (
            not grouped
            or grouped[-1]["sid"] != event["sid"]
            or event["when"] - grouped[-1]["events"][-1]["when"] > GAP
        ):
            grouped.append({"sid": event["sid"], "events": [event]})
        else:
            grouped[-1]["events"].append(event)
    grouped.sort(key=lambda item: item["events"][-1]["when"], reverse=True)
    return grouped[:60]


def clock(seconds):
    seconds = max(0, int(seconds))
    minutes, secs = divmod(seconds, 60)
    if minutes:
        return f"{minutes}m {secs:02d}s"
    return f"{secs}s"


def describe(event):
    kind = event.get("type")
    if kind == "enter":
        text = f"Opened {event.get('path') or '/'}"
        referrer = event.get("referrer")
        if referrer:
            text += f" from {referrer}"
        if event.get("w") and event.get("h"):
            text += f" · {event['w']}×{event['h']}"
        return text
    if kind == "scroll":
        return f"Stopped scrolling at {event.get('depth', 0)}% of {event.get('path') or '/'}"
    if kind == "click":
        target = event.get("target") or "something"
        if event.get("kind") == "field":
            return f"Clicked the {target} field"
        href = event.get("href")
        text = f"Clicked “{target}”"
        if href:
            text += f" → {href}"
        return text
    if kind == "leave":
        return f"Left {event.get('path') or '/'} after {clock((event.get('ms') or 0) / 1000)} · scrolled {event.get('depth', 0)}%"
    return kind or "event"


def render(groups):
    local = ZoneInfo("Europe/Madrid")
    blocks = []
    if not groups:
        blocks.append("<p class=\"sub\">No visits yet. This fills in after someone browses the site with JavaScript enabled.</p>")
    for group in groups:
        events = group["events"]
        start = events[0]["when"]
        end = events[-1]["when"]
        span = (end - start).total_seconds()
        depths = [event.get("depth") for event in events if isinstance(event.get("depth"), (int, float))]
        max_depth = max(depths) if depths else 0
        first_path = events[0].get("path") or "/"
        rows = []
        for event in events:
            offset = clock((event["when"] - start).total_seconds())
            rows.append(f"<tr><td>{esc(offset)}</td><td>{esc(describe(event))}</td></tr>")
        title = start.astimezone(local).strftime("%Y-%m-%d %H:%M")
        blocks.append(
            "<section>"
            f"<h2>{esc(title)} · {esc(first_path)}</h2>"
            f"<p class=\"sub\">{esc(clock(span))} on the site · scrolled {esc(max_depth)}% · visit {esc(group['sid'])}</p>"
            "<table><thead><tr><td>Time</td><td>What happened</td></tr></thead><tbody>"
            + "".join(rows)
            + "</tbody></table></section>"
        )
    generated = datetime.now(local).strftime("%Y-%m-%d %H:%M %Z")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visits</title>
<style>
  body {{ margin: 0; font: 16px/1.45 ui-sans-serif, system-ui, sans-serif; background: #f6f5f2; color: #1c1b19; }}
  main {{ max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }}
  h1 {{ font-size: 1.4rem; margin: 0 0 0.25rem; }}
  a {{ color: inherit; }}
  .sub {{ color: #5e5a54; margin: 0.35rem 0 1rem; }}
  section {{ background: #fff; border: 1px solid #e4e0d8; border-radius: 12px; padding: 1rem 1.1rem; margin: 0 0 0.9rem; }}
  section .sub {{ margin-bottom: 0.6rem; }}
  h2 {{ font-size: 1rem; margin: 0; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td {{ padding: 0.28rem 0.6rem 0.28rem 0; vertical-align: baseline; }}
  td:first-child {{ width: 5.5rem; color: #5e5a54; white-space: nowrap; }}
  thead td {{ font-size: 0.85rem; }}
</style>
</head>
<body>
<main>
  <h1>Visits</h1>
  <p class="sub">{esc(generated)} · clicks, scroll stops, and when they leave. Typed text is not stored. · <a href="/stats/">Web stats</a> · <a href="/server/">Server</a></p>
  {''.join(blocks)}
</main>
</body>
</html>
"""


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    html_text = render(sessions(load_rows()))
    tmp = OUT.with_suffix(".html.tmp")
    tmp.write_text(html_text, encoding="utf-8")
    tmp.chmod(0o644)
    tmp.replace(OUT)


if __name__ == "__main__":
    main()
