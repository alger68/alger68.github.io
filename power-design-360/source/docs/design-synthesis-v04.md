# Requirements-driven design v0.4

User correction: inductance, turns, capacitance, and other component values must be outputs. The main flow accepts electrical requirements and operating boundaries, offers automatic candidates, and transfers a selected candidate to the existing detailed validation workspace.

Model scope: first-order, asymmetric half-bridge / half-wave resonant design seed. Generic HFB equations are not a verified RRW11011 behavioral model. Controller register settings, dynamic mode transitions, actual leakage, nonlinear Coss, loss and thermal verification remain pending. Never label calculated budgets as measured efficiency or ZVS proof.

Public primary sources:
- Infineon XDPS2201 design guide V1.0 (2021-03-01), pp. 7–8 and 18–23, voltage-second/current balance, initial magnetizing current, Lp/Lr and resonant timing: https://www.infineon.com/assets/row/public/documents/24/42/infineon-design-guide-hybrid-flyback-converter-design-xdps2201-applicationnotes-en.pdf
- TI UCC28063 Rev.C (2024-07), pp. 15–16 and 29, two-phase transition-mode inductor sizing: https://www.ti.com/lit/ds/symlink/ucc28063.pdf
- TDK ETD34, ETD39 and ETD44 core/bobbin data (2022-10), pp. 2 and 4: https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_34_17_11.pdf ; https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_39_20_13.pdf ; https://www.tdk-electronics.tdk.com/inf/80/db/fer/etd_44_22_15.pdf

Plan:
1. Backend synthesis from requirements. Enumerate frequency, catalog cores and integer turns. Gate on flux, winding fill, nominal/hold bus duty, ideal SR stress and 300 kHz envelope. Size PFC L, bulk C, Lp/Lm/Lr, split C, output bank, conductor area, AL and equivalent gap. Return 3+ distinct candidates when feasible and reasons when none are feasible.
2. Step-by-step UI: requirements → boundaries → generated candidates → apply/export. Internal choices are automatic and documented. Existing numeric spec editor becomes an advanced view. New sessions start in the wizard.
3. Project provenance: requirements + selected candidate summary + exact generated spec fingerprint. Manual changes mark the seed summary as superseded. Private controller documents are never included in public repository/builds.
4. Verify numerical integration, invalid combinations, API, imports, browser generation/apply/export, full suite and builds. Fresh-context review before publication.

Review focus: no invented losses or vendor guarantees; winding current sign/charge balance; loaded Lp vs Lm distinction; capacitor derating/ESR; stale results after edits; cancel/race behavior; hidden required engineer inputs; confidentiality; UI handles no-candidate outcomes without a fake best answer.

Ledger:
- Existing user-authorized Sites checkout; baseline 87bf75c4f936803adcebc911fa5ea66eb6d40262.
- Scope updated on user correction. Earlier v0.3 LC diagnostic remains useful only in advanced validation.
- Public model uses independently retrieved public primary sources; confidential controller-specific sizing stays out of the deployment.
- Automatic choices are design heuristics, with all assumptions shown; ranking is not a claim of global optimum.

- Numerical suite: 30/30 passed after the fix pass, including independent half-sine capacitor integration and generated project provenance.
- Final review: fresh-context reviewer found four Important issues; no Critical issues. Hold-endpoint ratings/fill and efficiency rounding reproduced as failing tests, then fixed. Wizard boundary-step trap and navigation reset reproduced in browser; fixed step-scoped validation and preserved mounted state. Browser GREEN verified both regressions, API generation, candidate application, and saved component records after reload. Dashboard provenance safely handles invalid advanced edits.
- Planned release documentation covers reviewer minor observations: current version and source URLs in exported seed summaries.
