# SSH Hub — enrolling other machines into camodevops

`camodevops` acts as an SSH hub on the `192.168.18.0/24` LAN. All machines SSH **into** camodevops using key-only auth; no passwords.

---

## Server state (confirmed post-reinstall)

- `sshd` listening on `:22` (IPv4 + IPv6)
- `~/.ssh/authorized_keys` contains the 7 ED25519 keys imported from `gh:camo67` during installation
- Password authentication disabled (Ubuntu cloud-init default with `50-cloud-init.conf`)
- No sudo required to add keys — `authorized_keys` is owned by `camo`

---

## Adding a new machine (two-step flow)

### Step 1 — on the client machine

If the machine doesn't have an SSH keypair yet, generate one:

```bash
ssh-keygen -t ed25519 -C "$(hostname)-$(date +%Y%m%d)" -f ~/.ssh/id_ed25519
# passphrase optional but recommended
cat ~/.ssh/id_ed25519.pub
```

Copy the output — this is what gets enrolled on the server.

### Step 2 — on camodevops

Paste the client's public key and append it (safe to run multiple times — deduplicates):

```bash
KEY="ssh-ed25519 AAAA... user@hostname"

# append only if not already present
grep -qxF "$KEY" ~/.ssh/authorized_keys || echo "$KEY" >> ~/.ssh/authorized_keys
```

Verify:

```bash
grep "hostname" ~/.ssh/authorized_keys
```

### Test from the client

```bash
ssh camo@192.168.18.187          # wired
# or
ssh camo@192.168.18.190          # WiFi
```

---

## Bulk enrollment via `ssh-copy-id`

If you can SSH in once (e.g. from bertha which is already enrolled):

```bash
# from bertha — copy bertha's key to camodevops
ssh-copy-id camo@192.168.18.187
```

---

## Current known machines

| IP | Host | Status |
|---|---|---|
| 192.168.18.8 | `camoflo` (mobile) | MicroK8s worker — enroll if SSH access needed |
| 192.168.18.174 | `bertha` | Keys enrolled (GitHub import) |
| 192.168.18.178 | unknown | To identify + enroll |
| 192.168.18.187 | `camodevops` | **Server** |
| 192.168.18.195 | `cam-HP-ProDesk-600-G3-MT` | To enroll |

---

## SSH config shortcut (on each client)

Add to `~/.ssh/config` on each client machine so you can type `ssh camo` instead of the full IP:

```
Host camo
    HostName 192.168.18.187
    User camo
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

---

## Revoking a key

Find the key line (grep by comment/hostname) and delete it:

```bash
grep -n "hostname-to-remove" ~/.ssh/authorized_keys
# then:
sed -i '/hostname-to-remove/d' ~/.ssh/authorized_keys
```
