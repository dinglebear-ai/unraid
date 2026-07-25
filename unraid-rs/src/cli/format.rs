// Column header literals in println! format strings are intentional — they are
// human-readable table headers, not redundant formatting.
#![allow(clippy::print_literal)]

use serde_json::Value;

// ── top-level dispatcher ──────────────────────────────────────────────────────

pub fn print_human(cmd: &str, data: &Value) {
    match cmd {
        "array" => fmt_array(data),
        "disks" => fmt_disks(data),
        "docker" => fmt_docker(data),
        "docker_logs" => fmt_docker_logs(data),
        "vms" => fmt_vms(data),
        "server" => fmt_server(data),
        "info" => fmt_info(data),
        "shares" => fmt_shares(data),
        "notifications" => fmt_notifications(data),
        "log_files" => fmt_log_files(data),
        "log_file" => fmt_log_file(data),
        "services" => fmt_services(data),
        "network" => fmt_network(data),
        "ups" => fmt_ups(data),
        "ups_config" => fmt_ups_config(data),
        "metrics" => fmt_metrics(data),
        "plugins" => fmt_plugins(data),
        "parity_history" => fmt_parity_history(data),
        "vars" => fmt_vars(data),
        "registration" => fmt_registration(data),
        "flash" => fmt_flash(data),
        "rclone" => fmt_rclone(data),
        "remote_access" => fmt_remote_access(data),
        "connect" => fmt_connect(data),
        _ => println!("{}", serde_json::to_string_pretty(data).unwrap_or_default()),
    }
}

// ── formatters ────────────────────────────────────────────────────────────────

fn fmt_array(data: &Value) {
    let a = &data["array"];
    println!("Array: {}", str_val(&a["state"]));

    let kb = &a["capacity"]["kilobytes"];
    let total = kb_to_tb(&kb["total"]);
    let used = kb_to_tb(&kb["used"]);
    let free = kb_to_tb(&kb["free"]);
    println!("Capacity: {total:.1} TB total  {used:.1} TB used  {free:.1} TB free");

    let parity = &a["parityCheckStatus"];
    let pstatus = str_val(&parity["status"]);
    if parity["running"].as_bool() == Some(true) {
        let progress = parity["progress"].as_i64().unwrap_or(0);
        let speed = str_val(&parity["speed"]);
        println!("Parity: {pstatus} — {progress}% at {speed} MB/s");
    } else {
        println!("Parity: {pstatus}");
    }

    if let Some(disks) = a["disks"].as_array() {
        println!("\nData Disks ({}):", disks.len());
        println!(
            "  {:<8} {:<8} {:<10} {:>5}  {:>8}  {:>8}  {:>8}  {}",
            "NAME", "DEV", "STATUS", "TEMP", "SIZE", "USED", "FREE", "FS"
        );
        for d in disks {
            let temp = d["temp"]
                .as_i64()
                .map(|t| format!("{t}°C"))
                .unwrap_or_else(|| "--".into());
            println!(
                "  {:<8} {:<8} {:<10} {:>5}  {:>8}  {:>8}  {:>8}  {}",
                str_val(&d["name"]),
                str_val(&d["device"]),
                str_val(&d["status"]),
                temp,
                fmt_kb(bigint_f64(&d["size"]) as i64),
                bigint_opt(&d["fsUsed"])
                    .map(|v| fmt_kb(v as i64))
                    .unwrap_or_else(|| "--".into()),
                bigint_opt(&d["fsFree"])
                    .map(|v| fmt_kb(v as i64))
                    .unwrap_or_else(|| "--".into()),
                str_val_or(&d["fsType"], "--"),
            );
        }
    }

    if let Some(caches) = a["caches"].as_array().filter(|c| !c.is_empty()) {
        println!("\nCaches ({}):", caches.len());
        println!(
            "  {:<8} {:<10} {:<10} {:>5}  {:>8}  {:>8}  {:>8}  {}",
            "NAME", "DEV", "STATUS", "TEMP", "SIZE", "USED", "FREE", "FS"
        );
        for c in caches {
            let temp = c["temp"]
                .as_i64()
                .map(|t| format!("{t}°C"))
                .unwrap_or_else(|| "--".into());
            println!(
                "  {:<8} {:<10} {:<10} {:>5}  {:>8}  {:>8}  {:>8}  {}",
                str_val(&c["name"]),
                str_val(&c["device"]),
                str_val(&c["status"]),
                temp,
                fmt_kb(bigint_f64(&c["size"]) as i64),
                bigint_opt(&c["fsUsed"])
                    .map(|v| fmt_kb(v as i64))
                    .unwrap_or_else(|| "--".into()),
                bigint_opt(&c["fsFree"])
                    .map(|v| fmt_kb(v as i64))
                    .unwrap_or_else(|| "--".into()),
                str_val_or(&c["fsType"], "--"),
            );
        }
    }
}

