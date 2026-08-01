# SSH Hub Guide — camodevops

camodevops acts as an **SSH hub**: other PCs (and your mobile `camoflo`) log in with
key-only auth, no passwords.

## Current state (verified)
- `sshd` listening on `:22` (IPv4 + IPv6)
- **Password auth disabled** via `/etc/ssh/sshd_config.d/99-no-password.conf`
  (`PasswordAuthentication no`, `PubkeyAuthentication yes`)
- Enrolled keys live in `~/.ssh/authorized_keys` (8 keys: 7 GitHub `gh:camo67` + `bertha`)
- Tools in `~/ssh-tools/`: `make-ssh-client`, `add-ssh-key`, `harden-ssh`

## Enroll a new client PC
On the **client** machine:
```bash
~/ssh-tools/make-ssh-client "pc-name"   # prints ONLY the public key
```
Send that public-key line to the hub operator (here, in Telegram).

On the **hub** (camodevops):
```bash
~/ssh-tools/add-ssh-key '<paste pubkey line>'
# or pipe:  cat client.pub | ~/ssh-tools/add-ssh-key
```
`add-ssh-key` validates, de-dupes, and fixes perms — no sudo needed.

## Connect
```bash
ssh camo@192.168.18.187      # WiFi IP (cluster node-ip pinned here)
# or ssh camo@192.168.18.190  # wired IP (when cable is connected)
```

## To re-lock key-only after a rebuild
```bash
sudo bash ~/ssh-tools/harden-ssh
```
It validates config with `sshd -t` BEFORE restarting (cannot brick SSH).

## ⚠️ Calico / k8s node warning
camodevops is a **MicroK8s/Calico node** (`vxlan.calico`, `cali*` interfaces).
**Do NOT enable UFW with a default-deny** here — it breaks pod networking.
Samba is restricted to the LAN via `hosts allow`, not a host firewall.
