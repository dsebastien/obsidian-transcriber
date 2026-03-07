import {
    DEFAULT_MODEL,
    DEFAULT_OLLAMA_URL,
    DEFAULT_TRANSCRIPTION_PROMPT
} from '../domain/constants'

export interface PluginSettings {
    ollamaUrl: string
    modelName: string
    transcriptionPrompt: string
    includeSubfolders: boolean
    overwriteExisting: boolean
}

export const DEFAULT_SETTINGS: PluginSettings = {
    ollamaUrl: DEFAULT_OLLAMA_URL,
    modelName: DEFAULT_MODEL,
    transcriptionPrompt: DEFAULT_TRANSCRIPTION_PROMPT,
    includeSubfolders: false,
    overwriteExisting: false
}
