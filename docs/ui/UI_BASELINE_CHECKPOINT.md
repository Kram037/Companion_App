# UI Baseline Checkpoint

Date: 2026-07-16

The visual baseline is the application state in the commit that introduces this file.
This state is approved and must remain unchanged during the technology migration.

## Non-regression rule

Do not change the current desktop or mobile appearance unless a later request explicitly
requires a visual change. Preserve layout, spacing, dimensions, typography, colors, icons,
navigation placement, responsive behavior, split view, and component states.

Technology changes may replace internal implementation only. They must render the same UI
and preserve the same user flows represented by the existing end-to-end tests.
