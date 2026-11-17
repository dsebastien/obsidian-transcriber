# Domain Model

## PluginSettings

- `ollamaUrl: string` — Ollama server URL (default: `http://localhost:11434`)
- `modelName: string` — Vision model name (default: `glm-ocr:latest`)
- `transcriptionPrompt: string` — Prompt sent with each image
- `includeSubfolders: boolean` — Process subfolders in batch operations (default: false)
- `overwriteExisting: boolean` — Overwrite existing `.md` files (default: false)
- `frontmatterTags: string` — Comma-separated tags written to the YAML frontmatter of transcribed files (default: empty)
- `outputFolder: string` — Vault folder for the transcription files, normalized; empty = next to each image (default: empty)
- `outputFilePrefix: string` — Text in front of each transcription file's name (default: empty)
- `insertIntoNote: boolean` — Insert the text into the target note and write no file (default: false)

## TranscriptionResult

- `sourceFile: string` — Path of the source image
- `outputFile: string` — Path of the note that holds the text: the transcription file, or the note the text was inserted into
- `success: boolean`
- `skipped?: boolean` — The transcription file existed and was left as it is
- `inserted?: boolean` — The text went into an existing note; no file was written
- `error?: string` — Error message if failed
- `durationMs?: number` — Processing time

## Ollama API Types

- `OllamaChatRequest` — Chat completion request with model, messages (including base64 images), stream flag
- `OllamaChatResponse` — Response with model, message content, done flag
- `OllamaTagsResponse` — List of available models from `/api/tags`
- `OllamaModelInfo` — Individual model metadata (name, size, modified_at)
- `OllamaPullProgress` — Streaming progress during model pull (status, digest, total, completed)
- `OllamaDeleteResponse` — Response from `/api/delete` (status, error)

## ConnectionTestResult

- `ok: boolean` — Whether connection succeeded
- `error?: string` — Error message if failed
- `models?: string[]` — Available model names if succeeded
