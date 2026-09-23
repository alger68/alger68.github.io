# HWLLC / active bridge workbench v0.2

Scope: add an explicit TEA2209T active AC rectifier and RRW11011 HWLLC platform to the existing public workbench. Preserve existing conventional LLC projects, values and evidence. New fields default to the legacy topology when importing an old project; new HWLLC projects use separate, initially unknown tank parameters. Re-evaluate legacy evidence after schema expansion.

1. Add topology, rectifier and output-interface selection, independent HWLLC tank records, hot MOSFET resistance, driver supply ranges and measured positive pin peaks.
2. Keep power/energy budgets for either topology. Conventional FHA is valid only for the original half-bridge / center-tapped full-wave model. Return null and no curves for HWLLC resonance, Q, Rac and gain; never invent a HWLLC model from two capacitor values.
3. Add sourced controller envelope checks: RRW40120 supplies 10–18 V, positive VS peak ≤600 V; RRW43110 positive VD peak ≤135 V and switching ≤300 kHz; single USB PD output ≤48 V / 5 A / 240 W. Envelope checks are not system validation.
4. Active bridge conduction estimate uses two equal hot resistances: 2 × Rhot × Iac,rms². The front-end efficiency already includes rectifier loss; this estimate is a component of that budget and is never added again.
5. Show controller roles, document versions and manual validation of startup, COMP polarity, VHB sensing, tank connections, adaptive bulk, SR ringing and PD transitions. Link official resources; do not publish user-supplied PDFs or their OCR.
6. Verify model separation, old-project migration, pending unknowns, exact boundaries and API behavior. Exercise the UI, run types/builds, request one whole-change review, then publish Sites and the existing GitHub project folder.

Ruling: a typical application diagram does not establish the user's as-built tank, magnetic parasitics, controller option codes or timing. HWLLC analytical gain remains pending until the actual schematic and controller settings are available. Incorrectly enabling conventional FHA would be more misleading than showing a scoped energy tool.

Ruling: retain localStorage key v1 to find existing workspaces; portable exports become v2 and accept v1 on import. Source and public frontend remain in the previously authorized repositories.

Verification ledger: new topology/limit tests were observed failing before implementation and passing afterward. UI, source references and 38 manual checks implemented. Browser confirmed legacy project retention, HWLLC creation, null inputs, actual server calculation, PD over-limit and SR VD over-limit results, and 6.29 W bridge conduction without double counting. One fresh review found a mode-switch validation trap: reproduced in browser before fix; now invalid visible fields prevent topology/rectifier switching with explanation. Also corrected report null labels and comparison energy wording. Final builds pending.