fn fmt_disks(data: &Value) {
    let disks = match data["disks"].as_array() {
        Some(d) => d,
        None => {
            println!("No disks found.");
            return;
        }
    };
    println!(
        "{:<12} {:<8} {:<28} {:>5}  {:>10}  {:<8}  {}",
        "DEVICE", "TYPE", "MODEL", "TEMP", "SIZE", "SMART", "INTERFACE"
    );
    for d in disks {
        let temp = d["temperature"]
            .as_f64()
            .map(|t| format!("{t:.0}°C"))
            .unwrap_or_else(|| "--".into());
        println!(
            "{:<12} {:<8} {:<28} {:>5}  {:>10}  {:<8}  {}",
            str_val(&d["device"]),
            str_val(&d["type"]),
            str_val(&d["name"]),
            temp,
            fmt_bytes(d["size"].as_f64().unwrap_or(0.0)),
            str_val(&d["smartStatus"]),
            str_val(&d["interfaceType"]),
        );
    }
}

fn fmt_docker(data: &Value) {
    // CLI receives raw service output (not paginated) — handle both shapes.
    let containers = data["docker"]["containers"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[]);
    if containers.is_empty() {
        println!("No containers found.");
        return;
    }
    println!("{:<32} {:<10} {}", "NAME", "STATE", "STATUS");
    for c in containers {
        let name = c["names"]
            .as_array()
            .and_then(|a| a.first())
            .and_then(|v| v.as_str())
            .unwrap_or("?");
        let update = if c["isUpdateAvailable"].as_bool() == Some(true) {
            " [UPDATE]"
        } else {
            ""
        };
        println!(
            "{:<32} {:<10} {}{}",
            name,
            str_val(&c["state"]),
            str_val(&c["status"]),
            update,
        );
    }
    println!("\n{} container(s)", containers.len());
}

fn fmt_docker_logs(data: &Value) {
    // Each log line is a { timestamp, message } object (DockerContainerLogLine).
    if let Some(lines) = data["docker"]["logs"]["lines"].as_array() {
        for line in lines {
            let ts = str_val_or(&line["timestamp"], "");
            let msg = str_val_or(&line["message"], "");
            if ts.is_empty() {
                println!("{msg}");
            } else {
                println!("{ts}  {msg}");
            }
        }
    } else {
        println!("{}", serde_json::to_string_pretty(data).unwrap_or_default());
    }
}

fn fmt_vms(data: &Value) {
    let domains = data["vms"]["domains"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[]);
    if domains.is_empty() {
        println!("No VMs found.");
        return;
    }
    println!("{:<32} {}", "NAME", "STATE");
    for vm in domains {
        println!(
            "{:<32} {}",
            str_val_or(&vm["name"], "?"),
            str_val(&vm["state"])
        );
    }
}

fn fmt_server(data: &Value) {
    let s = &data["server"];
    println!("Server:  {}", str_val(&s["name"]));
    let comment = str_val_or(&s["comment"], "");
    if !comment.is_empty() {
        println!("Comment: {comment}");
    }
    println!("Status:  {}", str_val(&s["status"]));
    println!("LAN IP:  {}", str_val(&s["lanip"]));
    println!("URL:     {}", str_val(&s["localurl"]));
    let wan = str_val_or(&s["wanip"], "");
    if !wan.is_empty() {
        println!("WAN IP:  {wan}");
    }
    let remote = str_val_or(&s["remoteurl"], "");
    if !remote.is_empty() {
        println!("Remote:  {remote}");
    }
}

