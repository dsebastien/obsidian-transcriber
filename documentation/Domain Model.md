# Domain Model

## PluginSettings

- `ollamaUrl: string` — Ollama server URL (default: `http://localhost:11434`)
- `modelName: string` — Vision model name (default: `qwen3.5:9b`)
- `transcriptionPrompt: string` — Prompt sent with each image
- `includeSubfolders: boolean` — Process subfolders in batch operations (default: false)
- `overwriteExisting: boolean` — Overwrite existing `.md` files (default: false)

## TranscriptionResult

- `sourceFile: string` — Path of the source image
- `outputFile: string` — Path of the output `.md` file
- `success: boolean`
- `error?: string` — Error message if failed
- `durationMs?: number` — Processing time

## Ollama API Types

- `OllamaChatRequest` — Chat completion request with model, messages (including base64 images), stream flag
- `OllamaChatResponse` — Response with model, message content, done flag
- `OllamaTagsResponse` — List of available models from `/api/tags`
- `OllamaModelInfo` — Individual model metadata (name, size, modified_at)

## ConnectionTestResult

- `ok: boolean` — Whether connection succeeded
- `error?: string` — Error message if failed
- `models?: string[]` — Available model names if succeeded
