export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'avif', 'svg'] as const

export const KNOWN_MODELS = [
    'qwen3.5:latest',
    'qwen3.5:0.8b',
    'qwen3.5:2b',
    'qwen3.5:4b',
    'qwen3.5:9b',
    'qwen3.5:27b',
    'qwen3.5:35b',
    'qwen3.5:122b',
    'qwen3.5:397b-cloud'
] as const

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

export const DEFAULT_MODEL = 'qwen3.5:9b'

export const DEFAULT_TRANSCRIPTION_PROMPT = `You are an expert document transcriber. Convert this image to well-structured Markdown.

Rules:
- Preserve all text content exactly as shown
- Use appropriate Markdown formatting (headings, lists, tables, code blocks)
- Maintain the original document structure and hierarchy
- For diagrams or charts, describe them in detail
- For handwritten text, transcribe as accurately as possible
- If text is unclear, use [unclear] as a placeholder
- Do not add commentary or explanations outside the transcription
- Output only the Markdown content, nothing else`

export const MAX_CONCURRENT_TRANSCRIPTIONS = 3
