// @ts-check

import { fileURLToPath } from "node:url";
import { gameplayAssetReleaseVersion } from "@aerobeat/web-renderer";
import { createServer } from "vite";

const uiRoot = fileURLToPath(new URL("../", import.meta.url));
const rendererEntryUrl = new URL(import.meta.resolve("@aerobeat/web-renderer"));
const rendererGameplayAssetRoot = fileURLToPath(
  new URL(`../assets/gameplay/${gameplayAssetReleaseVersion}/`, rendererEntryUrl)
);

/** Create the UI browser-test server with only its owned root and pinned renderer assets exposed. */
export function createUiValidationServer() {
  return createServer({
    appType: "mpa",
    configFile: false,
    logLevel: "error",
    root: uiRoot,
    server: {
      host: "127.0.0.1",
      port: 0,
      fs: {
        strict: true,
        allow: [uiRoot, rendererGameplayAssetRoot]
      }
    }
  });
}
