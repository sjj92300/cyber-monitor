import type { MitreTechnique, Severity } from "./types";

/**
 * Detection templates for the simulated event stream.
 * MITRE ATT&CK technique IDs/names are real (https://attack.mitre.org);
 * everything else (hosts, users, IPs) is fictional demo data.
 */
export interface DetectionTemplate {
  type: string;
  title: string;
  weight: number; // relative frequency
  severities: [Severity, number][]; // weighted severity choices
  technique: MitreTechnique;
  sensor: string;
  ports: number[];
  needsUser: boolean;
  describe: (ctx: { ip: string; host: string; user: string | null; port: number; n: number }) => string;
  log: (ctx: { ip: string; host: string; user: string | null; port: number; n: number; ts: string }) => string;
}

export const DETECTIONS: DetectionTemplate[] = [
  {
    type: "failed_login",
    title: "Failed login",
    weight: 22,
    severities: [["low", 8], ["medium", 2]],
    technique: { id: "T1110.001", name: "Brute Force: Password Guessing", tactic: "Credential Access" },
    sensor: "Windows Security Log",
    ports: [445, 3389, 22],
    needsUser: true,
    describe: ({ user, ip, host }) => `Authentication failure for ${user} on ${host} from ${ip}.`,
    log: ({ ts, host, user, ip }) =>
      `${ts} ${host} Microsoft-Windows-Security-Auditing EventID=4625 LogonType=3 TargetUserName=${user} IpAddress=${ip} Status=0xC000006D SubStatus=0xC000006A`,
  },
  {
    type: "brute_force",
    title: "Brute-force attempt",
    weight: 8,
    severities: [["high", 6], ["medium", 3], ["critical", 1]],
    technique: { id: "T1110", name: "Brute Force", tactic: "Credential Access" },
    sensor: "SIEM correlation rule",
    ports: [22, 3389, 443],
    needsUser: true,
    describe: ({ n, user, ip, host, port }) =>
      `${n} failed authentications for ${user} on ${host}:${port} from ${ip} within 5 minutes.`,
    log: ({ ts, host, user, ip, n, port }) =>
      `${ts} siem rule="AUTH-BRUTE-01" src=${ip} dst=${host} dport=${port} user=${user} failures=${n} window=300s`,
  },
  {
    type: "password_spray",
    title: "Password spraying detected",
    weight: 3,
    severities: [["high", 7], ["critical", 2]],
    technique: { id: "T1110.003", name: "Brute Force: Password Spraying", tactic: "Credential Access" },
    sensor: "Identity provider logs",
    ports: [443],
    needsUser: false,
    describe: ({ n, ip }) => `${ip} attempted sign-in against ${n} distinct accounts with a small set of passwords.`,
    log: ({ ts, ip, n }) => `${ts} idp event=signin.failure.burst src=${ip} distinct_users=${n} result=FAILURE reason=invalid_credentials`,
  },
  {
    type: "port_scan",
    title: "Port scan",
    weight: 14,
    severities: [["low", 5], ["medium", 4]],
    technique: { id: "T1046", name: "Network Service Discovery", tactic: "Discovery" },
    sensor: "Suricata IDS",
    ports: [0],
    needsUser: false,
    describe: ({ ip, host, n }) => `${ip} probed ${n} TCP ports on ${host} (SYN scan pattern).`,
    log: ({ ts, ip, host, n }) =>
      `${ts} suricata[2201]: [1:2010937:3] ET SCAN Suspicious inbound to multiple ports {TCP} ${ip} -> ${host} ports_probed=${n}`,
  },
  {
    type: "malware_detected",
    title: "Malware detected",
    weight: 6,
    severities: [["high", 5], ["critical", 3], ["medium", 2]],
    technique: { id: "T1204.002", name: "User Execution: Malicious File", tactic: "Execution" },
    sensor: "EDR",
    ports: [0],
    needsUser: true,
    describe: ({ host, user }) => `EDR quarantined a malicious executable launched by ${user} on ${host}.`,
    log: ({ ts, host, user }) =>
      `${ts} edr host=${host} user=${user} action=quarantine file="C:\\Users\\${user}\\Downloads\\invoice_2026.exe" verdict=malicious engine=ml-static`,
  },
  {
    type: "phishing",
    title: "Phishing email delivered",
    weight: 6,
    severities: [["medium", 6], ["high", 3]],
    technique: { id: "T1566.001", name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
    sensor: "Email gateway",
    ports: [25],
    needsUser: true,
    describe: ({ user }) => `Message with a macro-enabled attachment reached ${user}'s inbox before retro-scan flagged it.`,
    log: ({ ts, user }) =>
      `${ts} mailgw action=retro_flag rcpt=${user}@corp.example attachment="PO_88213.docm" verdict=phish`,
  },
  {
    type: "suspicious_powershell",
    title: "Encoded PowerShell execution",
    weight: 4,
    severities: [["high", 6], ["critical", 2]],
    technique: { id: "T1059.001", name: "Command and Scripting Interpreter: PowerShell", tactic: "Execution" },
    sensor: "Sysmon",
    ports: [0],
    needsUser: true,
    describe: ({ host, user }) => `powershell.exe started with -EncodedCommand by ${user} on ${host}.`,
    log: ({ ts, host, user }) =>
      `${ts} ${host} Sysmon EventID=1 Image=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe CommandLine="powershell -nop -w hidden -enc <redacted>" User=CORP\\${user}`,
  },
  {
    type: "c2_beacon",
    title: "Possible C2 beaconing",
    weight: 3,
    severities: [["critical", 4], ["high", 5]],
    technique: { id: "T1071.001", name: "Application Layer Protocol: Web Protocols", tactic: "Command and Control" },
    sensor: "Zeek NSM",
    ports: [443, 8080],
    needsUser: false,
    describe: ({ host, ip, n }) => `${host} contacted ${ip} every ~60s (${n} connections, low jitter).`,
    log: ({ ts, host, ip, port, n }) =>
      `${ts} zeek conn.log orig_h=${host} resp_h=${ip} resp_p=${port} proto=tcp count=${n} interval_stddev=1.8s`,
  },
  {
    type: "dns_tunneling",
    title: "DNS tunneling suspected",
    weight: 2,
    severities: [["high", 6], ["medium", 3]],
    technique: { id: "T1071.004", name: "Application Layer Protocol: DNS", tactic: "Command and Control" },
    sensor: "DNS resolver logs",
    ports: [53],
    needsUser: false,
    describe: ({ host, n }) => `${host} issued ${n} high-entropy TXT queries to a single domain.`,
    log: ({ ts, host, n }) => `${ts} dns client=${host} qtype=TXT qname=<long-random>.example-tunnel.test count=${n}`,
  },
  {
    type: "web_exploit",
    title: "Web exploit attempt",
    weight: 7,
    severities: [["medium", 5], ["high", 4], ["critical", 1]],
    technique: { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
    sensor: "WAF",
    ports: [443, 80],
    needsUser: false,
    describe: ({ ip, host }) => `WAF blocked a path-traversal / injection payload from ${ip} against ${host}.`,
    log: ({ ts, ip, host }) =>
      `${ts} waf action=BLOCK rule=942100 src=${ip} host=${host} uri="/api/v1/export?file=../../etc/passwd" ua="python-requests/2.31"`,
  },
  {
    type: "impossible_travel",
    title: "Impossible travel sign-in",
    weight: 2,
    severities: [["high", 7], ["medium", 3]],
    technique: { id: "T1078", name: "Valid Accounts", tactic: "Initial Access" },
    sensor: "Identity provider logs",
    ports: [443],
    needsUser: true,
    describe: ({ user, ip }) => `${user} signed in from ${ip} 40 minutes after a sign-in ~6,000 km away.`,
    log: ({ ts, user, ip }) => `${ts} idp event=signin.success user=${user}@corp.example src=${ip} risk=impossible_travel`,
  },
  {
    type: "credential_dumping",
    title: "LSASS memory access",
    weight: 1,
    severities: [["critical", 8], ["high", 2]],
    technique: { id: "T1003.001", name: "OS Credential Dumping: LSASS Memory", tactic: "Credential Access" },
    sensor: "EDR",
    ports: [0],
    needsUser: true,
    describe: ({ host }) => `Unsigned process opened a handle to lsass.exe on ${host}.`,
    log: ({ ts, host, user }) =>
      `${ts} ${host} Sysmon EventID=10 SourceImage=C:\\ProgramData\\svc.exe TargetImage=C:\\Windows\\System32\\lsass.exe GrantedAccess=0x1010 User=CORP\\${user}`,
  },
  {
    type: "rdp_lateral",
    title: "Unusual RDP lateral movement",
    weight: 2,
    severities: [["high", 6], ["medium", 4]],
    technique: { id: "T1021.001", name: "Remote Services: Remote Desktop Protocol", tactic: "Lateral Movement" },
    sensor: "Windows Security Log",
    ports: [3389],
    needsUser: true,
    describe: ({ user, host }) => `${user} opened RDP sessions to ${host} for the first time in 90 days.`,
    log: ({ ts, host, user }) => `${ts} ${host} EventID=4624 LogonType=10 TargetUserName=${user} first_seen_pair=true`,
  },
  {
    type: "data_exfil",
    title: "Large outbound transfer",
    weight: 1,
    severities: [["critical", 5], ["high", 5]],
    technique: { id: "T1048", name: "Exfiltration Over Alternative Protocol", tactic: "Exfiltration" },
    sensor: "Firewall / NetFlow",
    ports: [21, 22, 443],
    needsUser: false,
    describe: ({ host, ip, n }) => `${host} sent ${n * 37} MB to ${ip}, 25x its 30-day baseline.`,
    log: ({ ts, host, ip, port, n }) => `${ts} fw action=allow src=${host} dst=${ip} dport=${port} bytes_out=${n * 37 * 1_048_576}`,
  },
  {
    type: "scheduled_task",
    title: "Suspicious scheduled task created",
    weight: 2,
    severities: [["medium", 6], ["high", 3]],
    technique: { id: "T1053.005", name: "Scheduled Task/Job: Scheduled Task", tactic: "Persistence" },
    sensor: "Windows Security Log",
    ports: [0],
    needsUser: true,
    describe: ({ host, user }) => `${user} registered a task on ${host} that runs a script from %TEMP% at logon.`,
    log: ({ ts, host, user }) => `${ts} ${host} EventID=4698 TaskName=\\UpdaterCheck SubjectUserName=${user} Action="%TEMP%\\u.ps1"`,
  },
];

/** Fictional internal assets and accounts. */
export const HOSTS = [
  "web-prod-01", "web-prod-02", "vpn-gw-01", "dc-01", "dc-02", "mail-01",
  "fs-finance-01", "ws-hr-114", "ws-eng-207", "ws-ops-031", "db-prod-01", "jump-01",
];
export const USERS = [
  "j.miller", "a.nguyen", "svc_backup", "r.patel", "administrator", "k.oconnor",
  "t.washington", "m.garcia", "helpdesk01", "l.chen",
];

/**
 * Simulated attacker IPs come only from RFC 5737 documentation ranges
 * (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), so no real host is ever
 * accused. Country labels are simulated geo-attribution for the demo.
 */
export const ATTACKERS: { ip: string; country: string; weight: number }[] = [
  { ip: "203.0.113.45", country: "RU", weight: 9 },
  { ip: "203.0.113.77", country: "CN", weight: 8 },
  { ip: "198.51.100.23", country: "KP", weight: 3 },
  { ip: "198.51.100.140", country: "IR", weight: 4 },
  { ip: "192.0.2.10", country: "BR", weight: 5 },
  { ip: "192.0.2.188", country: "US", weight: 4 },
  { ip: "203.0.113.201", country: "NL", weight: 5 },
  { ip: "198.51.100.66", country: "VN", weight: 4 },
  { ip: "192.0.2.99", country: "DE", weight: 2 },
  { ip: "203.0.113.9", country: "IN", weight: 3 },
  { ip: "198.51.100.212", country: "RO", weight: 3 },
  { ip: "192.0.2.250", country: "UA", weight: 2 },
];
