# Release Notes

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
