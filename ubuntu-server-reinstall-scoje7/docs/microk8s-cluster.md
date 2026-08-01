# MicroK8s Cluster — camodevops

A 4-node MicroK8s cluster. CNI is **Calico** (do not enable UFW / default-deny
firewall on any node — it breaks pod networking).

## Nodes (verified)
| Node | IP | OS | Status |
|------|-----|-----|--------|
| camodevops | 192.168.18.187 (WiFi) / .190 (wired) | Ubuntu 26.04 | Ready |
| bertha | 192.168.18.174 | Ubuntu 24.04 | Ready |
| cam-hp-prodesk-600-g3-mt | 192.168.18.195 | Ubuntu 26.04 | NotReady* |
| camoflo (mobile) | 192.168.18.8 | Ubuntu 26.04 | Ready |

\* HP ProDesk shows NotReady when the box is asleep/offline — not a config fault.

## Non-root kubectl for `camo`
```bash
sudo usermod -a -G microk8s camo
sudo chown -R camo ~/.kube
newgrp microk8s   # or log out/in
```
After this, `microk8s kubectl get nodes` works without sudo.

## Node-IP pinning (important for roaming WiFi)
Each node advertises its LAN IP to the cluster via kubelet arg
`/var/snap/microk8s/current/args/kubelet`:
```bash
echo '--node-ip=192.168.18.187' | sudo tee -a /var/snap/microk8s/current/args/kubelet
sudo snap restart microk8s
```
- camodevops → `.187` (WiFi, since the cable gets unplugged)
- bertha → `.174`
- If a node's IP changes, re-pin or set a static DHCP reservation in the router.

## Join a new node (e.g. mobile `camoflo`)
On the **master** (camodevops):
```bash
microk8s add-node
```
It prints a `microk8s join <ip>:<port>/<token>` command. Run that on the new box.
Calico's `calico-node` pod initializes on the new node within ~1 min → node goes Ready.

## Health check
```bash
microk8s kubectl get nodes -o wide
microk8s kubectl get pods -A | grep calico
```
