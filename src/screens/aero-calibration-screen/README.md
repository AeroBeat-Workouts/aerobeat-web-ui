# aero-calibration-screen

Automatic calibration composition made only from named `aero-*` presenters.

The screen fills its assigned parent, composes media preview, retained/dim grid, T-pose badge and capability state, and accepts snapshots through `setSnapshot()`. It does not start camera access, calculate calibration, traverse renderer internals, or expose the retired manual/bootstrap calibration path.
