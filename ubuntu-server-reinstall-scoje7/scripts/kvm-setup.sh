#!/usr/bin/env bash
# kvm-setup.sh — QEMU/KVM + libvirt on camodevops (Ubuntu 26.04).
# Calico-safe: the libvirt default NAT network (virbr0/dnsmasq) is left
# INACTIVE by default so it cannot clash with MicroK8s/Calico pod networking.
# Enable it only when you actually need NAT'd VM internet (see docs/kvm.md).
set -euo pipefail

USER="${KVM_USER:-camo}"

echo "== QEMU/KVM + libvirt setup =="

echo "== 1/4 install packages (Ubuntu 26.04 names) =="
if command -v virsh >/dev/null && command -v qemu-system-x86_64 >/dev/null; then
  echo "qemu/libvirt already installed — skipping apt"
else
  sudo apt-get update -qq
  DEBIAN_FRONTEND=noninteractive sudo apt-get install -y -qq \
    qemu-system-x86 libvirt-daemon-system libvirt-clients virtinst bridge-utils
fi

echo "== 2/4 start libvirtd =="
sudo systemctl enable --now libvirtd 2>/dev/null || sudo systemctl enable --now virtqemud

echo "== 3/4 add $USER to libvirt + kvm groups =="
sudo usermod -aG libvirt,kvm "$USER"
echo "NOTE: $USER must log out/in (or 'newgrp libvirt') for group to apply without sudo."

echo "== 4/4 Calico-safe default network =="
# Leave the NAT network disabled so virbr0/dnsmasq never touches Calico subnets.
if virsh net-info default >/dev/null 2>&1; then
  virsh net-destroy default >/dev/null 2>&1 || true
  virsh net-autostart --disable default >/dev/null 2>&1 || true
  echo "default libvirt NAT network: disabled (Calico-safe)."
fi

echo "== verify =="
ls -l /dev/kvm
virsh version 2>&1 | head -2
echo "== DONE. Use: virsh list --all  (or virt-manager over SSH X-forwarding) =="
