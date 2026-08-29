# Business Rules

This document defines the core business rules. These rules MUST be respected in all implementations unless explicitly approved otherwise.

---

## Documentation Guidelines

When a new business rule is mentioned:

1. Add it to this document immediately
2. Use a concise format (single line or brief paragraph)
3. Maintain precision - do not lose important details for brevity
4. Include rationale where it adds clarity

## Image Recognition

Supported image extensions: `png`, `jpg`, `jpeg`, `gif`, `bmp`, `webp`, `avif`, `svg`. Only files with these extensions are treated as transcribable images.

## Output Naming

Transcription output is a `.md` file with the same name and location as the source image (e.g., `photo.png` produces `photo.md` in the same folder).

## Overwrite Behavior

When `overwriteExisting` is false (default), images that already have a corresponding `.md` file are silently skipped. When true, existing `.md` files are updated via `vault.modify()`.

## Concurrency

Batch folder transcription processes at most 3 images concurrently (`MAX_CONCURRENT_TRANSCRIPTIONS`). Individual failures do not abort the batch; each result is tracked independently.

## Network

All network requests use Obsidian's `requestUrl` (not `fetch`) for CORS-free HTTP access. Exception: `/api/pull` uses native `fetch` because `requestUrl` does not support streaming responses (needed for pull progress). Ollama API endpoints used: `/api/tags` (list), `/api/chat` (transcribe), `/api/pull` (install), `/api/delete` (remove). All responses are validated with Zod schemas.

## Frontmatter Tags

When the `frontmatterTags` setting is non-empty, the comma-separated tag values are injected into the YAML frontmatter of every transcribed `.md` file after the model response. Behavior: if frontmatter exists with a `tags:` block, only missing tags are added (existing tags preserved); if frontmatter exists without a `tags:` block, one is inserted at the top of the frontmatter; if no frontmatter exists, one is prepended. An empty setting (default) injects nothing. Injection happens locally; tag values are treated as literal strings (no regex/replacement-pattern expansion).

## Desktop Only

The plugin is `isDesktopOnly: true` because it requires a local Ollama server.

## Settings

- **Declarative settings pane (Obsidian 1.13+)**: The settings tab is declared via `getSettingDefinitions()` — `display()` never runs, which sets `minAppVersion` to 1.13.0. The framework re-invokes `getSettingDefinitions()` on every `update()`, which is what drives the dynamic parts: the model dropdown's options and the recommended-model rows are recomputed from the installed-model list each render. Model discovery is loop-safe: a background refresh only calls `update()` when the list actually changed.
- **Single serialized write path**: Every settings mutation — tab controls and the model commands alike — goes through `updateSettings(mutator)`: persist-then-commit (memory swaps only after `saveData()` succeeds) and serialized (each mutation derives from the previously committed state). The Ollama service re-reads its config strictly AFTER a successful commit. The old `saveSettings` also waited for the save, but it ran against a state already assigned to `plugin.settings` optimistically, so a failed save left memory and the service disagreeing about what was stored.
- **`setControlValue` rejects invalid writes**: type mismatches and unknown keys throw. `modelName` is deliberately not validated against the installed list — that list is asynchronous and can be stale or empty while the server is down.
- **Settings load backfills every field**: `frontmatterTags` used to be missing from the load backfill, silently resetting the saved value on every restart.
