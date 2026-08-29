# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.7.0...2.0.0) (2026-08-29)

### ⚠ BREAKING CHANGES

* **plugin:** minAppVersion moves from 1.8.7 to 1.13.0 — the
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

* **plugin:** declare the settings tab (Obsidian 1.13 declarative settings) ([abb6ccf](https://github.com/dsebastien/obsidian-transcriber/commit/abb6ccff86d681be78c36a4ef78814a007a7d611))
* **plugin:** show what's new in a tab instead of a modal dialog ([c1f4bc6](https://github.com/dsebastien/obsidian-transcriber/commit/c1f4bc67c8dc27d504b325ff259da8db57f67fa1))
* **plugin:** surface support CTAs everywhere users can see them ([cd23cba](https://github.com/dsebastien/obsidian-transcriber/commit/cd23cba91b143e81c9478c22b74fbe649f9c4495))

### Bug Fixes

* **build:** align with the catalog reviewer's archive, ruleset and audit ([849459a](https://github.com/dsebastien/obsidian-transcriber/commit/849459a8f3d7495b74843d3125ec2834325e6b92))
* **plugin:** harden model discovery and the settings pane after review ([8da48fc](https://github.com/dsebastien/obsidian-transcriber/commit/8da48fcf13b90442df2a231b767544b6e1389a5a))

## [1.7.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.6.0...1.7.0) (2026-07-29)

### Features

* **plugin:** aggregate what's new dialogs across simultaneously updated plugins ([c757abd](https://github.com/dsebastien/obsidian-transcriber/commit/c757abdb5aad49e816a340686c3f66af85e457a2))

## [1.6.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.5.0...1.6.0) (2026-07-29)

### Features

* **plugin:** add Knowii community to the what's new dialog and harden it ([a0c9411](https://github.com/dsebastien/obsidian-transcriber/commit/a0c941142d6f7c0368db1a5d57b709f79663754a))

## [1.5.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.4.1...1.5.0) (2026-07-27)

### Features

* **plugin:** show a what's new dialog once after plugin updates ([f6527f2](https://github.com/dsebastien/obsidian-transcriber/commit/f6527f25b68f046cdce2f6ac23e016690ab2ed3c))

## [1.4.1](https://github.com/dsebastien/obsidian-transcriber/compare/1.4.0...1.4.1) (2026-07-17)

## [1.4.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.3.2...1.4.0) (2026-05-15)

### Features

* **plugin:** add frontmatter tags settings ([#1](https://github.com/dsebastien/obsidian-transcriber/issues/1)) ([fbc4ecc](https://github.com/dsebastien/obsidian-transcriber/commit/fbc4ecc55bfa0daac717950121f7c4acb0bc10f6))

## [1.3.2](https://github.com/dsebastien/obsidian-transcriber/compare/1.3.1...1.3.2) (2026-05-14)

## [1.3.1](https://github.com/dsebastien/obsidian-transcriber/compare/1.3.0...1.3.1) (2026-05-13)

## [1.3.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.2.0...1.3.0) (2026-04-06)

### Features

* **all:** added more support for transcribing in different contexts ([806cf68](https://github.com/dsebastien/obsidian-transcriber/commit/806cf680727fc0ab85a13b3c7c07b3254c9506f0))
* **all:** updated docs ([a8a8144](https://github.com/dsebastien/obsidian-transcriber/commit/a8a8144dac957e58382fdc9f5ecb577ab81d443f))

## [1.2.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.1.0...1.2.0) (2026-03-26)

### Features

* **all:** updated default recommended model ([5d9efa3](https://github.com/dsebastien/obsidian-transcriber/commit/5d9efa312298c8c244b1804f57e1e8a5d3bb3a31))

## [1.1.0](https://github.com/dsebastien/obsidian-transcriber/compare/1.0.0...1.1.0) (2026-03-08)

### Features

* **all:** updated ([277c72d](https://github.com/dsebastien/obsidian-transcriber/commit/277c72d68280482b799cf8187f66b7a28efbc094))

## 1.0.0 (2026-03-08)

### Features

* **all:** added commands and improved docs ([f4e3da1](https://github.com/dsebastien/obsidian-transcriber/commit/f4e3da15ab0bece6462cf3f07c6111b066ea5848))
* **all:** improved default prompt ([ddead74](https://github.com/dsebastien/obsidian-transcriber/commit/ddead74fbe0e4abeb31ebfa81f13622a98b1a8ad))
* **all:** improved logging and notifications ([f93230c](https://github.com/dsebastien/obsidian-transcriber/commit/f93230cd26cf9d7ee217509f474bc0a7d999daf5))
* **all:** improved settings and model download ([7cc2b4a](https://github.com/dsebastien/obsidian-transcriber/commit/7cc2b4af7644bfcf3ec4b583e45ade779707f466))
* **all:** init ([1843038](https://github.com/dsebastien/obsidian-transcriber/commit/18430387b41b2ef1ce02636527f1878531f26372))









