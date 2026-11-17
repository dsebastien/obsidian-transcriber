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
    frontmatterTags: string
    /** Vault folder for the transcription files. Blank: next to each image. */
    outputFolder: string
    /** Text in front of each transcription file's name. Blank: none. */
    outputFilePrefix: string
    /** Put the text into the current note and write no transcription file. */
    insertIntoNote: boolean
}

/**
 * A fresh default settings object, safe to hand to Immer.
 *
 * `produce` deep-freezes what it returns, including any subtree it shares
 * with its base. Producing from the shared DEFAULT_SETTINGS froze that
 * constant (nested values too) for the rest of the process, so any later code
 * or test touching it failed with "Attempted to assign to readonly
 * property". Produce from this instead, and keep it deep-fresh: build
 * nested arrays and objects as new values, never by spreading DEFAULT_SETTINGS.
 */
export function createDefaultSettings(): PluginSettings {
    return {
        ollamaUrl: DEFAULT_OLLAMA_URL,
        modelName: DEFAULT_MODEL,
        transcriptionPrompt: DEFAULT_TRANSCRIPTION_PROMPT,
        includeSubfolders: false,
        overwriteExisting: false,
        frontmatterTags: '',
        outputFolder: '',
        outputFilePrefix: '',
        insertIntoNote: false
    }
}

/** The defaults, for reading and comparing. Never produce from it. */
export const DEFAULT_SETTINGS: PluginSettings = createDefaultSettings()