fn fmt_info(data: &Value) {
    let info = &data["info"];
    let os = &info["os"];
    println!("── OS ──────────────────────────────");
    println!("  Hostname: {}", str_val(&os["hostname"]));
    println!(
        "  Distro:   {} {}",
        str_val_or(&os["distro"], ""),
        str_val_or(&os["release"], "")
    );
    println!("  Kernel:   {}", str_val(&os["kernel"]));
    if let Some(uptime) = os["uptime"].as_str() {
        println!("  Uptime:   {uptime}");
    }

    let cpu = &info["cpu"];
    println!("\n── CPU ─────────────────────────────");
    println!(
        "  {}",
        str_val_or(&cpu["brand"], str_val_or(&cpu["manufacturer"], "?"))
    );
    println!(
        "  {} cores  {} threads  {:.1} GHz",
        cpu["cores"].as_i64().unwrap_or(0),
        cpu["threads"].as_i64().unwrap_or(0),
        cpu["speed"].as_f64().unwrap_or(0.0),
    );

    if let Some(slots) = info["memory"]["layout"].as_array() {
        let total_gb: f64 = slots
            .iter()
            .filter_map(|s| bigint_opt(&s["size"]))
            .sum::<f64>()
            / 1_073_741_824.0;
        println!("\n── Memory ──────────────────────────");
        println!("  {total_gb:.0} GB across {} slot(s)", slots.len());
    }

    let versions = &info["versions"]["core"];
    println!("\n── Versions ────────────────────────");
    println!("  Unraid: {}", str_val_or(&versions["unraid"], "?"));
    println!("  Kernel: {}", str_val_or(&versions["kernel"], "?"));
}

fn fmt_shares(data: &Value) {
    let shares = match data["shares"].as_array() {
        Some(s) => s,
        None => {
            println!("No shares found.");
            return;
        }
    };
    println!(
        "{:<24} {:>10}  {:>10}  {:>10}  {}",
        "NAME", "TOTAL", "USED", "FREE", "CACHE"
    );
    for s in shares {
        println!(
            "{:<24} {:>10}  {:>10}  {:>10}  {}",
            str_val_or(&s["name"], "?"),
            bigint_opt(&s["size"])
                .map(|v| fmt_kb(v as i64))
                .unwrap_or_else(|| "--".into()),
            bigint_opt(&s["used"])
                .map(|v| fmt_kb(v as i64))
                .unwrap_or_else(|| "--".into()),
            bigint_opt(&s["free"])
                .map(|v| fmt_kb(v as i64))
                .unwrap_or_else(|| "--".into()),
            if s["cache"].as_bool() == Some(true) {
                "yes"
            } else {
                "no"
            },
        );
    }
}

fn fmt_notifications(data: &Value) {
    let notifs = &data["notifications"];
    let unread = &notifs["overview"]["unread"];
    println!(
        "Unread: {} total  |  {} alerts  {} warnings  {} info",
        unread["total"].as_i64().unwrap_or(0),
        unread["alert"].as_i64().unwrap_or(0),
        unread["warning"].as_i64().unwrap_or(0),
        unread["info"].as_i64().unwrap_or(0),
    );
    if let Some(active) = notifs["warningsAndAlerts"].as_array() {
        if active.is_empty() {
            println!("No active warnings or alerts.");
        } else {
            println!();
            for n in active {
                println!(
                    "[{}] {}: {}  {}",
                    str_val(&n["importance"]),
                    str_val(&n["title"]),
                    str_val(&n["subject"]),
                    str_val_or(&n["timestamp"], ""),
                );
            }
        }
    }
}

