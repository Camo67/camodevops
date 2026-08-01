# MicroK8s Cluster — camodevops

MicroK8s runs on `camodevops` as the control-plane node. Additional nodes join via `microk8s add-node`.

---

## Cluster nodes

| Node | IP | Type | Status |
|---|---|---|---|
| `camodevops` | 192.168.18.187 (wired) | control-plane | Ready |
| `camoflo` | 192.168.18.8 | worker (mobile device) | Ready |

`camodevops` also has a WiFi NIC at `.190` — the **node-ip must be pinned to the wired `.187`** so kubelet always advertises a stable address. See the node-ip section below.

---

## Node-IP and networking design

### The conflict
MicroK8s requires each node to have a stable IP (`--node-ip`). WiFi addresses change when roaming between networks. Pinning a dynamic WiFi address breaks the cluster on network hops.

### Solution: router DHCP reservation
Reserve `192.168.18.187` for the **wired MAC** of `camodevops` in your router's DHCP settings. This gives you the stability of a static IP without touching netplan or MicroK8s config.

```
Router DHCP → Static leases → add wired MAC → 192.168.18.187
```

Then pin MicroK8s to the wired NIC:

```bash
# on camodevops
echo "--node-ip=192.168.18.187" | sudo tee -a /var/snap/microk8s/current/args/kubelet
sudo microk8s stop && sudo microk8s start
```

### WiFi roaming
WiFi (`.190`) is for LAN access / SSH from other machines. **Do not auto-join unknown open hotspots** — a k8s node on an untrusted network exposes the API server and etcd. Add only known SSIDs to netplan (`/etc/netplan/50-cloud-init.yaml`):

```yaml
wifis:
  wlan0:
    access-points:
      "VC-2508-59": {}        # home router
      "YourMobileHotspot": {} # phone hotspot
    dhcp4: true
```

---

## Enable addons

```bash
sudo microk8s enable dns storage ingress
# Calico CNI (for node networking — required before workers join):
sudo microk8s enable community
sudo microk8s enable calico
```

Check addon status:

```bash
sudo microk8s status --wait-ready
```

---

## Adding a worker node

On the control-plane (`camodevops`):

```bash
sudo microk8s add-node
# prints a join command + token
```

On the new worker (e.g. `camoflo`):

```bash
# install MicroK8s on the worker first, then:
sudo microk8s join 192.168.18.187:25000/<token>
```

After joining, Calico initialises a `calico-node` pod on the new node. It usually goes Ready within 2–3 minutes:

```bash
sudo microk8s kubectl get nodes -o wide
sudo microk8s kubectl get pods -n kube-system
```

---

## Cluster health checks

```bash
# All nodes
sudo microk8s kubectl get nodes -o wide

# All system pods
sudo microk8s kubectl get pods -A

# Event log for a specific node
sudo microk8s kubectl describe node camoflo | tail -30
```

---

## Network partitioning

If `camodevops` is on a different network (e.g. a mobile hotspot at `10.11.229.x`) the cluster is **partitioned** — nodes on `192.168.18.x` cannot reach the control-plane. Symptoms: all worker nodes go NotReady, API server unreachable from other LAN machines.

Fix: reconnect camodevops to the home LAN (`VC-2508-59`):

```bash
sudo nmcli connection up "VC-2508-59"
# verify
hostname -I   # should include 192.168.18.187
sudo microk8s kubectl get nodes
```

The hotspot connection is fine for internet/SSH from outside, but always keep the wired or home-WiFi link up for cluster traffic.

---

## Mobile node (`camoflo`) notes

- `camoflo` at `192.168.18.8` is a mobile device running MicroK8s
- It joined as node 4 and became Ready after Calico initialised (~2 min)
- Its IP is also DHCP — consider a **static DHCP reservation for .8** on the router so its node address is stable
- If the mobile switches networks (hotspot, different WiFi), it will temporarily lose connectivity to the control-plane; the node will go NotReady and recover when it reconnects

---

## Removing a node

```bash
# drain first so pods reschedule
sudo microk8s kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
# then remove
sudo microk8s kubectl delete node <node>
# on the removed node:
sudo microk8s leave
```
