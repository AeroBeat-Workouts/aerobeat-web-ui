# Play calibration checklist — screenshot approval checkpoint

**Status:** Design revision 4 approved by Derrick on 2026-10-25. Revision 3 removed “Visible” from all landmark labels and deleted the redundant knee line, as requested. The real Play lifecycle then proved that fresh calibration goes immediately to countdown `3`, so Derrick chose to preserve that timing and revise the old “Release / Complete” concept instead of adding a pause. Two revised portrait/desktop countdown screenshots now replace the old complete screenshots. Owner: aerobeat-web-ui, main. Parent: assembly `.plans/2026-10-25-boxing-heights-fixed-colliders-knee-calibration.md`. Design only; no public release changes.

## Decision and next check

A compact static HTML/CSS concept shows current-frame detector statuses inside a synthetic assembled Play shell, not the hidden calibration badge/testbed. Derrick approved the checklist once his two text edits landed. They are in revision 3, its ten screenshots were regenerated with the existing capture assertions, and assembly may now register design truth before implementing the actual Play checklist.

## Tasks

- [x] Read both owner READMEs, parent plan, and actual assembly Play shell cue/styles. Assembly's `.transient-cue` is centered at 18% from top, dark `#03131f`, white high-contrast type and outlined round corners; menu sits top right, FPS top left and renderer fills the parent. Hidden badge/testbed are not design truth. The synthetic scene deliberately uses abstract graphic geometry, never a camera frame or product asset.
- [x] Build isolated `design/play-calibration-checklist.html`: nine individual measured-landmark status rows when Boxing knee strikes are on at 0%, two pose rows and a two-second hold row. Show partial knee flicker resetting hold, active hold, completed capture and Flow/no-knee contrast. No clickable checklist rows, permissions, gameplay controls or live camera connection.
- [x] Capture labeled PNGs in `screenshots/play-calibration-checklist/` with local Chromium/Playwright and fixed viewport/device scale 1. Record the exact capture command and state inventory below.
- [x] Human gate: Derrick explicitly approved after revision 3 removes “Visible” from all nine landmark labels and removes the knee-flicker helper line; captured PNGs now show both changes. This is approval for the checklist design only, not a public release.

## State inventory and capture

The standalone file uses synthetic static examples chosen by the `?state=` query: `knee-flicker` (left knee visible, right knee briefly lost, hold resets to zero), `holding` (all nine visible; hold at 1.2/2 seconds), `countdown` (immediate native `3`, checklist hidden after completed hold), `flow` (seven upper-body rows only, knees not required), and `boxing-knees-off` (same seven rows only). The Boxing mode eyebrow explicitly shows **Knee strikes ON · 0% chance** to demonstrate that zero probability still requires both knees, without an extra knee-instruction line. Nine landmark labels omit “Visible” and show plain names such as “Right Knee”. Textual `Seen`/`Missing`/`Waiting`/`Holding`/`Complete` statuses accompany icons and color. Rows represent momentary detector state, not interactive or latched checkboxes. The immediate countdown state is a synthetic sample after calibration, not a claim that a physical user was calibrated.

From owner repo root, run `node design/capture-play-calibration-checklist.cjs`. It uses the existing assembly `node_modules/playwright` and installed Chromium executable; no web server, network, device camera, installed product, or public route. Canonical captures use 390×844 portrait, 1440×900 desktop, and 844×390 phone landscape, device scale 1, with animation suppressed and fonts awaited. The script asserts all row labels, the knee present/absent contract and viewport geometry, and writes ten labeled PNGs; screenshot-only visual review is **not** production fidelity verification. Browser dependencies must exist locally; do not vendor them into owner repo.

## Boundary / Beads

Owner repo has no Beads database (`bd ready --json`: no database). Parent assembly plan notes a DB schema v66 vs installed CLI v53 mismatch and unrelated dirty assembly `.beads/interactions.jsonl`; do not attempt assembly Beads writes. This owner checkpoint is the durable task record until the parent can safely reconcile its ledger. Parent assembly must register approved revision 3 as `ui_fidelity` design truth before production checklist work; reference/real/diff/token parity is not yet produced.

## Outcome

Approved design-only, synthetic browser screenshots for assembly task E. No production screenshot or public route change; the current mockup captures are not yet real-app fidelity evidence.

## Revision 4 — preserve immediate countdown

The connected Play fidelity check exposed a conflict in revision 3: its “Release / Complete” sample never paints, because the input's committed two-second calibration and Gameplay's 3/2/1 countdown start in the same display frame. Derrick explicitly chose **Keep immediate countdown** rather than delaying playback to show a new completion screen, and authorized a revised mockup. Revision 4 replaces the two `complete` samples with `countdown` samples: cue `3`, checklist hidden. The ten-state capture script checks that the panel is hidden, no checklist rows remain, and cue `3` is visible in portrait and desktop. All other eight states retain their approved revision-3 wording and layout. The synthetic scene is not real game art; assembly's connected Play fidelity check still compares its actual cue/card separately. This decision does not modify the input gate or the public route.

## Revision 3 — Derrick's conditional approval, now satisfied

Derrick requested removal of the word “Visible” from the landmark checklist and removal of “Both knees must be visible now, even at 0%.” He explicitly authorized implementation after these edits. Revision 3 labels all nine landmarks by name only; the knee-flicker state hides its redundant subtitle line rather than leaving a blank gap. The existing capture script asserts both changes, the correct nine/seven measured rows, desktop/phone/landscape layout and no page errors. Ten PNGs were regenerated at the canonical viewports; the updated portrait screenshot shows “Nose”, “Left Wrist”, “Right Knee” and no helper line. Parent assembly production UI may proceed with `ui_fidelity` registration; public signed 0.0.145 remains unchanged.

## Revision 2 — Derrick's screenshot feedback

Derrick found the revision-1 landscape card overlapped the top-right hamburger (card x394–835 and button x788–835 at y36–53), while the desktop cue ended at y251 and card began at y252. Revision 2 changes **only static mockup CSS**: desktop/portrait card starts 12px lower; landscape card starts below the hamburger while retaining a compact two-column layout. The same capture command regenerated all ten screenshots, including the affected desktop (three) and landscape (two); portrait samples shifted down with the card and were also refreshed. The HTML and owner checkpoint are the only text changes; no production code changed. Screenshot names remain the same under `screenshots/play-calibration-checklist/`.

Validation: Chromium/Playwright screenshots regenerated with the existing script; a read-only layout check across all five states at each of the three viewports found **zero menu/card intersections** and no card content scrolling/clipping. Desktop cue/card bounding boxes are y162–250.75 and y264–724.39 respectively (13.25px clearance). Landscape hamburger is x788–836, y8–56; knee-flicker card is x394–834, y91.09–377.69 (non-overlapping vertically); the hold-progress footer is fully visible. Derrick later approved revision 3 with two requested text removals; see below.
