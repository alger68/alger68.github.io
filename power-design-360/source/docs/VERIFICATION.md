# Verification — v0.4.0

2026-09-23: TypeScript validation passed. All 30 automated tests passed, including requirements-only synthesis/API, invalid PD power, output-capacitor charge independently integrated from a half-sine waveform, hold-endpoint current/ESR ratings, automatic efficiency-budget rounding, project provenance and existing v0.1–v0.3 coverage.

Browser preview verified the four-step requirements → boundaries → candidates → component-specification flow through the real synthesis API. The default 48 V / 5 A example produced three candidates. Applying the 160 kHz candidate created a project, ran the calculation API, and preserved its source requirements and component summary after a full page reload. Text-report and JSON export buttons were exercised; their downloaded bytes were not independently inspected in this pass. Desktop component-table screenshot inspected. Responsive CSS is implemented; an actual mobile device has not been tested.

Regression checks reproduced then resolved: leaving an invalid boundary field no longer disables navigation from the valid requirements step; edited requirements and generated candidates survive navigation to reference resources and back. Unapplied drafts remain in this page session only. Created projects use the existing browser storage and portable export flow.

Fresh-context review identified four Important issues (no Critical): hold-endpoint component ratings, hidden-step validation, wizard unmount/reset, and efficiency floating-point rounding. Each was fixed and verified. Public source and exports use public Infineon, TI and TDK references; uploaded confidential controller documents are not included. The synthesis model remains a design seed, not controller behavioral validation, measured efficiency, proven ZVS, production magnetics drawings or a selected production BOM.

## Earlier v0.1.0 verification

Automated coverage: independent 480 W numeric reference, power conservation, FHA unity at resonance, capacitance/temperature/frequency boundaries, invalid and nonfinite input, API JSON/type/size handling, CORS, stale review evidence, large saved workspace round-trip, optimistic cross-tab storage conflict, report HTML escaping.

Browser preview verified: initial server calculation, creation of a new project, evidence entry, evidence becoming stale after editing bulk capacitance, 330 µF versus 470 µF comparison (15.52 ms versus 22.11 ms), JSON download contents, and reimport into a new project. Desktop screenshot inspected. Responsive CSS is implemented; an actual mobile device has not been tested.

Optional WebMCP tools are feature-detected. The available browser reports modelContext unavailable, so tool registration/execution could not be tested in that browser. Ordinary UI and API do not depend on WebMCP.

Fresh independent review identified asymmetric storage size limits and cross-tab overwrite risk. Both have been addressed with shared storage parsing and optimistic write checks, plus regression tests. Engineering calculations are analytical estimates, not hardware validation.