fn fmt_log_files(data: &Value) {
    let files = match data["logFiles"].as_array() {
        Some(f) => f,
        None => {
            println!("No log files found.");
            return;
        }
    };
    println!("{:<40} {:>10}  {}", "PATH", "SIZE", "MODIFIED");
    for f in files {
        println!(
            "{:<40} {:>10}  {}",
            str_val(&f["path"]),
            fmt_bytes(f["size"].as_f64().unwrap_or(0.0)),
            str_val_or(&f["modifiedAt"], "--"),
        );
    }
}

fn fmt_log_file(data: &Value) {
    let lf = &data["logFile"];
    let total = lf["totalLines"].as_i64().unwrap_or(0);
    let path = str_val(&lf["path"]);
    println!("── {path} ({total} lines total) ──");
    if let Some(content) = lf["content"].as_str() {
        print!("{content}");
    }
}

fn fmt_services(data: &Value) {
    let services = match data["services"].as_array() {
        Some(s) => s,
        None => {
            println!("No services found.");
            return;
        }
    };
    println!("{:<24} {:<8} {}", "NAME", "ONLINE", "VERSION");
    for s in services {
        println!(
            "{:<24} {:<8} {}",
            str_val_or(&s["name"], "?"),
            if s["online"].as_bool() == Some(true) {
                "yes"
            } else {
                "no"
            },
            str_val_or(&s["version"], "--"),
        );
    }
}

fn fmt_network(data: &Value) {
    let urls = match data["network"]["accessUrls"].as_array() {
        Some(u) => u,
        None => {
            println!("No network access URLs found.");
            return;
        }
    };
    println!("{:<16} {:<24} {:<40} {}", "TYPE", "NAME", "IPv4", "IPv6");
    for u in urls {
        println!(
            "{:<16} {:<24} {:<40} {}",
            str_val(&u["type"]),
            str_val_or(&u["name"], "--"),
            str_val_or(&u["ipv4"], "--"),
            str_val_or(&u["ipv6"], "--"),
        );
    }
}

fn fmt_ups(data: &Value) {
    let devices = match data["upsDevices"].as_array() {
        Some(d) => d,
        None => {
            println!("No UPS devices found.");
            return;
        }
    };
    if devices.is_empty() {
        // Field present but no devices — distinct from the missing-field case above,
        // but the user-facing message is the same. Without this, output is silent.
        println!("No UPS devices found.");
        return;
    }
    for d in devices {
        println!("── {} ({}) ──", str_val(&d["name"]), str_val(&d["model"]));
        println!("  Status:   {}", str_val(&d["status"]));
        let bat = &d["battery"];
        println!(
            "  Battery:  {}%  ~{}m remaining  health={}",
            bat["chargeLevel"].as_i64().unwrap_or(0),
            bat["estimatedRuntime"].as_i64().unwrap_or(0) / 60,
            str_val(&bat["health"]),
        );
        let pwr = &d["power"];
        println!(
            "  Power:    {:.1}V in  {:.1}V out  {:.1}% load",
            pwr["inputVoltage"].as_f64().unwrap_or(0.0),
            pwr["outputVoltage"].as_f64().unwrap_or(0.0),
            pwr["loadPercentage"].as_f64().unwrap_or(0.0),
        );
    }
}

fn fmt_ups_config(data: &Value) {
    let c = &data["upsConfiguration"];
    println!("Service:    {}", str_val_or(&c["service"], "--"));
    println!("Type:       {}", str_val_or(&c["upsType"], "--"));
    println!("Cable:      {}", str_val_or(&c["upsCable"], "--"));
    println!("Device:     {}", str_val_or(&c["device"], "--"));
    println!("Name:       {}", str_val_or(&c["upsName"], "--"));
    if let Some(lvl) = c["batteryLevel"].as_i64() {
        println!("Shutdown:   battery <= {lvl}%");
    }
    if let Some(min) = c["minutes"].as_i64() {
        println!("Shutdown:   runtime <= {min}m");
    }
    println!("Kill UPS:   {}", str_val_or(&c["killUps"], "--"));
    println!("Net server: {}", str_val_or(&c["netServer"], "--"));
}

