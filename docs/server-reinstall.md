# Ubuntu Server Reinstall — camoflo box

Runbook for a clean Ubuntu Server reinstall on the `camoflo` machine (192.168.18.8). Covers the full installer flow, post-install hardening, and bringing the Docker stack back up.

---

## Network topology

| Hostname | IP | Role |
|---|---|---|
| `camoflo` | 192.168.18.8 | Primary server — runs Docker stack (this box) |
| `cam-HP-ProDesk-600-G3-MT` | 192.168.18.195 | Desktop workstation |
| `bertha` | 192.168.18.174 | Dev workstation — agentic harness source lives here |

---

## 1. Ubuntu Server installer

Download the latest Ubuntu Server LTS ISO (24.04) and boot from USB.

### Language / keyboard
Accept defaults unless you need a specific locale.

### Network
The installer detects the NIC. Let it configure via DHCP — the LAN DHCP server should hand `192.168.18.8` to this MAC. If not, set a static address here or via Netplan after install.

### Storage
Use the entire disk with LVM (default). Enable LVM so you can grow volumes later.

### User account
- Username: `camo67`
- Hostname: `camoflo`

### SSH setup — import from GitHub
During the **"SSH Setup"** screen:
1. Enable `Install OpenSSH server`.
2. Choose **Import SSH identity → from GitHub**.
3. Enter your GitHub username: `camo67`.
4. The installer fetches your ED25519 public keys — confirm **Yes** at the fingerprint prompt.

This is exactly what the installer screenshot shows:

```
256 SHA256:191eTkFKNiT/... camo67@github/133257986 (ED25519)
256 SHA256:14pg11jdJH+... camo67@github/133600131 (ED25519)
...
[ Yes ]
```

### Snap packages
Skip optional snaps — Docker is installed via the official apt repository in the setup script, not as a snap.

### Finish
Let the installer complete and remove the USB when prompted. The system reboots into a minimal Ubuntu Server.

---

## 2. Verify boot

SSH from another machine on the LAN:

```bash
ssh camo67@192.168.18.8
hostname -I
# expected: 192.168.18.8 100.x.x.x 10.0.3.1 ...
```

The `10.0.3.1` address indicates LXD is present from the default Ubuntu Server install. That's fine — Docker runs alongside it.

---

## 3. Run the setup script

```bash
# Clone the repo first (HTTPS — no key needed for public read)
git clone https://github.com/Camo67/camodevops.git ~/camodevops

# Make executable and run
chmod +x ~/camodevops/server-setup.sh
~/camodevops/server-setup.sh
```

The script handles:
- `apt` update / upgrade
- Docker Engine (official apt source — not snap)
- UFW firewall (22, 80, 443 open; 8080/8081/11434 LAN-only)
- fail2ban
- Unattended security updates
- `.env` file scaffold
- SSL directory creation

---

## 4. Configure secrets

```bash
nano ~/camodevops/.env
```

Fill in every blank value. The critical ones for the stack to start:

| Variable | Notes |
|---|---|
| `HARNESS_DIR` | Absolute path to agentic-harness source on *this* machine (default: `~/agentic-harness`) |
| `WHATSAPP_ACCESS_TOKEN` | Meta permanent token |
| `TELEGRAM_BOT_TOKEN` | From BotFather |
| `OPENROUTER_API_KEY` | Primary LLM routing |

---

## 5. Bring the agentic harness onto this machine

The harness source previously lived at `/home/bertha/agentic-harness`. On a fresh camoflo install, clone it locally:

```bash
git clone <harness-repo-url> ~/agentic-harness
```

Then set `HARNESS_DIR=~/agentic-harness` (or the absolute path) in `.env`. The `docker-compose.yml` reads this variable, so the build context is no longer tied to the bertha hostname.

---

## 6. SSL certificates

**Option A — Let's Encrypt (recommended)**

```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d camo.devops.online
sudo cp /etc/letsencrypt/live/camo.devops.online/fullchain.pem ~/camodevops/ssl/
sudo cp /etc/letsencrypt/live/camo.devops.online/privkey.pem   ~/camodevops/ssl/
sudo chown camo67:camo67 ~/camodevops/ssl/*.pem
```

Set up auto-renewal:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Option B — manual**

Place your certificates at:

```
~/camodevops/ssl/fullchain.pem
~/camodevops/ssl/privkey.pem
```

---

## 7. Build and start the Docker stack

```bash
cd ~/camodevops

# New docker group membership requires a new shell
newgrp docker

# Build all images
./deploy.sh build

# Start all containers
./deploy.sh up

# Verify
./deploy.sh status
curl http://localhost:8080/health
```

---

## 8. Post-start checks

```bash
# All four containers running?
docker ps

# Logs clean?
./deploy.sh logs

# Firewall active?
sudo ufw status numbered

# fail2ban watching SSH?
sudo fail2ban-client status sshd
```

---

## 9. Re-register webhooks

After the server is live at its public IP/domain:

**Telegram**
```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://camo.devops.online/telegram/webhook"
```

**WhatsApp** — update the webhook URL in the Meta Developer Console to `https://camo.devops.online/webhook`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied` running docker | Run `newgrp docker` or log out/in |
| Harness container fails to build | Check `HARNESS_DIR` in `.env` points to the cloned harness |
| Nginx 502 | Web container not ready yet — wait a few seconds and retry |
| SSL cert missing | Run the certbot command in step 6, then `./deploy.sh restart` |
| LXD conflict on port 80 | `sudo lxd init --auto` then disable LXD's network bridge if not needed |
