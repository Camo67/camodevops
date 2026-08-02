#!/usr/bin/env bash
# kvm-setup.sh — install and configure KVM hypervisor on camodevops
# Run as camo67 (sudo access required). Safe to re-run.

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[FAIL]${NC} $*" >&2; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        camodevops — KVM Hypervisor Setup     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. CPU virtualisation check ───────────────────────────────────────────────
info "Checking CPU virtualisation support..."
VIRT_COUNT=$(grep -cE '(vmx|svm)' /proc/cpuinfo || true)
if [ "$VIRT_COUNT" -eq 0 ]; then
    die "CPU does not report vmx/svm flags — KVM requires hardware virtualisation. Check BIOS VT-x/AMD-V setting."
fi
CPU_TYPE=$(grep -oE '(vmx|svm)' /proc/cpuinfo | head -1)
success "CPU virtualisation: $CPU_TYPE ($VIRT_COUNT logical cores)"

# Also verify kvm kernel module loads
if ! lsmod | grep -q kvm; then
    info "Loading kvm kernel module..."
    sudo modprobe kvm
    sudo modprobe "kvm_$([ "$CPU_TYPE" = "vmx" ] && echo intel || echo amd)"
fi
success "kvm kernel module loaded"

# ── 2. Install packages ───────────────────────────────────────────────────────
info "Installing KVM packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils \
    virtinst \
    libguestfs-tools \
    genisoimage \
    ovmf
success "KVM packages installed"

# ── 3. User group membership ──────────────────────────────────────────────────
info "Adding $USER to libvirt and kvm groups..."
sudo usermod -aG libvirt "$USER"
sudo usermod -aG kvm     "$USER"
success "Groups updated — take effect on next login or run: newgrp libvirt"

# ── 4. Enable and start libvirtd ──────────────────────────────────────────────
info "Enabling libvirtd..."
sudo systemctl enable libvirtd
sudo systemctl start  libvirtd
success "libvirtd running"

# ── 5. UFW — allow libvirt NAT bridge traffic ─────────────────────────────────
info "Configuring UFW for libvirt NAT bridge (virbr0)..."
# libvirt's default NAT network uses virbr0 (192.168.122.0/24)
# dnsmasq runs on virbr0 for VM DHCP — UFW must not block it
sudo ufw allow in  on virbr0 comment 'KVM libvirt NAT bridge'
sudo ufw allow out on virbr0 comment 'KVM libvirt NAT bridge'
success "UFW updated for virbr0"

# ── 6. Storage pool — use /var/lib/libvirt/images (default) ──────────────────
info "Verifying default storage pool..."
if ! sudo virsh pool-info default &>/dev/null; then
    sudo virsh pool-define-as default dir --target /var/lib/libvirt/images
    sudo virsh pool-autostart default
    sudo virsh pool-start default
fi
success "Storage pool 'default' ready at /var/lib/libvirt/images"

# ── 7. ISO directory ──────────────────────────────────────────────────────────
ISO_DIR="$HOME/isos"
mkdir -p "$ISO_DIR"
success "ISO directory: $ISO_DIR"

# ── 8. Verify ─────────────────────────────────────────────────────────────────
echo ""
info "Verification:"
sudo virsh version
echo ""
sudo virsh list --all
echo ""
sudo virsh net-list --all

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              KVM Setup complete              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Create a VM (example — Ubuntu 24.04):"
echo "    virt-install \\"
echo "      --name ubuntu-test \\"
echo "      --ram 2048 \\"
echo "      --vcpus 2 \\"
echo "      --disk path=/var/lib/libvirt/images/ubuntu-test.qcow2,size=20 \\"
echo "      --os-variant ubuntu24.04 \\"
echo "      --network network=default \\"
echo "      --graphics none \\"
echo "      --console pty,target_type=serial \\"
echo "      --extra-args 'console=ttyS0,115200n8 --- console=ttyS0,115200n8' \\"
echo "      --cdrom \$HOME/isos/ubuntu-24.04-server.iso"
echo ""
echo "  Manage VMs:"
echo "    virsh list --all          # list VMs"
echo "    virsh start <name>        # start"
echo "    virsh shutdown <name>     # graceful stop"
echo "    virsh console <name>      # serial console"
echo "    virsh destroy <name>      # force stop"
echo ""
echo "  See docs/kvm.md for full reference."
echo ""
success "Done. Log out and back in for group membership to take effect."
