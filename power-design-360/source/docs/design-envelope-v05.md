# Multi-condition design and catalog selection v0.5

## Approved intent
The user approved continuing automatically from the requirements-driven HWLLC design brief. Keep the four-step UI. Component values remain outputs. Extend the existing synthesis pipeline, not a new app: evaluate additional output ratings, load/bus cases, known mechanical space and heat-removal limits; select an actual output-capacitor bank from a small verified catalog.

## Model and scope
- Main rating is the maximum output voltage and power budget. Up to six additional output ratings must not exceed either; their current may exceed the main rating if their power remains inside the budget. A PD preset adds 5/9/15/20/28/36 V ratings only below the main voltage, with 3 A below 20 V and up to 5 A otherwise, limited by the declared power. These are editable requested ratings, not USB certification.
- Fixed hardware and fixed ideal LS resonant pulse width are evaluated at nominal, maximum and hold-endpoint bus, at 10/25/50/75/100% load. Public HFB balance gives D=N*Vo/Vbus, fs=(1-D)/Ton, deltaIm=N*Vo*Ton/Lp, Imavg=Io/N. Ipos/neg=Imavg +/- deltaIm/2. This is an explicit continuous-pulse stress scenario, not RRW11011 mode behavior. Positive end current is marked as outside the assumed negative-current envelope; never as ZVS proof. No-load/burst/startup/transitions are listed as uncovered.
- Candidate winding areas, flux, resonant-capacitor currents and output-capacitor requirements must cover every evaluated case. Frequency/duty violations reject that candidate inside this model, with counted reasons. Additional output rows with positive end current remain marked as requiring a different control mode; do not invent its waveforms or declare full coverage.
- PFC line-envelope rows use low/high line and the same per-phase critical-mode formula already sourced in v0.4. The minimum line-crest frequency is analytical; full line-cycle maximum frequency is not bounded by this model near zero crossings.
- Mechanical data use TDK's assembly dimensions, not magnetic-material volume: ETD34 horizontal 43x40x35 mm; ETD39 48x45x38; ETD44 53x50x41 (selector guide 3/23 p.16). Compare each component's upright height and rotated footprint against usable component space. Total magnetic footprint exceeding PCB area is a necessary rejection, not a layout guarantee. Output capacitor dimensions include tolerances. Unmodeled bulk caps, isolation gaps, heatsinks and routing prevent an overall layout-pass claim.
- Optional coolingBudgetW means a provided heat-removal budget. Compare total target-derived loss against it and report the required minimum efficiency. Never predict real efficiency or temperatures from the target.
- Catalog selection uses Panasonic ZU (2025-09-01 pp.1–2), verified numeric data and official URLs. Enumerate identical parallel parts, maximum 24. Require negative capacitance tolerance, voltage derating, ESR policy margin, ripple margin/frequency factors, and known part envelope to fit. ESR published at 20 C / 100 kHz is shown with its conditions; a software factor is not vendor hot/cold proof. Endurance 4000 h at rated temperature is not application lifetime. Unknown stock/prices are not ranked or invented.
- Existing v2 project files remain readable through defaults. Requirements, envelope and selected-bank summaries travel with exports. Source JSON and downloads contain public data only.

## Acceptance
Independent current/charge identities; old-requirement import; all-case worst-value sizing; low-voltage mode limitation; geometry and cooling blockers; capacitor parallel count and frequency correction; no-catalog outcome; editable output rows and preserved wizard state; 30 existing tests; TypeScript, both builds, browser generation/apply/export, fresh final review and publish to existing Site/GitHub path.

## Sources
- Infineon HFB guide V1.0 2021-03-01 pp.6–8,12: https://www.infineon.com/assets/row/public/documents/24/42/infineon-design-guide-hybrid-flyback-converter-design-xdps2201-applicationnotes-en.pdf
- TDK selector 3/23 p.16: https://www.tdk-electronics.tdk.com/download/531570/3cb8062a488c6f9dda068ae6ba31a953/pdf-selectorguide.pdf
- Panasonic ZU 2025-09-01: https://industrial.panasonic.com/cdbs/www-data/pdf/RDD0000/ast-ind-156944.pdf

## Ledger
- Baseline ba8f144c717358b79de7aa4d8260cbf68727f529. Site opened/synced, public audience preserved.
- User instruction to continue automatically supplies authorization for implementation and existing Site/GitHub publication; no renewed approval gate.
- Task 1: requirements, envelope, catalog and portable summaries implemented. New behavior tests were observed failing before implementation; independent current/charge integration and all 39 tests pass. Optional cooling summary path regression reproduced and fixed. TypeScript check passes.
- Task 2: new controls and results implemented. Browser verified invalid extra-output recovery, seven-output preset, 5 W cooling rejection, 32 mm height rejection, generation with 40 mm height / 15 W cooling, 105-case output, 5 V / 100% filtering, mode warnings, selected real capacitor bank, and project creation with saved summary after reload.
- Export verification: browser event capture timed out, but actual synchronized files were found and parsed. CSV: 105 data rows, 16 columns, seven voltages, 39 mode-limited rows. JSON: projectSchema passes, six extra ratings and known physical boundaries retained, 13,197-character summary with selected EEHZU1J151P × 21 bank. Tool event issue did not prevent downloads.

- Final review: one Important finding fixed. PD preset no longer inherits the main-current ceiling; 48 V / 2 A now yields 5 V / 3 A and 20 V / 4.8 A. Regression observed RED then GREEN; all 40 tests and TypeScript pass. Browser confirms hardware sizing follows the corrected ratings. No Critical or deferred Minor findings.