fn fmt_metrics(data: &Value) {
    let m = &data["metrics"];

    if let Some(cpu) = m["cpu"].as_object() {
        let pct = cpu
            .get("percentTotal")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        println!("CPU: {pct:.1}% total");
        if let Some(cores) = cpu.get("cpus").and_then(|v| v.as_array()) {
            let core_str: Vec<String> = cores
                .iter()
                .map(|c| format!("{:.0}%", c["percentTotal"].as_f64().unwrap_or(0.0)))
                .collect();
            println!("  Cores: {}", core_str.join("  "));
        }
    }

    if let Some(mem) = m["memory"].as_object() {
        let total = bigint_f64(mem.get("total").unwrap_or(&Value::Null));
        let available = bigint_f64(mem.get("available").unwrap_or(&Value::Null));
        let used = total - available;
        let pct = mem
            .get("percentTotal")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        println!("Memory: {} / {} ({pct:.1}%)", fmt_gib(used), fmt_gib(total));
        let swap_used = bigint_f64(mem.get("swapUsed").unwrap_or(&Value::Null));
        let swap_total = bigint_f64(mem.get("swapTotal").unwrap_or(&Value::Null));
        if swap_total > 0.0 {
            println!("  Swap: {} / {}", fmt_gib(swap_used), fmt_gib(swap_total));
        }
    }

    if let Some(sensors) = m["temperature"]["sensors"].as_array() {
        let temp_sensors: Vec<&Value> = sensors
            .iter()
            .filter(|s| {
                matches!(
                    s["type"].as_str().unwrap_or(""),
                    "CPU_PACKAGE" | "CPU_CORE" | "NVME" | "DISK"
                )
            })
            .collect();

        if !temp_sensors.is_empty() {
            println!("Temperature:");
            let warn = m["temperature"]["summary"]["warningCount"]
                .as_i64()
                .unwrap_or(0);
            let crit = m["temperature"]["summary"]["criticalCount"]
                .as_i64()
                .unwrap_or(0);
            if warn > 0 || crit > 0 {
                println!("  !! {warn} warning  {crit} critical");
            }
            for s in temp_sensors {
                let val = s["current"]["value"].as_f64().unwrap_or(0.0);
                let unit = temp_unit_symbol(s["current"]["unit"].as_str().unwrap_or("CELSIUS"));
                let name = str_val(&s["name"]);
                let loc = str_val_or(&s["location"], "");
                let label = if loc.is_empty() {
                    name
                } else {
                    format!("{name} ({loc})")
                };
                println!("  {label:<36} {val:.1}°{unit}");
            }
        }
    }
}

fn fmt_plugins(data: &Value) {
    let plugins = match data["plugins"].as_array() {
        Some(p) => p,
        None => {
            println!("No plugins found.");
            return;
        }
    };
    println!("{:<40} {}", "NAME", "VERSION");
    for p in plugins {
        println!("{:<40} {}", str_val(&p["name"]), str_val(&p["version"]));
    }
    println!("\n{} plugin(s)", plugins.len());
}

fn fmt_parity_history(data: &Value) {
    let checks = match data["parityHistory"].as_array() {
        Some(c) => c,
        None => {
            println!("No parity history.");
            return;
        }
    };
    if checks.is_empty() {
        println!("No parity checks recorded.");
        return;
    }
    println!(
        "{:<24} {:<12} {:<8} {:>7}  {}",
        "DATE", "STATUS", "ERRORS", "SPEED", "DURATION"
    );
    for c in checks {
        let dur_s = c["duration"].as_i64().unwrap_or(0);
        let dur = if dur_s > 3600 {
            format!("{}h{}m", dur_s / 3600, (dur_s % 3600) / 60)
        } else {
            format!("{}m", dur_s / 60)
        };
        println!(
            "{:<24} {:<12} {:<8} {:>7}  {}",
            str_val_or(&c["date"], "--"),
            str_val(&c["status"]),
            c["errors"].as_i64().unwrap_or(0),
            str_val_or(&c["speed"], "--"),
            dur,
        );
    }
}

