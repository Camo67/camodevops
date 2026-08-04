# Task Board

## TODO
- [ ] Decide "get orbit" meaning (Netdata Orbit monitoring? something else?)
- [ ] Choose terabyte `CamOdevOps` folder target (camodevops vs `cam` /mnt/sda2)
- [ ] Run setup scripts live on camodevops (devtools + samba)
- [ ] Add AI team members to `members.md`
- [ ] **Mr Devious**: confirm handle/GitHub; run first full security pass (see team/security.md — items ⛔/⏳)
- [ ] **Mr Devious**: verify Redis not bound to 0.0.0.0; schedule vuln scan + fail2ban eval
- [ ] **Hermes**: add API-bus auth before any external exposure of :8000

## IN PROGRESS
- [ ] Establish repo as AI team comms channel (this scaffold) — seeding

## DONE
- [x] SSH hub, key-only, 8 keys
- [x] MicroK8s non-root for camo
- [x] camoflo (mobile) joined cluster (4 nodes)
- [x] Barrier bertha↔camodevops
- [x] Folder tree (CamOdevOps/business/*, clients, shared, projects)
- [x] 5 setup scripts + failover watchdog committed + pushed (claude-setup)
- [x] STATUS.md + team/ comms scaffold
