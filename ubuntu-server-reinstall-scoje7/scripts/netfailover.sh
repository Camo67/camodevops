#!/usr/bin/env bash
# netfailover.sh — keep camodevops online by preferring wired -> home WiFi -> phone hotspot.
# CALICO-SAFE: only manages the host's own egress (enp2s0 / wlp1s0). Never touches
# vxlan.calico, never enables a firewall, never does NAT/DHCP. Cluster pod networking
# is untouched.
#
# How it decides:
#   1. If wired enp2s0 has a carrier + can ping gateway -> do nothing (best path).
#   2. Else if WiFi is on VC-2508-59 and gateway reachable -> do nothing.
#   3. Else if WiFi on Redmi Note 13 Pro and internet reachable -> do nothing.
#   4. Else try to roam: prefer VC-2508-59, fall back to Redmi Note 13 Pro.
set -uo pipefail

WIFI_IF="${WIFI_IF:-wlp1s0}"
WIRED_IF="${WIRED_IF:-enp2s0}"
GATEWAY="${GATEWAY:-192.168.18.1}"
HOME_SSID="${HOME_SSID:-VC-2508-59}"
HOTSPOT_SSID="${HOTSPOT_SSID:-Redmi Note 13 Pro}"
LOG="${NETFAIL_LOG:-/home/camo/camodevops/logs/netfailover.log}"

log() { echo "$(date '+%F %T') $*" | tee -a "$LOG"; }

wifi_ssid() { sudo wpa_cli -i "$WIFI_IF" status 2>/dev/null | awk -F= '/^ssid=/{print $2}'; }
wifi_up()   { ip link show "$WIFI_IF" 2>/dev/null | grep -q 'state UP'; }
wired_up()  { ip link show "$WIRED_IF" 2>/dev/null | grep -q 'state UP' && ip -4 addr show "$WIRED_IF" 2>/dev/null | grep -q 'inet '; }
reachable() { timeout 3 bash -c "echo > /dev/tcp/$1/53" 2>/dev/null; }

connect_ssid() {
  local ssid="$1"
  log "roaming WiFi -> $ssid"
  sudo wpa_cli -i "$WIFI_IF" select_network "$(sudo wpa_cli -i "$WIFI_IF" list_networks 2>/dev/null | awk -F'\t' -v s="$ssid" '$2==s{print $1}')" >/dev/null 2>&1
  sleep 6
}

# 1. Wired is king
if wired_up && reachable "$GATEWAY"; then
  log "OK wired ($WIRED_IF) -> gateway reachable; nothing to do"
  exit 0
fi

# 2/3. WiFi already good?
cur="$(wifi_ssid)"
if wifi_up; then
  if [ "$cur" = "$HOME_SSID" ] && reachable "$GATEWAY"; then
    log "OK WiFi=$HOME_SSID -> gateway reachable"; exit 0
  fi
  if [ "$cur" = "$HOTSPOT_SSID" ] && reachable "1.1.1.1"; then
    log "OK WiFi=$HOTSPOT_SSID -> internet reachable"; exit 0
  fi
fi

# 4. Need to roam. Prefer home, fall back to hotspot.
log "connectivity lost on '$cur' (wired=$(wired_up)); attempting roam"
connect_ssid "$HOME_SSID"
if wifi_ssid | grep -q "$HOME_SSID" && reachable "$GATEWAY"; then
  log "recovered on $HOME_SSID"; exit 0
fi
connect_ssid "$HOTSPOT_SSID"
if wifi_ssid | grep -q "$HOTSPOT_SSID" && reachable "1.1.1.1"; then
  log "recovered on $HOTSPOT_SSID"; exit 0
fi
log "WARN: could not establish connectivity on any interface"
exit 1
