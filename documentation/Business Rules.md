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

All network requests use Obsidian's `requestUrl` (not `fetch`) for CORS-free HTTP access. Exception: `/api/pull` uses native `fetch` because `requestUrl` does not support streaming responses (needed for pull progress). Ollama API responses are validated with Zod schemas.

## Desktop Only

The plugin is `isDesktopOnly: true` because it requires a local Ollama server.
