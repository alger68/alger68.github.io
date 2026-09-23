# Power design envelope v0.5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend requirements-driven HWLLC synthesis with transparent multi-condition sizing, physical limits and a verified output-capacitor catalog.

**Architecture:** Keep the stateless synthesis API and four-step wizard. Add focused catalog/envelope modules, include their results in generated candidates and portable summaries. Preserve old requirements by schema defaults.

**Tech Stack:** Existing TypeScript, Zod, React, Vinext/Vite, Node test runner. No new dependencies.

**Spec:** docs/design-envelope-v05.md

## Global Constraints
- User-supplied input/output/boundaries only; L/C/turns remain generated.
- Never equate the continuous-pulse model with verified RRW11011 behavior, efficiency, ZVS, temperature or certification.
- Public sources only; preserve v2 project imports and existing Site/GitHub scope.
- No stock, cost, lifetime or mechanical-layout guarantee without data.

## Review Focus
- Old saved requirements acquire defaults without changing their intended single-output meaning.
- Additional low-voltage/high-current points drive winding and output-capacitor sizing, with control-mode limitations visible.
- Hard geometry/cooling failures yield reasons, not an invented best candidate.
- Catalog ESR/frequency/temperature conditions and bank sharing margins remain explicit.
- Empty or invalid dynamic rows must be repairable; changing any requirement invalidates old results.

### Task 1: Engineering envelope and catalog
**Files:** requirements.ts, synthesis.ts; new lib/power/design-envelope.ts and component-catalog.ts; tests/design-envelope.test.ts.
**Interfaces:** synthesize(Requirements) retains existing fields, adds candidate.envelope, candidate.outputParts and counted rejection reasons. Each envelope row exposes bus/output/load, frequency, current and flux, plus model status. selectOutputCaps(bank, requirements, fsMin) returns catalog combinations with conditions and empty-reason.
- [x] Write and run failing tests: old defaults; additional-point sizing; independent balance and RMS calculation; geometry/cooling blockers; bank capacity/ESR/ripple constraints; no-match catalog. Example: `assert.equal(synthesize({...req,space:{lengthMm:190,widthMm:85,heightMm:32}}).candidates.length,0)`.
- [x] Implement pure modules and integrate maximum/minimum extrema before candidate acceptance. Gate dimensions using verified assembly data. Keep uncovered mode rows explicit.
- [x] Run `node --experimental-strip-types --test tests/*.test.ts`; expected all tests pass. Inspect every failure before proceeding.

### Task 2: Requirements and result interface
**Files:** designer.tsx; new components/power/design-evaluation.tsx; app/globals.css; candidateSummary.
**Interfaces:** same API, generated Project.design summary, dynamic additionalOutputs and nullable space/coolingBudgetW inputs.
- [x] Add optional output ratings with a PD preset and accessible add/delete controls. Add optional boundary sections for known space/cooling limits.
- [x] Display case matrix, worst stresses, mode limitations, geometry scope and actual capacitor-bank part numbers/quantities/sources. Preserve default input count and wizard state.
- [x] Browser RED/GREEN for added controls, invalid-row recovery, generation, mode notices, apply and saved report; inspect desktop UI. No redundant implementation-mirroring UI unit tests.

### Task 3: Verification and publication
**Files:** README.md, docs/VERIFICATION.md, model version, catalog sources.
- [x] Run independent review once; fix Important/Critical findings with reproductions and a green suite.
- [ ] Typecheck and build static plus Worker outputs through the Site workflow; expected exit 0 and exact-source archive.
- [ ] Publish existing public Site and GitHub `power-design-360/` only; confirm terminal deployment and Pages success. Explain remaining engineering scope precisely.
