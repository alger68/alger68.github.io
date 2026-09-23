# Split-bus LC diagnostic v0.3

Spec: add an explicitly gated LC diagnostic for a split capacitor midpoint connected to a resonant branch. Under a stiff DC bus, both rails are AC ground; incremental branch current is `(Cr1 + Cr2) dv/dt`. This generic circuit identity does not supply a complete HWLLC gain, control, current stress, or ZVS model.

Plan:
1. Add default-unknown capacitor connection and optional measured/assumed low-side on-time. Backward compatible with project v1/v2; preserve evidence but invalidate fingerprints when model inputs change.
2. Return separate capacitor sum, ratio, unloaded LC frequency, half-period and on-time/half-period metrics, only when wiring and all LC inputs are supplied. Retain null FHA outputs and pending HWLLC gain check.
3. Expose assumptions and results in editor, dashboard, report and documentation. No proprietary notes, PDFs, controller-specific equations or private project data in public source.
4. Verify numerical fixtures, missing inputs, schema migration, UI/API flow, builds, and fresh review. Publish to existing Site and GitHub path under existing user authorization.

Review focus: AC equivalent must be a sum; half-period factor must be correct; no implied ZVS pass; no unknown-to-zero fallback; imported old projects remain unknown; switching modes preserves fields; private artifacts stay outside repository.

Ledger:
- Baseline: 87bf75c4f936803adcebc911fa5ea66eb6d40262. Existing isolated Sites checkout opened and synchronized before edits.
- Pre-flight: schema → engine → UI/report/API share new optional inputs and nullable metrics. All consumers will be updated together.
- Tests authored before implementation; RED observed: 4/4 fail for missing schema fields and absent report diagnostics.
