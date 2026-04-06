# Multi-Image Transcription Triggers

## Problem

Transcription can currently only be triggered via right-click on a single image in the file explorer, right-click on a folder, or a command palette command for the active image file. Users need more flexible ways to trigger transcription for multiple images at once.

## New Triggers

### 1. Command: "Transcribe all images in current note"

- **Command ID:** `transcribe-note-images`
- **Type:** `checkCallback` — active only when the active file is a `.md` file
- **Behavior:** Scans the active note for image embeds, resolves them to `TFile` references, and batch-transcribes all found images
- **Empty case:** Notice "No images found in this note"
- **Progress:** `ProgressNotice` with `Transcribing (2/5): photo.png` pattern
- **Summary:** Same pattern as folder transcription ("X transcribed, Y failed")

### 2. Editor context menu: "Transcribe this image"

- **Event:** `editor-menu` (right-click in the editor)
- **Detection strategy (two-pass):**
    1. **Cursor-line regex:** Read the editor line at cursor position, match `![[something.ext]]` or `![alt](something.ext)`
    2. **Click-target fallback:** If no match on cursor line, inspect `info.event` target for `<img>` elements (covers live-preview/reading mode where cursor may not align with the image)
- **Resolution:** Extract link path, call `app.metadataCache.getFirstLinkpathDest(linkPath, activeFile.path)` to resolve to `TFile`
- **Validation:** File must exist and pass `isImageFile()` check
- **Menu item:** "Transcribe this image" with `file-text` icon
- **Action:** Reuses existing `transcribeFileWithNotice()` from `register-events.ts`

### 3. Command: "Transcribe images in folder..."

- **Command ID:** `transcribe-folder-images`
- **Type:** Regular `callback` (always available)
- **Flow:**
    1. Open `FolderSuggestModal` — lists all vault folders via `FuzzySuggestModal<TFolder>`
    2. On folder selection, get images via `TranscriptionService.getImageFilesInFolder(folder, settings.includeSubfolders)`
    3. If no images found, show Notice "No images found in folder"
    4. Otherwise open `ImageSelectModal` — checkbox list of images, all checked by default, with select all/deselect all toggle and "Transcribe" button
    5. On confirm, batch-transcribe selected images with `processWithConcurrency` + `ProgressNotice`
    6. Summary Notice at end

## New Components

### `src/app/utils/note-images.ts`

Utility to extract image `TFile` references from a note:

- Uses `app.metadataCache.getFileCache(note)` to read cached metadata
- Reads `.embeds` array (Obsidian parses both `![[image.png]]` and `![](image.png)` into this)
- Resolves each embed via `app.metadataCache.getFirstLinkpathDest(embed.link, note.path)`
- Filters to image files only via `TranscriptionService.isImageFile()`
- Deduplicates (same image embedded multiple times)
- Returns `TFile[]`

### `src/app/ui/folder-suggest-modal.ts`

`FuzzySuggestModal<TFolder>` listing all vault folders. Callback fires with selected `TFolder`.

### `src/app/ui/image-select-modal.ts`

`Modal` with checkbox list:

- Receives `TFile[]` of images
- Each row: checkbox + image filename (with relative path for disambiguation)
- All checked by default
- Select all / Deselect all toggle at the top
- "Transcribe" button at the bottom
- Callback fires with checked `TFile[]`

### `src/app/commands/transcribe-note-images-command.ts`

Command factory for "Transcribe all images in current note".

### `src/app/commands/transcribe-folder-images-command.ts`

Command factory for "Transcribe images in folder...".

## Modified Files

- `src/app/commands/register-commands.ts` — register two new commands
- `src/app/commands/register-events.ts` — add `editor-menu` handler

## Unchanged

- `TranscriptionService` — all new triggers feed into existing `transcribeFile()` and `processWithConcurrency`
- `OllamaService` — no API changes
- Settings — no new settings needed
- Business rules — all existing rules apply (concurrency limit `MAX_CONCURRENT_TRANSCRIPTIONS`, overwrite behavior, image extensions)

## Testing

- `src/app/utils/note-images.spec.ts` — unit tests for note image extraction (mock metadataCache)
- `src/app/commands/transcribe-note-images-command.spec.ts` — command check/execute logic
- `src/app/commands/transcribe-folder-images-command.spec.ts` — command flow logic
- Modal classes follow existing `SuggestModal` patterns; integration-level testing only
