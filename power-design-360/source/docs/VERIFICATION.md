# Verification — v0.5.0

2026-09-23: TypeScript validation and all 40 automated tests passed. Added independent waveform integration, legacy requirement defaults, low-voltage/high-current sizing and mode limitations, geometry/cooling rejection, actual capacitor-bank capacity/ESR/frequency-adjusted ripple, no-catalog-match handling, and maximum 105-case project round-trip.

Browser preview verified the seven-output preset, repair of a blank output voltage, 5 W cooling rejection, 32 mm component-height rejection, generation with 190 × 85 × 40 mm / 15 W boundaries, 105-case matrix, filtering to 5 V at 100% load, explicit mode-limit warnings, real capacitor-bank details, and project creation with the full summary surviving reload. Desktop component-specification screenshot inspected. An actual mobile device has not been tested.

Browser download-event capture timed out, but the actual downloaded files synchronized successfully and were inspected. CSV contains all 105 rows, 16 columns, seven output voltages and 39 mode-limited rows even while the UI shows a filtered subset. Exported JSON passes projectSchema and preserves all six extra ratings, space/cooling limits, the 13,197-character complete summary and EEHZU1J151P × 21 bank. The event-capture issue is isolated to the browser test tooling; downloaded bytes are verified.

Fresh-context review found one Important preset issue: lower-voltage outputs incorrectly inherited the main output current ceiling. Reproduced 48 V / 2 A yielding 5 V / 2 A; corrected to 5 V / 3 A and 20 V / 4.8 A within the 96 W budget. The regression failed before the fix and passed afterward, with the full 40-test suite green. Browser verification confirmed the corrected rows, ETD39 candidate and 21-capacitor bank. No Critical or deferred Minor findings.

This model is a continuous-pulse, fixed ideal LS-width analytical scenario. It is not an RRW11011 behavioral model, complete production BOM, layout, temperature, ZVS, lifetime or certification validation. The eight-part output capacitor catalog is explicitly bounded by published test conditions and software margins.

## Earlier v0.4.0 verification

2026-09-23: TypeScript validation passed. All 30 automated tests passed, including requirements-only synthesis/API, invalid PD power, output-capacitor charge independently integrated from a half-sine waveform, hold-endpoint current/ESR ratings, automatic efficiency-budget rounding, project provenance and existing v0.1–v0.3 coverage.

Browser preview verified the four-step requirements → boundaries → candidates → component-specification flow through the real synthesis API. The default 48 V / 5 A example produced three candidates. Applying the 160 kHz candidate created a project, ran the calculation API, and preserved its source requirements and component summary after a full page reload. Text-report and JSON export buttons were exercised; their downloaded bytes were not independently inspected in this pass. Desktop component-table screenshot inspected. Responsive CSS is implemented; an actual mobile device has not been tested.

Regression checks reproduced then resolved: leaving an invalid boundary field no longer disables navigation from the valid requirements step; edited requirements and generated candidates survive navigation to reference resources and back. Unapplied drafts remain in this page session only. Created projects use the existing browser storage and portable export flow.

Fresh-context review identified four Important issues (no Critical): hold-endpoint component ratings, hidden-step validation, wizard unmount/reset, and efficiency floating-point rounding. Each was fixed and verified. Public source and exports use public Infineon, TI and TDK references; uploaded confidential controller documents are not included. The synthesis model remains a design seed, not controller behavioral validation, measured efficiency, proven ZVS, production magnetics drawings or a selected production BOM.

## Earlier v0.1.0 verification

Automated coverage: independent 480 W numeric reference, power conservation, FHA unity at resonance, capacitance/temperature/frequency boundaries, invalid and nonfinite input, API JSON/type/size handling, CORS, stale review evidence, large saved workspace round-trip, optimistic cross-tab storage conflict, report HTML escaping.

Browser preview verified: initial server calculation, creation of a new project, evidence entry, evidence becoming stale after editing bulk capacitance, 330 µF versus 470 µF comparison (15.52 ms versus 22.11 ms), JSON download contents, and reimport into a new project. Desktop screenshot inspected. Responsive CSS is implemented; an actual mobile device has not been tested.

Optional WebMCP tools are feature-detected. The available browser reports modelContext unavailable, so tool registration/execution could not be tested in that browser. Ordinary UI and API do not depend on WebMCP.

Fresh independent review identified asymmetric storage size limits and cross-tab overwrite risk. Both have been addressed with shared storage parsing and optimistic write checks, plus regression tests. Engineering calculations are analytical estimates, not hardware validation.
