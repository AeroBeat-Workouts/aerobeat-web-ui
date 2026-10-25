# Play calibration checklist — screenshot approval checkpoint

**Status:** Design artifacts ready for screenshot review; Derrick has not approved production checklist UI. Owner: aerobeat-web-ui, current main. Parent: assembly `.plans/2026-10-25-boxing-heights-fixed-colliders-knee-calibration.md`, task D. No production UI, assembly runtime, input, gameplay, renderer, route, or public release edits are in scope.

## Decision and next check

A compact static HTML/CSS concept shows current-frame detector statuses inside a synthetic assembled Play shell, not the hidden calibration badge/testbed. Review the captured phone, desktop, and landscape PNGs with Derrick. Wait for explicit screenshot approval before the parent plan's task E may register the approved design revision and implement the production checklist.

## Tasks

- [x] Read both owner READMEs, parent plan, and actual assembly Play shell cue/styles. Assembly's `.transient-cue` is centered at 18% from top, dark `#03131f`, white high-contrast type and outlined round corners; menu sits top right, FPS top left and renderer fills the parent. Hidden badge/testbed are not design truth. The synthetic scene deliberately uses abstract graphic geometry, never a camera frame or product asset.
- [x] Build isolated `design/play-calibration-checklist.html`: nine individual measured-landmark status rows when Boxing knee strikes are on at 0%, two pose rows and a two-second hold row. Show partial knee flicker resetting hold, active hold, completed capture and Flow/no-knee contrast. No clickable checklist rows, permissions, gameplay controls or live camera connection.
- [x] Capture labeled PNGs in `screenshots/play-calibration-checklist/` with local Chromium/Playwright and fixed viewport/device scale 1. Record the exact capture command and state inventory below.
- [ ] Human gate: Derrick reviews PNGs and explicitly approves or requests changes. Approval is not implied by a source commit.

## State inventory and capture

The standalone file uses synthetic static examples chosen by the `?state=` query: `knee-flicker` (left knee visible, right knee briefly lost, hold resets to zero), `holding` (all nine visible; hold at 1.2/2 seconds), `complete` (all nine visible and 2/2 seconds), `flow` (seven upper-body rows only, knees not required), and `boxing-knees-off` (same seven rows only). The Boxing labels explicitly show **Knee strikes ON · 0% chance** to demonstrate that zero probability still requires both knees. Textual `Seen`/`Missing`/`Waiting`/`Holding`/`Complete` statuses accompany icons and color. Rows represent momentary detector state, not interactive or latched checkboxes. Completion is a sample captured state, not a claim that a physical user was calibrated.

From owner repo root, run `node design/capture-play-calibration-checklist.cjs`. It uses the existing assembly `node_modules/playwright` and installed Chromium executable; no web server, network, device camera, installed product, or public route. Canonical captures use 390×844 portrait, 1440×900 desktop, and 844×390 phone landscape, device scale 1, with animation suppressed and fonts awaited. The script asserts all row labels, the knee present/absent contract and viewport geometry, and writes ten labeled PNGs; screenshot-only visual review is **not** production fidelity verification. Browser dependencies must exist locally; do not vendor them into owner repo.

## Boundary / Beads

Owner repo has no Beads database (`bd ready --json`: no database). Parent assembly plan notes a DB schema v66 vs installed CLI v53 mismatch and unrelated dirty assembly `.beads/interactions.jsonl`; do not attempt assembly Beads writes. This owner checkpoint is the durable task record until the parent can safely reconcile its ledger. Production `ui_fidelity` remains **pending** in the parent; mockup approval date/revision and production reference/real/diff/token parity cannot be asserted now.

## Outcome

Design-only, synthetic browser screenshots for Derrick's visual decision. No production screenshot, gameplay acceptance or approval claim. No change to public route.
