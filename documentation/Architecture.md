# Architecture

## Overview

Obsidian Transcriber is a desktop-only plugin that transcribes images to Markdown using Ollama vision models. It follows a layered architecture with clear separation of concerns.

## Layers

### Entry Point (`src/main.ts`)

Re-exports `TranscriberPlugin` as the default export for Obsidian.

### Plugin (`src/app/plugin.ts`)

`TranscriberPlugin` extends Obsidian's `Plugin`. Manages lifecycle (onload/onunload), initializes services, registers commands and events, adds the settings tab. Owns immutable settings via Immer.

### Services (`src/app/services/`)

- **OllamaService** — HTTP client for Ollama's REST API (`/api/tags`, `/api/chat`). Uses Obsidian's `requestUrl`. Accepts an optional `RequestFn` for testability.
- **TranscriptionService** — Orchestrates transcription. Reads images from the vault, calls OllamaService, writes Markdown output. Handles batch operations with concurrency limiting.

### Commands (`src/app/commands/`)

- **register-commands.ts** — Registers command palette commands
- **register-events.ts** — Registers context menu (file-menu) events for files and folders
- **transcribe-image-command.ts** — `transcribe-current-image` command (checkCallback, active only on image files)

### Settings (`src/app/settings/`)

- **settings-tab.ts** — `TranscriberSettingTab` with Ollama config, transcription settings, and support sections
- **settings-constants.ts** — UI label constants

### Domain (`src/app/domain/`)

- **constants.ts** — Image extensions, known models, defaults, concurrency limit
- **ollama-types.ts** — TypeScript interfaces for Ollama API
- **schemas.ts** — Zod schemas for response validation
- **transcription-result.ts** — `TranscriptionResult` interface

### UI (`src/app/ui/`)

- **progress-notice.ts** — `ProgressNotice` wrapping Obsidian's `Notice` with in-place updates for batch progress

### Utilities (`src/utils/`)

- **base64.ts** — `arrayBufferToBase64` for image encoding
- **concurrency.ts** — `processWithConcurrency` promise pool
- **log.ts** — Logging utility

## Data Flow

1. User triggers transcription (command/context menu)
2. TranscriptionService reads image binary from vault
3. OllamaService encodes image to base64 and POSTs to Ollama `/api/chat`
4. Ollama returns Markdown text
5. TranscriptionService writes `.md` file alongside the source image
6. Notice shown to user with result
