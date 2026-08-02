# KVM Hypervisor — camodevops

KVM (Kernel-based Virtual Machine) lets camodevops run full VMs alongside its Docker stack and MicroK8s cluster.

---

## Quick start

```bash
# on camodevops
chmod +x ~/camodevops/scripts/kvm-setup.sh
~/camodevops/scripts/kvm-setup.sh

# re-login so group membership takes effect, then:
virsh list --all
```

---

## How it fits with Docker and MicroK8s

| Layer | Tool | Network |
|---|---|---|
| VMs | KVM / libvirt | NAT via `virbr0` (192.168.122.0/24) |
| Containers | Docker Engine | Docker bridge (`docker0`, 172.17.x) |
| Pod networking | MicroK8s + Calico | Overlay (10.x) on wired NIC |

Each lives in a separate address space — no conflicts.

- libvirt's default NAT network (`virbr0`) gives VMs internet access through the host; VMs are **not** directly visible on the 192.168.18.x LAN.
- See [Bridge networking](#bridge-networking-optional) if you want VMs to get LAN IPs.

---

## Create a VM

### Text-mode (no GUI — best for headless server)

```bash
virt-install \
  --name ubuntu-vm \
  --ram 2048 \
  --vcpus 2 \
  --disk path=/var/lib/libvirt/images/ubuntu-vm.qcow2,size=20 \
  --os-variant ubuntu24.04 \
  --network network=default \
  --graphics none \
  --console pty,target_type=serial \
  --extra-args 'console=ttyS0,115200n8 --- console=ttyS0,115200n8' \
  --cdrom $HOME/isos/ubuntu-24.04-server.iso
```

Escape the console with `Ctrl+]`.

### Minimal cloud-image (no ISO)

Faster than ISO install — uses Ubuntu cloud images directly:

```bash
# download cloud image
wget -P ~/isos https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img

# resize to desired disk size
qemu-img create -f qcow2 -b ~/isos/noble-server-cloudimg-amd64.img \
    -F qcow2 /var/lib/libvirt/images/myvm.qcow2 20G

# cloud-init seed ISO (sets hostname, user, SSH key)
cat > /tmp/user-data.yaml <<'YAML'
#cloud-config
hostname: myvm
users:
  - name: camo67
    ssh_authorized_keys:
      - <paste your public key>
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
YAML

genisoimage -output /tmp/seed.iso -volid cidata -joliet -rock \
    /tmp/user-data.yaml <(echo "instance-id: myvm-01\nlocal-hostname: myvm")

virt-install \
  --name myvm \
  --ram 2048 \
  --vcpus 2 \
  --disk path=/var/lib/libvirt/images/myvm.qcow2 \
  --disk path=/tmp/seed.iso,device=cdrom \
  --os-variant ubuntu24.04 \
  --network network=default \
  --graphics none \
  --import \
  --noautoconsole
```

---

## Day-to-day commands

```bash
virsh list --all            # all VMs (running + stopped)
virsh start <name>          # start
virsh shutdown <name>       # graceful stop (ACPI)
virsh destroy <name>        # force-off (like pulling the power)
virsh reboot <name>
virsh suspend <name>        # pause (memory preserved)
virsh resume <name>

virsh console <name>        # attach serial console (Ctrl+] to exit)
virsh dominfo <name>        # RAM / vCPU / state
virsh domifaddr <name>      # VM's IP address(es)

# Snapshots
virsh snapshot-create-as <name> snap1 --disk-only --atomic
virsh snapshot-list <name>
virsh snapshot-revert <name> snap1

# Disks
virsh domblklist <name>     # show disk paths
qemu-img info /var/lib/libvirt/images/<name>.qcow2
```

---

## Networking

### Default NAT (virbr0)

Enabled by `kvm-setup.sh`. VMs get IPs in `192.168.122.0/24` via dnsmasq on the host. They can reach the internet and the host; the host can reach them; LAN machines cannot reach VMs directly.

```bash
virsh net-list --all
virsh net-info default
virsh net-dhcp-leases default   # see which VM got which IP
```

SSH into a VM from camodevops:
```bash
virsh domifaddr myvm            # get VM IP, e.g. 192.168.122.42
ssh camo67@192.168.122.42
```

### Bridge networking (optional)

Gives VMs IPs on `192.168.18.x` — visible to the whole LAN. **Do not use the wired NIC that MicroK8s pins (`.187`) for the bridge** — use a separate interface or accept that kubelet's wired address will live on the bridge.

```bash
# create bridge br0 tied to the wired NIC (e.g. enp3s0)
sudo nmcli connection add type bridge ifname br0 con-name br0
sudo nmcli connection add type ethernet ifname enp3s0 master br0 con-name br0-slave
sudo nmcli connection up br0

# create a libvirt bridge network
cat > /tmp/bridge-net.xml <<XML
<network>
  <name>bridge</name>
  <forward mode="bridge"/>
  <bridge name="br0"/>
</network>
XML
sudo virsh net-define /tmp/bridge-net.xml
sudo virsh net-autostart bridge
sudo virsh net-start bridge

# use --network network=bridge in virt-install
```

---

## Storage pools

Default pool: `/var/lib/libvirt/images/`

```bash
virsh pool-list --all
virsh pool-info default
virsh vol-list default          # disk images in the pool
```

Add a second pool (e.g. a larger disk):
```bash
sudo virsh pool-define-as data dir --target /mnt/data/vms
sudo virsh pool-autostart data
sudo virsh pool-start data
```

---

## System resource guidance

camodevops has limited physical RAM. Suggested per-VM allocation:

| VM type | RAM | vCPUs |
|---|---|---|
| Lightweight test | 512 MB | 1 |
| Standard server | 2 GB | 2 |
| Heavy workload | 4 GB | 4 |

Check host memory before provisioning:
```bash
free -h
virsh nodeinfo
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied` accessing `/dev/kvm` | Run `newgrp kvm` or log out/in |
| `virsh: command not found` | Log out and back in so group membership applies |
| VM console hangs after boot | Add `console=ttyS0,115200n8` to kernel args |
| VM has no network | Verify `virsh net-start default` and `ufw allow in on virbr0` |
| `error: failed to connect socket to '/var/run/libvirt/libvirt-sock'` | `sudo systemctl start libvirtd` |
| KVM + MicroK8s cluster partitioned | KVM itself doesn't affect k8s network — check wired NIC still has `.187` |
