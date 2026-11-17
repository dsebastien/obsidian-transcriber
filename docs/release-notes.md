# Release Notes

## 2.2.0 (2026-11-17)

You can now choose where the text of a transcription goes. The new settings are in Settings, Transcriber, under **Transcription settings**. They are all empty or off by default, so nothing changes until you set one. Thanks to bobhalford for the request.

### Put transcription files in one folder

With a large media folder, the `.md` files got lost among the images. Set **Output folder** and every transcription file goes to that folder, whatever folder the image is in. The folder is created if it does not exist. Leave it empty and each file stays next to its image, as before.

**File name prefix** adds text in front of the name of each transcription file: `OCR_` gives `OCR_photo.md`. It works with and without an output folder, and it cannot contain `\ / : * ? " < > |`.

One thing to know: with an output folder, two images that have the same name (in two different folders) share one transcription file. The second one is skipped, or replaces the first when **Overwrite existing files** is on.

### Insert the transcription into the current note

Turn on **Insert into the current note** and the text goes into your note. No separate file is created.

- **Transcribe all images in current note**: each transcription goes in a new paragraph right after its image, in the order of the note.
- **Transcribe this image** (right-click an image embed in the editor): the text goes after the image.
- **Transcribe image** (right-click an image in the file explorer): the text goes into the note you have open. It lands after the image if the note embeds it, at the cursor if it does not. Reading view has no cursor, so there the text goes at the end of the note.

If no note is open (for example, the image itself is the active tab), a file is created as usual. Folder transcriptions always create files. In this mode, the frontmatter tags are not added and an existing transcription file does not stop the transcription, so running the action twice inserts the text twice.

### The notice says where the text went

When a single image is done, the notice now shows the path of the transcription file, or the note the text was inserted into. It stays on screen for 10 seconds. It also tells you when an image was skipped because its transcription already exists (**Overwrite existing files** is off).

### Documentation

The documentation now recommends `glm-ocr:latest` as the default model.

## 2.1.1 (2026-09-28)

### Bug Fixes

- **plugin:** keep the support block from stacking on every settings refresh

## 2.1.0 (2026-09-27)

### Features

- **build:** fail the build on a lockfile the catalog review cannot parse
- **build:** make the rule floor check that it is still wired in
- **build:** refuse commits that loosen the rules instead of fixing the finding

### Bug Fixes

- **build:** exclude bun-types alongside @types/bun from the release-age gate
- **build:** harden the release path from the template
- **build:** rebuild versions.json from the published releases
- **deps:** move the fast-uri override off the vulnerable line
- **plugin:** lowercase the newsletter line

## 2.0.0 (2026-08-29)

### ⚠ BREAKING CHANGES

- **plugin:** minAppVersion moves from 1.8.7 to 1.13.0 — the
  declarative settings API (getSettingDefinitions) only exists there.

getSettingDefinitions() replaces the 311-line display() tab. The
framework re-invokes it on every update(), which drives the dynamic
parts: the model dropdown's options and the recommended-model rows are
recomputed from the installed-model list each render, and the stored
model stays visible flagged '(not found)' when it is not installed. The
installed-model refresh is loop-safe — a completed refresh only
re-renders when the list actually changed, so the render/refresh cycle
terminates. Test-connection, model installs and the custom-model row
are render rows; the support block rides the unlayered settings-stack
class.

The write path is now a single serialized persist-then-commit
updateSettings(mutator) shared by the tab AND the two model commands
(both wrote optimistically before); the Ollama service re-reads its
config strictly after a successful commit, where the old saveSettings
broadcast state that might never have been persisted. setControlValue
rejects type mismatches and unknown keys.

Fixed along the way: frontmatterTags was missing from the settings-load
backfill, so the saved value silently reset to '' on every restart.

94 tests (7 new write-path tests, mutation-checked ordering and
serialization; 4 latestMinAppVersion tests), tsc, lint
--max-warnings 0 and build green — the prefer-setting-definitions
advisory from the previous commit is now satisfied.

### Features

- **plugin:** declare the settings tab (Obsidian 1.13 declarative settings)
- **plugin:** show what's new in a tab instead of a modal dialog
- **plugin:** surface support CTAs everywhere users can see them

### Bug Fixes

- **build:** align with the catalog reviewer's archive, ruleset and audit
- **plugin:** harden model discovery and the settings pane after review

## 1.7.0 (2026-07-29)

### Features

- **plugin:** aggregate what's new dialogs across simultaneously updated plugins

## 1.6.0 (2026-07-29)

### Features

- **plugin:** add Knowii community to the what's new dialog and harden it

## 1.5.0 (2026-07-27)

### Features

- **plugin:** show a what's new dialog once after plugin updates

## 1.4.1 (2026-07-17)

## 1.4.0 (2026-05-15)

### Features

- **plugin:** add frontmatter tags settings ([#1](https://github.com/dsebastien/obsidian-transcriber/issues/1))

## 1.3.2 (2026-05-14)

## 1.3.1 (2026-05-13)

## 1.3.0 (2026-04-06)

### Features

- **all:** added more support for transcribing in different contexts
- **all:** updated docs

## 1.2.0 (2026-03-26)

### Features

- **all:** updated default recommended model

## 1.1.0 (2026-03-08)

### Features

- **all:** updated

## 1.0.0 (2026-03-08)

### Features

- **all:** added commands and improved docs
- **all:** improved default prompt
- **all:** improved logging and notifications
- **all:** improved settings and model download
- **all:** init