fn fmt_vars(data: &Value) {
    let v = &data["vars"];
    println!("Hostname:    {}", str_val_or(&v["name"], "?"));
    println!("Unraid:      {}", str_val_or(&v["version"], "?"));
    println!("Model:       {}", str_val_or(&v["sysModel"], "--"));
    println!("Timezone:    {}", str_val_or(&v["timeZone"], "--"));
    println!("Devices:     {}", v["deviceCount"].as_i64().unwrap_or(0));
    println!(
        "Config:      {}",
        if v["configValid"].as_bool() == Some(true) {
            "valid"
        } else {
            "INVALID"
        }
    );
    println!("Reg state:   {}", str_val_or(&v["regState"], "--"));
    println!("Reg owner:   {}", str_val_or(&v["regTo"], "--"));
    println!();
    println!(
        "SMB:  {}  NFS: {}  AFP: {}",
        yn(v["shareSmbEnabled"].as_bool()),
        yn(v["shareNfsEnabled"].as_bool()),
        yn(v["shareAfpEnabled"].as_bool()),
    );
    println!(
        "SSL:  {}  SSH: {}  Telnet: {}",
        yn(v["useSsl"].as_bool()),
        yn(v["useSsh"].as_bool()),
        yn(v["useTelnet"].as_bool()),
    );
}

fn fmt_registration(data: &Value) {
    let r = &data["registration"];
    if r.is_null() {
        println!("No registration data.");
        return;
    }
    println!("Type:    {}", str_val_or(&r["type"], "--"));
    println!("State:   {}", str_val_or(&r["state"], "--"));
    println!("Expires: {}", str_val_or(&r["expiration"], "--"));
    println!("Update:  {}", str_val_or(&r["updateExpiration"], "--"));
}

fn fmt_flash(data: &Value) {
    let f = &data["flash"];
    println!("GUID:    {}", str_val(&f["guid"]));
    println!("Vendor:  {}", str_val(&f["vendor"]));
    println!("Product: {}", str_val(&f["product"]));
}

fn fmt_rclone(data: &Value) {
    let remotes = data["rclone"]["remotes"]
        .as_array()
        .map(Vec::as_slice)
        .unwrap_or(&[]);
    if remotes.is_empty() {
        println!("No rclone remotes configured.");
        return;
    }
    println!("{:<32} {}", "REMOTE", "TYPE");
    for r in remotes {
        println!("{:<32} {}", str_val(&r["name"]), str_val(&r["type"]));
    }
}

fn fmt_remote_access(data: &Value) {
    let r = &data["remoteAccess"];
    println!("Access type: {}", str_val(&r["accessType"]));
    println!("Forward:     {}", str_val_or(&r["forwardType"], "--"));
    if let Some(port) = r["port"].as_i64() {
        println!("Port:        {port}");
    }
}

fn fmt_connect(data: &Value) {
    let c = &data["connect"];
    let dra = &c["dynamicRemoteAccess"];
    println!("Dynamic remote access:");
    println!("  Enabled: {}", str_val(&dra["enabledType"]));
    println!("  Running: {}", str_val(&dra["runningType"]));
    if let Some(err) = dra["error"].as_str() {
        if !err.is_empty() {
            println!("  Error:   {err}");
        }
    }
    let settings = &c["settings"]["values"];
    println!("Settings:");
    println!("  Access: {}", str_val(&settings["accessType"]));
    println!("  Forward: {}", str_val_or(&settings["forwardType"], "--"));
    if let Some(port) = settings["port"].as_i64() {
        println!("  Port: {port}");
    }
}

// ── format helpers ────────────────────────────────────────────────────────────

fn str_val(v: &Value) -> String {
    v.as_str().unwrap_or("?").to_string()
}

fn str_val_or<'a>(v: &'a Value, fallback: &'a str) -> &'a str {
    v.as_str().unwrap_or(fallback)
}

pub fn fmt_kb(kb: i64) -> String {
    let gb = kb as f64 / (1024.0 * 1024.0);
    if gb >= 1000.0 {
        format!("{:.1} TB", gb / 1024.0)
    } else if gb >= 1.0 {
        format!("{:.1} GB", gb)
    } else {
        format!("{kb} KB")
    }
}

