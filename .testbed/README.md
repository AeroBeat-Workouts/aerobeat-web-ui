# UI Testbed

This hidden testbed owns Web Component tests, demos, component scenes, debug data, browser validation, and generated local dependency symlinks.

Create `.testbed/node_modules/@aerobeat/web-this-repo` as a local symlink to `../../../src` with `npm run testbed:link-self`. Add sibling `@aerobeat/web-*` symlinks only for declared public package dependencies.

Do not commit installed `node_modules` folders or generated testbed symlinks.
