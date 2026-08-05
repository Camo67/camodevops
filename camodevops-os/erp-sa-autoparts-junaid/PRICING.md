# SA Auto Parts (Junaid) — ERP Build: Pricing & 12-Month Valuation

> CamOdevOps architecture · ERPNext + Nginx + local Qwen/Gemma · on-premise (Tailscale)
> Status: **TEMPLATE** — all monetary figures are `[FILL: ...]` placeholders.
> Replace each with the agreed number, then the totals compute automatically.

## 1. Upfront / Core Build Value (one-time)
| Line | Description | Amount (ZAR) |
|------|-------------|--------------|
| Initial setup / onboarding fee | ERPNext instance, domain, TLS, Tailscale mesh | `[FILL: setup_fee]` |
| Milestone 1 — Core ERP (items, stock, PO) | | `[FILL: m1]` |
| Milestone 2 — Sales/CRM + invoicing | | `[FILL: m2]` |
| Milestone 3 — Local AI (Qwen/Gemma) assist + reporting | | `[FILL: m3]` |
| Data migration (legacy → ERPNext) | | `[FILL: migration]` |
| Training (Junaid + staff) | | `[FILL: training]` |
| **Total Upfront (TU)** | sum of above | **`[FILL: total_upfront]`** |

## 2. Recurring Value
| Line | Description | Amount (ZAR) |
|------|-------------|--------------|
| Monthly subscription / hosting+maintenance | | `[FILL: monthly]` |
| Annual support retainer (if separate) | | `[FILL: annual_support]` |
| **Recurring 12mo (TR)** | `monthly × 12 + annual_support` | **`[FILL: recurring_12mo]`** |

## 3. Hardware / Asset Add-ons
| Line | Description | Amount (ZAR) |
|------|-------------|--------------|
| On-prem server / NUC + storage | | `[FILL: server_hw]` |
| Barcode scanners / inventory terminals | | `[FILL: scanners]` |
| Network gear (switch, Tailscale gateway) | | `[FILL: network]` |
| Audio / earpiece / comms system (warehouse floor) | | `[FILL: audio]` |
| **Total Hardware (TH)** | | **`[FILL: total_hw]`** |

## 4. Total Project Valuation (12 months)
```
Total 12-Month Valuation (TV) = Total Upfront (TU)
                                + Recurring 12mo (TR)
                                + Total Hardware (TH)
TV = [FILL: total_upfront] + [FILL: recurring_12mo] + [FILL: total_hw]
```
> Drop the numbers in and this becomes the contract figure.

## 5. Default assumptions (edit if agreed)
- Currency: ZAR.
- Hosting model: on-premise at Junaid's site via Tailscale (client data stays on-premise).
- AI: local Qwen/Gemma on the on-prem box — no per-token cloud cost.
- Payment schedule: `[FILL: payment_schedule]` (e.g. 40% upfront, 30% M2, 30% M3).

## 6. Open questions for Junaid
- [ ] Exact parts count / SKU volume (drives migration effort)?
- [ ] Multi-branch or single site?
- [ ] Required integrations (bank, courier, accounting)?
- [ ] SLA / uptime expectation?
