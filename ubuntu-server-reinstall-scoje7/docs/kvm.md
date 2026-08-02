# KVM / Libvirt on camodevops

QEMU/KVM virtualization host, set up Calico-safe (won't break the MicroK8s cluster).

## Install
```bash
bash ubuntu-server-reinstall-scoje7/scripts/kvm-setup.sh
```
Packages (Ubuntu 26.04 names — `qemu-kvm` was renamed):
`qemu-system-x86`, `libvirt-daemon-system`, `libvirt-clients`, `virtinst`, `bridge-utils`.

## Verify
```bash
ls -l /dev/kvm            # crw-rw---- kvm
virsh version             # libvirt + hypervisor present
virsh domcapabilities     # confirms hardware-accel (kvm) available
```

## Groups
`camo` is added to `libvirt` + `kvm`. Apply without sudo by logging out/in or:
```bash
newgrp libvirt
```
Until then, prefix virsh with `sudo`.

## ⚠️ Calico safety
The libvirt **default NAT network** (`virbr0` + dnsmasq, `192.168.122.0/24`) is
left **disabled** by default. Reason: camodevops is a MicroK8s/Calico node; an
extra dnsmasq/NAT bridge can interfere with pod networking.

### To enable VM internet (only if needed)
```bash
virsh net-start default
virsh net-autostart default
```
Then set the VM's NIC to `network=default`. Avoid this while the cluster is
handling production traffic.

## Usage
- CLI: `virsh`, `virt-install`
- GUI: `virt-manager` (run on a workstation, SSH X-forward, or point it at
  `qemu+ssh://camo@192.168.18.187/system`)
- Snippets:
  ```bash
  virt-install --name test --memory 2048 --vcpus 2 \
    --cdrom ~/iso/ubuntu.iso --disk size=20 --network none
  ```
