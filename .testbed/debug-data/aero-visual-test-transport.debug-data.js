// @ts-check

import { defineAeroVisualTestTransport } from "@aerobeat/web-this-repo";

defineAeroVisualTestTransport();
const transport = document.querySelector("aero-visual-test-transport");
if (transport && "setSnapshot" in transport && typeof transport.setSnapshot === "function") {
  transport.setSnapshot(Object.freeze({ active: true, playing: false, currentMs: 65_000, durationMs: 180_000 }));
}
