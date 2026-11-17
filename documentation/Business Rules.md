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

Transcription output is a `.md` file named `<outputFilePrefix><image name>.md`. Its folder is `outputFolder` when that setting is set, else the folder of the source image. With both settings empty (default), `photo.png` produces `photo.md` in the same folder. With `outputFolder: 000_incoming` and `outputFilePrefix: OCR_`, every image produces `000_incoming/OCR_<image name>.md`, whatever folder the image is in.

- **Output folder**: stored normalized (forward slashes, no leading or trailing slash); blank, `/` and `.` mean "next to the image". The folder and the folders above it are created when missing, one level at a time, at the moment a file is written. A folder another transcription created in the meantime is not an error. A file that has the name of one of these folders fails the transcription.
- **File name prefix**: applies with and without an output folder. The settings tab refuses `\ / : * ? " < > |` (a separator would move the file; the others fail on Windows).
- **Same name, one file**: the output path comes from the image name alone, so images with the same name (in two folders, or `a.png` and `a.jpg`) share one transcription file. The second one is skipped, or overwrites the first when `overwriteExisting` is on. The output folder makes this more likely; it is accepted, not disambiguated.

## Insert Into The Current Note

When `insertIntoNote` is true and the action has a target note, the transcription is inserted into that note and no transcription file is written.

- **Target note**: the note itself for "Transcribe all images in current note"; the note being edited for the editor menu "Transcribe this image"; the active file, when it is a Markdown note, for the file explorer "Transcribe image". No target (the active file is an image, as in "Transcribe current image", or no note is active): the transcription goes to its file as usual. **Folder transcriptions never insert**: they always write files.
- **Position**: a new paragraph after the first line that embeds the image (wikilink or Markdown embed, alias and subpath ignored, fenced code skipped). When the note does not embed the image: at the cursor. When the note is not being edited (closed, or open in Reading view only): at the end of the note.
- **How it is written**: through the editor when the note is open in an editing mode, Live Preview or Source (a write to the file would discard unsaved text), else through `vault.process`. A Reading view is never written through its editor object: such a change is not saved (seen live: reported as inserted, absent from the file). The embed is searched in the text at the moment of the write, never from the metadata cache, so the three parallel insertions of a batch each land after their own embed.
- **Not applied in this mode**: frontmatter tags (no place in the middle of a note), `overwriteExisting` and the "file exists" skip (an existing transcription file does not block the insertion), the output folder and the prefix. Running the action twice inserts the text twice.

## Result Notice

The notice for a single image says where the text went and stays 10 seconds: `Transcribed <image>. Output: <path>`, `Transcribed <image>. Inserted into: <note>`, or `Skipped <image>, already transcribed. Output: <path>` when the file existed and `overwriteExisting` is off. Batch notices keep their counts.

## Overwrite Behavior

When `overwriteExisting` is false (default), images whose transcription file exists (at the path from Output Naming) are skipped: no request is sent, and the result is marked `skipped`. A single image says so in its notice; a batch counts it as a success. When true, existing `.md` files are updated via `vault.modify()`.

## Concurrency

Batch folder transcription processes at most 3 images concurrently (`MAX_CONCURRENT_TRANSCRIPTIONS`). Individual failures do not abort the batch; each result is tracked independently.

## Network

All network requests use Obsidian's `requestUrl` (not `fetch`) for CORS-free HTTP access. Exception: `/api/pull` uses native `fetch` because `requestUrl` does not support streaming responses (needed for pull progress). Ollama API endpoints used: `/api/tags` (list), `/api/chat` (transcribe), `/api/pull` (install), `/api/delete` (remove). All responses are validated with Zod schemas.

## Frontmatter Tags

When the `frontmatterTags` setting is non-empty, the comma-separated tag values are injected into the YAML frontmatter of every transcribed `.md` file after the model response. Behavior: if frontmatter exists with a `tags:` block, only missing tags are added (existing tags preserved); if frontmatter exists without a `tags:` block, one is inserted at the top of the frontmatter; if no frontmatter exists, one is prepended. An empty setting (default) injects nothing. Nothing is injected in insert mode either (see Insert Into The Current Note). Injection happens locally; tag values are treated as literal strings (no regex/replacement-pattern expansion).

## Desktop Only

The plugin is `isDesktopOnly: true` because it requires a local Ollama server.

## Settings

- **Declarative settings pane (Obsidian 1.13+)**: The settings tab is declared via `getSettingDefinitions()` — `display()` never runs, which sets `minAppVersion` to 1.13.0. The framework re-invokes `getSettingDefinitions()` on every `update()`, which is what drives the dynamic parts: the model dropdown's options and the recommended-model rows are recomputed from the installed-model list each render. Model discovery is loop-safe: a background refresh only calls `update()` when the list actually changed.
- **Single serialized write path**: Every settings mutation — tab controls and the model commands alike — goes through `updateSettings(mutator)`: persist-then-commit (memory swaps only after `saveData()` succeeds) and serialized (each mutation derives from the previously committed state). The Ollama service re-reads its config strictly AFTER a successful commit. The old `saveSettings` also waited for the save, but it ran against a state already assigned to `plugin.settings` optimistically, so a failed save left memory and the service disagreeing about what was stored.
- **`setControlValue` rejects invalid writes**: type mismatches and unknown keys throw. `modelName` is deliberately not validated against the installed list — that list is asynchronous and can be stale or empty while the server is down.
- **Settings load backfills every field**: `frontmatterTags` used to be missing from the load backfill, silently resetting the saved value on every restart.