pub fn fmt_bytes(bytes: f64) -> String {
    if bytes >= 1e12 {
        format!("{:.1} TB", bytes / 1e12)
    } else if bytes >= 1e9 {
        format!("{:.1} GB", bytes / 1e9)
    } else if bytes >= 1e6 {
        format!("{:.1} MB", bytes / 1e6)
    } else {
        format!("{:.0} B", bytes)
    }
}

/// Binary GiB display for memory (matches what `free` and system tools show).
fn fmt_gib(bytes: f64) -> String {
    let gib = bytes / (1024.0_f64).powi(3);
    if gib >= 1024.0 {
        format!("{:.1} TiB", gib / 1024.0)
    } else {
        format!("{:.1} GiB", gib)
    }
}

fn kb_to_tb(v: &Value) -> f64 {
    bigint_f64(v) / (1024.0 * 1024.0 * 1024.0)
}

fn yn(v: Option<bool>) -> &'static str {
    if v == Some(true) {
        "yes"
    } else {
        "no"
    }
}

/// Parse a GraphQL BigInt value that may arrive as a JSON number or a string.
fn bigint_f64(v: &Value) -> f64 {
    v.as_f64()
        .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
        .unwrap_or(0.0)
}

/// Like [`bigint_f64`] but returns `None` for a null/absent/unparseable value,
/// so callers can render `--` for a genuinely-missing field (e.g. `fsUsed` on a
/// parity disk) instead of a misleading `0`. BigInt fields arrive as JSON
/// strings, so a plain `as_i64`/`as_f64` would wrongly treat them as missing.
fn bigint_opt(v: &Value) -> Option<f64> {
    if v.is_null() {
        return None;
    }
    v.as_f64()
        .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
}

/// Map GraphQL TemperatureUnit enum to a display symbol.
fn temp_unit_symbol(unit: &str) -> &'static str {
    match unit {
        "FAHRENHEIT" => "F",
        "KELVIN" => "K",
        _ => "C",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // Regression: Unraid types ArrayDisk/Share/MemoryLayout size fields as
    // BigInt, which arrive as JSON *strings*. The formatters must parse those,
    // not silently render 0 (the bug fixed alongside the offline mock).
    #[test]
    fn bigint_helpers_accept_string_and_number() {
        assert_eq!(bigint_f64(&json!("7810000000")), 7_810_000_000.0);
        assert_eq!(bigint_f64(&json!(7810000000_i64)), 7_810_000_000.0);
        assert_eq!(bigint_f64(&json!(null)), 0.0);

        assert_eq!(bigint_opt(&json!("5710000000")), Some(5_710_000_000.0));
        assert_eq!(bigint_opt(&json!(42_i64)), Some(42.0));
        // A genuinely-missing field stays None so the CLI can render "--".
        assert_eq!(bigint_opt(&json!(null)), None);
        assert_eq!(bigint_opt(&Value::Null), None);
    }

    #[test]
    fn fmt_kb_renders_bigint_string_size_not_zero() {
        // 7_810_000_000 KB ≈ 7.3 TB — the value that previously rendered "0 KB".
        let size = bigint_f64(&json!("7810000000")) as i64;
        assert_eq!(fmt_kb(size), "7.3 TB");
    }

    /// Every action's healthy fixture must render through `print_human` without
    /// panicking (index-out-of-bounds, bad unwraps, wrong-shape access). New
    /// actions fall through to the JSON default; this guards the bespoke ones.
    #[test]
    fn print_human_handles_every_fixture() {
        const HEALTHY: &str = include_str!("../../tests/fixtures/scenarios/healthy.json");
        let fixtures: serde_json::Map<String, Value> =
            serde_json::from_str(HEALTHY).expect("healthy fixture is valid JSON");
        for (action, payload) in &fixtures {
            if action.starts_with('_') {
                continue;
            }
            // Must not panic for any action's real-shaped payload.
            print_human(action, payload);
        }
    }
}
