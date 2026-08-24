# aerobeat-web-ui

AeroBeat native Web Components for calibration, HUD, menus, settings, debug, and testbed screens.

## Responsibility

This repo owns product UI components and composition screens built from named `aero-*` Web Components. The first skeleton starts the Frutiger Aero visual direction with reusable components that CV and input scenes can compose.

It does not own style tokens, camera/CV logic, input routing, gameplay scoring, renderer output, content conversion, or assembly service wiring.

## Public API Surface

- `src/index.js` registers and exports starter UI components.
- `src/elements/aero-button/aero-button.js` defines a reusable command component.
- `src/elements/aero-status-panel/aero-status-panel.js` defines a reusable status surface for proving scenes.
- `src/screens/aero-calibration-screen/aero-calibration-screen.js` composes visible UI from `aero-*` components only.

## Adjacent Repos

- `aerobeat-web-style` owns theme tokens consumed by components.
- `aerobeat-web-cv` owns camera/CV service data shown by calibration components.
- `aerobeat-web-input` owns routed input event data shown by proving scenes.
- `aerobeat-web-assembly` wires screens and services into the product shell.

## Allowed Imports

Runtime code may import public exports from `@aerobeat/web-contracts` and style entry points from `@aerobeat/web-style`. Do not import sibling internals, one-off scene controls, or vendor-native shapes.

## Web Component Rules

Every visible primitive, control, widget, panel, modal, overlay, HUD piece, and screen element must be a named `aero-*` Web Component. Screens and scenes may compose layout, but visible UI must come from component modules with standalone scenes and debug data.

## Testbed Shape

Component scenes live under `.testbed/scenes/` and representative states live under `.testbed/debug-data/`. Generated `.testbed/node_modules/@aerobeat/web-this-repo` is local state and must be recreated with:

```bash
npm run testbed:link-self
```

Do not commit installed `node_modules` folders or generated testbed symlinks.

## Validation

Run before handoff:

```bash
npm run check
npm test
npm run test:browser
```

The current validators are placeholder-level checks for JSDoc/no-escape posture, public import boundaries, component-only scenes, and console-noise expectations.

## Documentation Handoff

Keep repo-local decisions in `docs/decisions/`. Public contributor docs belong in `aerobeat-web-docs` after components are accepted.
