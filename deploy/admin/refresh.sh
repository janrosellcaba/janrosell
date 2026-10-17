#!/usr/bin/env bash
# Rebuild janrosell.com/stats/ (GoAccess) and /server/ (VPS snapshot).
# A full reparse is cheap on this site. Do not use --real-time-html.
set -euo pipefail

LOGDIR=/var/log/janrosell
WEB_OUT=/var/www/janrosell-admin/stats/index.html
SERVER_OUT=/var/www/janrosell-admin/server/index.html

esc() {
	local s=$1
	s=${s//&/&amp;}
	s=${s//</&lt;}
	s=${s//>/&gt;}
	printf '%s' "$s"
}

write_web_placeholder() {
	local message=$1
	mkdir -p "$(dirname "$WEB_OUT")"
	cat >"$WEB_OUT" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>janrosell.com stats</title>
</head>
<body>
<p>$(esc "$message")</p>
<p><a href="/server/">Server</a></p>
</body>
</html>
EOF
	chgrp www-data "$WEB_OUT" 2>/dev/null || true
	chmod 644 "$WEB_OUT"
}

write_web() {
	mkdir -p "$(dirname "$WEB_OUT")"
	shopt -s nullglob
	local logs=("$LOGDIR"/access.log*)
	shopt -u nullglob

	if ((${#logs[@]} == 0)); then
		write_web_placeholder "No requests logged yet. This page fills in after people visit the site."
		return
	fi

	local tmp
	tmp=$(mktemp --suffix=.html "${WEB_OUT}.XXXXXX")
	if ! nice -n 10 ionice -c3 zcat -f "${logs[@]}" \
		| goaccess - \
			--log-format=COMBINED \
			-q \
			--anonymize-ip \
			--ignore-panel=GEO_LOCATION \
			--no-parsing-spinner \
			--html-report-title="janrosell.com" \
			--output="$tmp"
	then
		rm -f "$tmp"
		write_web_placeholder "No requests logged yet. This page fills in after people visit the site."
		return
	fi

	chgrp www-data "$tmp" 2>/dev/null || true
	chmod 644 "$tmp"
	mv -f "$tmp" "$WEB_OUT"
}

write_server() {
	mkdir -p "$(dirname "$SERVER_OUT")" /var/lib/janrosell-admin
	local tmp
	tmp=$(mktemp --suffix=.html "${SERVER_OUT}.XXXXXX")
	if ! python3 - "$tmp" <<'PY'
import json, glob, re, shutil, subprocess, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

out_path = Path(__import__("sys").argv[1])
sample_path = Path("/var/lib/janrosell-admin/sample.json")
services = ["nginx", "janrosell", "my-finance", "sports-trackr", "fail2ban"]

def run(args, timeout=5):
    try:
        result = subprocess.run(args, text=True, timeout=timeout, capture_output=True)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    return result.stdout or ""

def esc(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

def human(num):
    n = float(num)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            if unit == "B":
                return f"{int(n)} B"
            text = f"{n:.1f}".rstrip("0").rstrip(".")
            return f"{text} {unit}"
        n /= 1024
    return f"{n:.1f} TB"

def human_rate(num):
    if num is None:
        return "—"
    return human(num) + "/s"

def bar(pct):
    pct = max(0, min(100, int(round(pct))))
    return f'<div class="bar"><span style="width:{pct}%"></span></div>'

def section(title, body):
    return f"<section><h2>{esc(title)}</h2>{body}</section>"

def table(headers, rows):
    head = "".join(f"<td>{esc(cell)}</td>" for cell in headers)
    body = []
    for row in rows:
        body.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>")
    return "<table><thead><tr>" + head + "</tr></thead><tbody>" + "".join(body) + "</tbody></table>"

def kv(pairs):
    rows = []
    for label, value in pairs:
        rows.append(f"<tr><td>{esc(label)}</td><td>{esc(value)}</td></tr>")
    return "<table>" + "".join(rows) + "</table>"

def lscpu():
    info = {}
    for line in run(["lscpu"]).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        info[key.strip()] = value.strip()
    return info

def cpu_times():
    parts = Path("/proc/stat").read_text().splitlines()[0].split()[1:]
    nums = [int(part) for part in parts]
    idle = nums[3] + (nums[4] if len(nums) > 4 else 0)
    return idle, sum(nums)

def cpu_usage():
    idle1, total1 = cpu_times()
    time.sleep(0.3)
    idle2, total2 = cpu_times()
    delta = total2 - total1
    if delta <= 0:
        return None
    return round(100 * (1 - (idle2 - idle1) / delta), 1)

def meminfo():
    info = {}
    for line in Path("/proc/meminfo").read_text().splitlines():
        key, value = line.split(":", 1)
        info[key] = int(value.strip().split()[0])
    return info

def mhz():
    values = []
    for line in Path("/proc/cpuinfo").read_text().splitlines():
        if line.lower().startswith("cpu mhz"):
            try:
                values.append(float(line.split(":", 1)[1]))
            except ValueError:
                pass
    if not values:
        return None
    return round(sum(values) / len(values), 0)

def temperatures():
    found = []
    for path in sorted(glob.glob("/sys/class/thermal/thermal_zone*/temp")):
        try:
            milli = int(Path(path).read_text().strip())
        except (OSError, ValueError):
            continue
        label = Path(path).parent.name
        type_path = Path(path).with_name("type")
        try:
            label = type_path.read_text().strip() or label
        except OSError:
            pass
        found.append({"label": label, "celsius": round(milli / 1000, 1)})
    for path in sorted(glob.glob("/sys/class/hwmon/hwmon*/temp*_input")):
        try:
            milli = int(Path(path).read_text().strip())
        except (OSError, ValueError):
            continue
        folder = Path(path).parent
        name = Path(path).name.replace("_input", "")
        label = name
        for candidate in (folder / f"{name}_label", folder / "name"):
            try:
                text = candidate.read_text().strip()
            except OSError:
                continue
            if text:
                label = text
                break
        found.append({"label": label, "celsius": round(milli / 1000, 1)})
    return found

def nvidia():
    if not shutil.which("nvidia-smi"):
        return []
    raw = run([
        "nvidia-smi",
        "--query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits",
    ])
    cards = []
    for line in raw.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 5:
            continue

        def num(value):
            if value in ("", "[N/A]", "N/A"):
                return None
            try:
                return float(value)
            except ValueError:
                return None

        name, temp, util, used, total = parts[:5]
        cards.append({
            "name": name,
            "kind": "nvidia",
            "temperature_c": num(temp),
            "utilization_percent": num(util),
            "memory_used_mb": num(used),
            "memory_total_mb": num(total),
        })
    return cards

def virtual_gpus():
    cards = []
    for uevent in sorted(glob.glob("/sys/class/drm/card[0-9]/device/uevent")):
        text = Path(uevent).read_text()
        fields = dict(
            line.split("=", 1) for line in text.splitlines() if "=" in line
        )
        pci = fields.get("PCI_ID", "")
        driver = fields.get("DRIVER", "")
        if pci == "1AF4:1050" or driver == "virtio-pci":
            name = "virtio-gpu"
        else:
            name = driver or pci or "display"
        cards.append({
            "name": name,
            "kind": "virtual" if name == "virtio-gpu" else "pci",
            "pci": pci or None,
            "temperature_c": None,
            "utilization_percent": None,
            "memory_used_mb": None,
            "memory_total_mb": None,
        })
    return cards

def filesystems():
    raw = run(["df", "-x", "tmpfs", "-x", "devtmpfs", "-x", "efivarfs", "-PT", "-B1"])
    found = []
    for line in raw.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 7:
            continue
        size, used, avail = int(parts[2]), int(parts[3]), int(parts[4])
        pct = round(100 * used / size, 1) if size else 0
        found.append({
            "device": parts[0],
            "fstype": parts[1],
            "size_bytes": size,
            "used_bytes": used,
            "avail_bytes": avail,
            "used_percent": pct,
            "mount": parts[6],
        })
    return found

def inodes(mount):
    raw = run(["df", "-Pi", mount])
    lines = raw.splitlines()
    if len(lines) < 2:
        return None
    parts = lines[1].split()
    if len(parts) < 5:
        return None
    pct = parts[4].strip("%")
    try:
        return {"used": int(parts[2]), "total": int(parts[1]), "used_percent": int(pct)}
    except ValueError:
        return None

def block_devices():
    raw = run(["lsblk", "-J", "-b", "-d", "-o", "NAME,SIZE,TYPE,MODEL"])
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    devices = []
    for device in data.get("blockdevices", []):
        if device.get("type") != "disk":
            continue
        devices.append({
            "name": device.get("name"),
            "size_bytes": device.get("size") or 0,
            "model": (device.get("model") or "").strip() or None,
        })
    return devices

def diskstats(names):
    stats = {}
    wanted = set(names)
    for line in Path("/proc/diskstats").read_text().splitlines():
        parts = line.split()
        if len(parts) < 14 or parts[2] not in wanted:
            continue
        sector = 512
        stats[parts[2]] = {
            "read_bytes": int(parts[5]) * sector,
            "write_bytes": int(parts[9]) * sector,
            "io_in_progress": int(parts[11]),
        }
    return stats

def interfaces():
    raw = run(["ip", "-j", "addr"])
    found = []
    if raw:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = []
        for item in data:
            name = item.get("ifname")
            if not name or name == "lo":
                continue
            addresses = []
            for addr in item.get("addr_info", []):
                if addr.get("scope") != "global":
                    continue
                local = addr.get("local")
                if local:
                    addresses.append(local)
            found.append({
                "name": name,
                "state": item.get("operstate") or "unknown",
                "addresses": addresses,
            })
    counters = {}
    for line in Path("/proc/net/dev").read_text().splitlines()[2:]:
        if ":" not in line:
            continue
        name, rest = line.split(":", 1)
        name = name.strip()
        parts = rest.split()
        if len(parts) < 16 or name == "lo":
            continue
        counters[name] = {
            "rx_bytes": int(parts[0]),
            "rx_packets": int(parts[1]),
            "rx_errors": int(parts[2]),
            "rx_dropped": int(parts[3]),
            "tx_bytes": int(parts[8]),
            "tx_packets": int(parts[9]),
            "tx_errors": int(parts[10]),
            "tx_dropped": int(parts[11]),
        }
    by_name = {item["name"]: item for item in found}
    for name, counter in counters.items():
        item = by_name.setdefault(name, {"name": name, "state": "unknown", "addresses": []})
        item.update(counter)
    return [item for item in by_name.values() if "rx_bytes" in item]

def sockets():
    info = {}
    path = Path("/proc/net/sockstat")
    if not path.exists():
        return info
    for line in path.read_text().splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == "TCP:" and "inuse" in parts:
            info["tcp_inuse"] = int(parts[parts.index("inuse") + 1])
        elif parts[0] == "UDP:" and "inuse" in parts:
            info["udp_inuse"] = int(parts[parts.index("inuse") + 1])
    return info

def proc_label(pid, fallback):
    comm = fallback
    try:
        comm = Path(f"/proc/{pid}/comm").read_text().strip() or fallback
    except OSError:
        pass
    try:
        raw = Path(f"/proc/{pid}/cmdline").read_bytes().split(b"\0")
    except OSError:
        return comm
    args = [part.decode("utf-8", "replace") for part in raw if part]
    if not args:
        return comm
    exe = Path(args[0]).name.split()[0]
    script = ""
    for arg in args[1:]:
        if arg.startswith("-"):
            continue
        script = Path(arg).name
        break
    if "pm2" in " ".join(args):
        return "pm2"
    if exe in {"npm", "pnpm", "yarn", "sshd", "nginx"}:
        return exe
    if script and exe in {"node", "python", "python3", "ruby", "perl"}:
        return f"{exe} {script}"
    if comm.startswith("next-server"):
        return "next-server"
    return comm or fallback

def listeners():
    raw = run(["ss", "-H", "-ltnp"])
    found = []
    seen = set()
    for line in raw.splitlines():
        parts = line.split()
        if len(parts) < 4:
            continue
        address = re.sub(r"%[^:\]]+", "", parts[3])
        match = re.search(r'\("([^"]+)",pid=(\d+)', line)
        process = proc_label(match.group(2), match.group(1)) if match else ""
        key = (address, process)
        if key in seen:
            continue
        seen.add(key)
        found.append({"address": address, "process": process or "—"})

    def sort_key(item):
        tail = item["address"].rsplit(":", 1)[-1]
        try:
            return (int(tail), item["address"])
        except ValueError:
            return (99999, item["address"])

    return sorted(found, key=sort_key)[:40]

def pressure():
    found = {}
    for kind in ("cpu", "memory", "io"):
        path = Path(f"/proc/pressure/{kind}")
        if not path.exists():
            continue
        first = path.read_text().splitlines()[0]
        match = re.search(r"avg10=([0-9.]+)", first)
        if match:
            found[kind] = float(match.group(1))
    return found

def service_states():
    rows = []
    for name in services:
        state = run(["systemctl", "is-active", name]).strip() or "unknown"
        rows.append({"name": name, "state": state})
    return rows

def failed_units():
    raw = run(["systemctl", "--failed", "--no-legend", "--plain", "--no-pager"])
    return [line for line in raw.splitlines() if line.strip()]

def processes():
    raw = run(["ps", "-eo", "pid,pcpu,pmem,rss,comm", "--sort=-rss", "--no-headers"])
    found = []
    for line in raw.splitlines():
        parts = line.split(None, 4)
        if len(parts) < 5:
            continue
        found.append({
            "pid": int(parts[0]),
            "cpu_percent": float(parts[1]),
            "memory_percent": float(parts[2]),
            "rss_bytes": int(parts[3]) * 1024,
            "name": proc_label(parts[0], parts[4]),
        })
        if len(found) == 8:
            break
    return found

def load_sample():
    if not sample_path.exists():
        return None
    try:
        data = json.loads(sample_path.read_text())
    except (OSError, json.JSONDecodeError):
        return None
    if time.time() - data.get("ts", 0) > 36 * 3600:
        return None
    return data

def rate(current, previous, dt):
    if previous is None or dt <= 0:
        return None
    value = (current - previous) / dt
    if value < 0:
        return None
    return round(value, 1)

cpu = lscpu()
mem = meminfo()
usage = cpu_usage()
now = time.time()
previous = load_sample()
dt = now - previous["ts"] if previous else 0
temps = temperatures()
gpus = nvidia() or virtual_gpus()
fs = filesystems()
root_inodes = inodes("/")
devices = block_devices()
io = diskstats([device["name"] for device in devices])
nics = interfaces()
sock = sockets()
ports = listeners()
stress = pressure()
units = service_states()
failed = failed_units()
procs = processes()
load = [float(part) for part in Path("/proc/loadavg").read_text().split()[:3]]
uptime_seconds = float(Path("/proc/uptime").read_text().split()[0])
boot = datetime.now(timezone.utc) - timedelta(seconds=uptime_seconds)
local_now = datetime.now(ZoneInfo("Europe/Madrid"))
utc_now = datetime.now(timezone.utc)
os_release = {}
for line in Path("/etc/os-release").read_text().splitlines():
    if "=" not in line:
        continue
    key, value = line.split("=", 1)
    os_release[key] = value.strip().strip('"')

mem_total = mem.get("MemTotal", 0)
mem_avail = mem.get("MemAvailable", 0)
mem_used = max(mem_total - mem_avail, 0)
mem_pct = round(100 * mem_used / mem_total, 1) if mem_total else 0
swap_total = mem.get("SwapTotal", 0)
swap_free = mem.get("SwapFree", 0)
swap_used = max(swap_total - swap_free, 0)
swap_pct = round(100 * swap_used / swap_total, 1) if swap_total else 0

for device in devices:
    stats = io.get(device["name"], {})
    device["read_bytes"] = stats.get("read_bytes", 0)
    device["write_bytes"] = stats.get("write_bytes", 0)
    device["io_in_progress"] = stats.get("io_in_progress", 0)
    prev = (previous or {}).get("disks", {}).get(device["name"], {})
    device["read_bytes_per_sec"] = rate(device["read_bytes"], prev.get("read_bytes"), dt)
    device["write_bytes_per_sec"] = rate(device["write_bytes"], prev.get("write_bytes"), dt)

for nic in nics:
    prev = (previous or {}).get("network", {}).get(nic["name"], {})
    nic["rx_bytes_per_sec"] = rate(nic["rx_bytes"], prev.get("rx_bytes"), dt)
    nic["tx_bytes_per_sec"] = rate(nic["tx_bytes"], prev.get("tx_bytes"), dt)

cpu_mhz = mhz()
payload = {
    "host": "ion",
    "collected_at": {
        "local": local_now.strftime("%Y-%m-%d %H:%M %Z"),
        "utc": utc_now.strftime("%Y-%m-%d %H:%M UTC"),
    },
    "os": {
        "name": os_release.get("PRETTY_NAME"),
        "kernel": run(["uname", "-r"]).strip(),
        "arch": cpu.get("Architecture"),
        "virtualization": run(["systemd-detect-virt"]).strip() or cpu.get("Hypervisor vendor"),
        "booted_at": boot.strftime("%Y-%m-%d %H:%M UTC"),
        "uptime_seconds": int(uptime_seconds),
    },
    "cpu": {
        "model": cpu.get("Model name"),
        "vendor": cpu.get("Vendor ID"),
        "cpus": int(cpu.get("CPU(s)") or 0),
        "cores_per_socket": int(cpu.get("Core(s) per socket") or 0),
        "threads_per_core": int(cpu.get("Thread(s) per core") or 0),
        "sockets": int(cpu.get("Socket(s)") or 0),
        "mhz": cpu_mhz,
        "l3_cache": cpu.get("L3 cache"),
        "bogomips": float(cpu["BogoMIPS"]) if cpu.get("BogoMIPS") else None,
        "usage_percent": usage,
        "load": {"1m": load[0], "5m": load[1], "15m": load[2]},
    },
    "memory": {
        "total_kb": mem_total,
        "used_kb": mem_used,
        "available_kb": mem_avail,
        "used_percent": mem_pct,
        "cached_kb": mem.get("Cached", 0),
        "buffers_kb": mem.get("Buffers", 0),
        "swap_total_kb": swap_total,
        "swap_used_kb": swap_used,
        "swap_used_percent": swap_pct,
    },
    "pressure_avg10": stress or None,
    "filesystems": fs,
    "root_inodes": root_inodes,
    "disks": devices,
    "network": nics,
    "sockets": sock,
    "temperature_c": temps or None,
    "gpu": gpus or None,
    "listeners": ports,
    "services": units,
    "failed_units": failed,
    "processes": procs,
}

sample = {
    "ts": now,
    "disks": {
        device["name"]: {"read_bytes": device["read_bytes"], "write_bytes": device["write_bytes"]}
        for device in devices
    },
    "network": {
        nic["name"]: {"rx_bytes": nic["rx_bytes"], "tx_bytes": nic["tx_bytes"]}
        for nic in nics
    },
}
sample_path.write_text(json.dumps(sample))
sample_path.chmod(0o600)

uptime_text = run(["uptime", "-p"]).strip() or f"{int(uptime_seconds // 3600)} hours"
cpu_count = payload["cpu"]["cpus"] or 1
hw_pairs = [
    ("CPU", payload["cpu"]["model"] or "unknown"),
    ("Layout", f"{cpu_count} vCPU · {payload['cpu']['sockets']} socket · {payload['cpu']['cores_per_socket']} core · {payload['cpu']['threads_per_core']} threads"),
    ("Cache", payload["cpu"]["l3_cache"] or "—"),
    ("Memory", human(mem_total * 1024)),
]
for device in devices:
    label = device["name"]
    if device["model"]:
        label = f"{label} · {device['model']}"
    hw_pairs.append(("Disk", f"{label} · {human(device['size_bytes'])}"))
if gpus:
    for card in gpus:
        if card["kind"] == "virtual":
            detail = "virtual display, no temperature or usage"
        else:
            bits = []
            if card["temperature_c"] is not None:
                bits.append(f"{card['temperature_c']:g} °C")
            if card["utilization_percent"] is not None:
                bits.append(f"{card['utilization_percent']:g}%")
            if card["memory_total_mb"]:
                bits.append(f"{card['memory_used_mb']:g} / {card['memory_total_mb']:g} MB")
            detail = " · ".join(bits) or card["kind"]
        hw_pairs.append(("GPU", f"{card['name']} · {detail}"))
else:
    hw_pairs.append(("GPU", "none"))
hw_pairs.append(("Temperature", "no sensors exposed" if not temps else ", ".join(
    f"{item['label']} {item['celsius']} °C" for item in temps
)))
hw_pairs.append(("Machine", f"{payload['os']['virtualization']} · {payload['os']['arch']}"))

os_pairs = [
    ("OS", payload["os"]["name"] or "unknown"),
    ("Kernel", payload["os"]["kernel"] or "unknown"),
    ("Booted", payload["os"]["booted_at"]),
    ("Uptime", uptime_text),
]

cpu_body = []
if usage is not None:
    cpu_body.append(f'<p class="metric">{esc(usage)}% busy</p>{bar(usage)}')
cpu_body.append(
    f'<p class="metric">{esc(load[0])} · {esc(load[1])} · {esc(load[2])}</p>'
    f'<p class="sub">load 1 · 5 · 15 minutes'
    + (f" · {esc(int(cpu_mhz))} MHz" if cpu_mhz else "")
    + "</p>"
)
if "cpu" in stress:
    cpu_body.append(f'<p class="sub">pressure {esc(stress["cpu"])}% over 10s</p>')

mem_body = (
    f'<p class="metric">{esc(human(mem_used * 1024))} used · {esc(human(mem_avail * 1024))} available</p>'
    f'{bar(mem_pct)}<p class="sub">{esc(mem_pct)}% of {esc(human(mem_total * 1024))}'
    f' · cache {esc(human(mem.get("Cached", 0) * 1024))}'
    f' · buffers {esc(human(mem.get("Buffers", 0) * 1024))}</p>'
)
if swap_total:
    mem_body += (
        f'<p class="metric">{esc(human(swap_used * 1024))} swap used</p>{bar(swap_pct)}'
        f'<p class="sub">{esc(swap_pct)}% of {esc(human(swap_total * 1024))}'
        + (f" · pressure {esc(stress['memory'])}% over 10s" if "memory" in stress else "")
        + "</p>"
    )

fs_rows = []
for item in fs:
    fs_rows.append([
        esc(item["mount"]),
        esc(item["fstype"]),
        esc(f"{human(item['used_bytes'])} / {human(item['size_bytes'])}"),
        esc(f"{item['used_percent']:g}%"),
    ])
fs_body = table(["Mount", "Type", "Used", "Full"], fs_rows)
if root_inodes:
    fs_body += f'<p class="sub">/ inodes {esc(root_inodes["used_percent"])}% used</p>'
for device in devices:
    fs_body += (
        f'<p class="sub">{esc(device["name"])} read {esc(human(device["read_bytes"]))}'
        f' ({esc(human_rate(device["read_bytes_per_sec"]))})'
        f' · write {esc(human(device["write_bytes"]))}'
        f' ({esc(human_rate(device["write_bytes_per_sec"]))})'
        + (f" · pressure {esc(stress['io'])}% over 10s" if "io" in stress else "")
        + "</p>"
    )

net_rows = []
for nic in nics:
    addresses = ", ".join(nic["addresses"]) or "—"
    errors = nic["rx_errors"] + nic["tx_errors"] + nic["rx_dropped"] + nic["tx_dropped"]
    traffic = (
        f'{human(nic["rx_bytes"])} in ({human_rate(nic["rx_bytes_per_sec"])})'
        f' · {human(nic["tx_bytes"])} out ({human_rate(nic["tx_bytes_per_sec"])})'
    )
    if errors:
        traffic += f" · {errors} errors"
    net_rows.append([esc(nic["name"]), esc(nic["state"]), esc(addresses), esc(traffic)])
sock_line = []
if "tcp_inuse" in sock:
    sock_line.append(f'{sock["tcp_inuse"]} TCP')
if "udp_inuse" in sock:
    sock_line.append(f'{sock["udp_inuse"]} UDP')
net_body = table(["Iface", "State", "Address", "Traffic"], net_rows)
if sock_line:
    net_body += f'<p class="sub">{esc(" · ".join(sock_line))} sockets in use</p>'

temp_html = ""
if temps:
    temp_html = section("Temperature", table(
        ["Sensor", "°C"],
        [[esc(item["label"]), esc(item["celsius"])] for item in temps],
    ))

listen_html = ""
if ports:
    listen_html = section("Listening", table(
        ["Address", "Process"],
        [[esc(item["address"]), esc(item["process"])] for item in ports],
    ))

service_rows = []
for unit in units:
    klass = "ok" if unit["state"] == "active" else "bad"
    service_rows.append([esc(unit["name"]), f'<span class="{klass}">{esc(unit["state"])}</span>'])
failed_html = "<p class=\"sub\">None</p>" if not failed else "<pre>" + esc("\n".join(failed)) + "</pre>"
proc_rows = [[
    esc(item["name"]),
    esc(item["pid"]),
    esc(item["cpu_percent"]),
    esc(human(item["rss_bytes"])),
] for item in procs]

snapshot = json.dumps(payload, indent=2, ensure_ascii=False)
snapshot = snapshot.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ion</title>
<style>
  body {{ margin: 0; font: 16px/1.45 ui-sans-serif, system-ui, sans-serif; background: #f6f5f2; color: #1c1b19; }}
  main {{ max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }}
  .top {{ display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.1rem; }}
  h1 {{ font-size: 1.4rem; margin: 0 0 0.25rem; }}
  a {{ color: inherit; }}
  button {{ font: inherit; color: inherit; background: #fff; border: 1px solid #e4e0d8; border-radius: 999px; padding: 0.35rem 0.75rem; cursor: pointer; white-space: nowrap; }}
  .sub {{ color: #5e5a54; margin: 0.35rem 0 0; }}
  section {{ background: #fff; border: 1px solid #e4e0d8; border-radius: 12px; padding: 1rem 1.1rem; margin: 0 0 0.9rem; }}
  h2 {{ font-size: 0.8rem; letter-spacing: 0.04em; text-transform: uppercase; margin: 0 0 0.7rem; color: #5e5a54; }}
  .metric {{ font-size: 1.15rem; margin: 0.15rem 0; }}
  .bar {{ height: 8px; background: #eeeae3; border-radius: 99px; overflow: hidden; margin: 0.45rem 0 0.2rem; }}
  .bar span {{ display: block; height: 100%; background: #2f6f4e; }}
  table {{ width: 100%; border-collapse: collapse; }}
  td {{ padding: 0.28rem 0.4rem 0.28rem 0; vertical-align: baseline; }}
  td:last-child {{ text-align: right; }}
  thead td {{ color: #5e5a54; font-size: 0.85rem; }}
  .ok {{ color: #2f6f4e; }}
  .bad {{ color: #9c2f2f; font-weight: 650; }}
  pre {{ white-space: pre-wrap; margin: 0; font: 0.9rem/1.4 ui-monospace, monospace; }}
</style>
</head>
<body>
<main>
  <div class="top">
    <div>
      <h1>ion</h1>
      <p class="sub">{esc(payload["collected_at"]["local"])} · {esc(payload["collected_at"]["utc"])} · <a href="/stats/">Web stats</a></p>
    </div>
    <button type="button" id="copy-json">Copy JSON</button>
  </div>
  {section("Hardware", kv(hw_pairs))}
  {section("System", kv(os_pairs))}
  {section("CPU", "".join(cpu_body))}
  {section("Memory", mem_body)}
  {temp_html}
  {section("Storage", fs_body)}
  {section("Network", net_body)}
  {listen_html}
  {section("Services", table(["Service", "State"], service_rows))}
  {section("Failed units", failed_html)}
  {section("Processes", table(["Process", "PID", "CPU", "RAM"], proc_rows))}
</main>
<script type="application/json" id="snapshot">{snapshot}</script>
<script>
document.getElementById("copy-json").addEventListener("click", async function () {{
  var button = document.getElementById("copy-json");
  var text = document.getElementById("snapshot").textContent;
  try {{
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  }} catch (error) {{
    button.textContent = "Copy failed";
  }}
  setTimeout(function () {{ button.textContent = "Copy JSON"; }}, 1500);
}});
</script>
</body>
</html>
"""
out_path.write_text(html)
PY
	then
		rm -f "$tmp"
		return 1
	fi
	chgrp www-data "$tmp" 2>/dev/null || true
	chmod 644 "$tmp"
	mv -f "$tmp" "$SERVER_OUT"
}

if ! command -v goaccess >/dev/null 2>&1; then
	echo "goaccess is not installed" >&2
	exit 1
fi

write_server
write_web
echo "Updated $WEB_OUT and $SERVER_OUT"
