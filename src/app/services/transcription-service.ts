import { TFile, TFolder } from 'obsidian'
import type { App } from 'obsidian'
import { IMAGE_EXTENSIONS, MAX_CONCURRENT_TRANSCRIPTIONS } from '../domain/constants'
import type { TranscriptionResult } from '../domain/transcription-result'
import type { PluginSettings } from '../types/plugin-settings.intf'
import type { OllamaService } from './ollama-service'
import { processWithConcurrency } from '../../utils/concurrency'
import { log } from '../../utils/log'
import { buildOutputPath, folderAncestry, normalizeFolderPath } from '../utils/output-path'
import { insertIntoNote } from './note-insertion'

export interface TranscribeOptions {
    /**
     * The note the transcription goes into when the "insert into the current
     * note" setting is on. Without it (no note is open, or the action is not
     * about a note) the transcription goes to its own file.
     */
    targetNote?: TFile | null
}

export class TranscriptionService {
    private readonly app: App
    private readonly ollamaService: OllamaService
    private readonly getSettings: () => PluginSettings

    constructor(app: App, ollamaService: OllamaService, getSettings: () => PluginSettings) {
        this.app = app
        this.ollamaService = ollamaService
        this.getSettings = getSettings
    }

    isImageFile(file: TFile): boolean {
        const ext = file.extension.toLowerCase()
        return (IMAGE_EXTENSIONS as readonly string[]).includes(ext)
    }

    getOutputPath(imageFile: TFile): string {
        const settings = this.getSettings()
        return buildOutputPath(
            imageFile.path,
            imageFile.extension,
            settings.outputFolder,
            settings.outputFilePrefix
        )
    }

    async transcribeFile(
        file: TFile,
        options: TranscribeOptions = {}
    ): Promise<TranscriptionResult> {
        const settings = this.getSettings()
        const targetNote = settings.insertIntoNote ? (options.targetNote ?? null) : null
        if (targetNote !== null) {
            return this.transcribeIntoNote(file, targetNote, settings)
        }

        const outputPath = this.getOutputPath(file)
        const startTime = Date.now()

        try {
            if (!settings.overwriteExisting) {
                const existingFile = this.app.vault.getAbstractFileByPath(outputPath)
                if (existingFile) {
                    return {
                        sourceFile: file.path,
                        outputFile: outputPath,
                        success: true,
                        skipped: true,
                        durationMs: Date.now() - startTime
                    }
                }
            }

            log(`Transcribing: ${file.path}`, 'debug')

            const imageData = await this.app.vault.readBinary(file)
            let markdown = await this.ollamaService.transcribeImage(
                imageData,
                settings.transcriptionPrompt
            )

            // Ensure frontmatter with configured tags
            const requiredTags = settings.frontmatterTags
                ? settings.frontmatterTags
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0)
                : []
            if (requiredTags.length > 0) {
                markdown = this.ensureFrontmatterTags(markdown, requiredTags)
            }

            const existingFile = this.app.vault.getAbstractFileByPath(outputPath)
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, markdown)
            } else {
                await this.ensureFolder(settings.outputFolder)
                await this.app.vault.create(outputPath, markdown)
            }

            const durationMs = Date.now() - startTime
            log(`Transcribed ${file.path} in ${durationMs}ms`, 'debug')

            return {
                sourceFile: file.path,
                outputFile: outputPath,
                success: true,
                durationMs
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            log(`Failed to transcribe ${file.path}: ${message}`, 'error')

            return {
                sourceFile: file.path,
                outputFile: outputPath,
                success: false,
                error: message,
                durationMs: Date.now() - startTime
            }
        }
    }

    /**
     * Insert mode: the transcription goes into `note`, not into a file of its
     * own. An existing transcription file does not stop it, and the
     * frontmatter tags are left out: they have no place in the middle of a note.
     */
    private async transcribeIntoNote(
        file: TFile,
        note: TFile,
        settings: PluginSettings
    ): Promise<TranscriptionResult> {
        const startTime = Date.now()

        try {
            log(`Transcribing: ${file.path} into ${note.path}`, 'debug')

            const imageData = await this.app.vault.readBinary(file)
            const markdown = await this.ollamaService.transcribeImage(
                imageData,
                settings.transcriptionPrompt
            )
            const place = await insertIntoNote(this.app, note, file, markdown)

            const durationMs = Date.now() - startTime
            log(`Transcribed ${file.path} into ${note.path} (${place}) in ${durationMs}ms`, 'debug')

            return {
                sourceFile: file.path,
                outputFile: note.path,
                success: true,
                inserted: true,
                durationMs
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            log(`Failed to transcribe ${file.path}: ${message}`, 'error')

            return {
                sourceFile: file.path,
                outputFile: note.path,
                success: false,
                error: message,
                durationMs: Date.now() - startTime
            }
        }
    }

    /**
     * Create the configured output folder, and the folders above it, when
     * they are missing. Up to three transcriptions run at once, so a folder
     * another one created in the meantime is not an error.
     */
    private async ensureFolder(outputFolder: string): Promise<void> {
        for (const path of folderAncestry(normalizeFolderPath(outputFolder))) {
            const existing = this.app.vault.getAbstractFileByPath(path)
            if (existing instanceof TFolder) {
                continue
            }
            if (existing) {
                throw new Error(`The output folder "${path}" is a file`)
            }
            try {
                await this.app.vault.createFolder(path)
            } catch (error) {
                if (!(this.app.vault.getAbstractFileByPath(path) instanceof TFolder)) {
                    throw error
                }
            }
        }
    }

    ensureFrontmatterTags(markdown: string, requiredTags: string[]): string {
        const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        if (frontmatterMatch && frontmatterMatch[1] !== undefined) {
            const originalBody = frontmatterMatch[1]
            let frontmatterBody = originalBody
            const tagsMatch = frontmatterBody.match(/^tags:\s*\n((?:\s+-\s+.*\n?)*)/m)
            if (tagsMatch && tagsMatch[1] !== undefined) {
                const existingTags = [...tagsMatch[1].matchAll(/(?<=- ).+/g)].map((m) => m[0])
                const missingTags = requiredTags.filter((t) => !existingTags.includes(t))
                if (missingTags.length > 0) {
                    const insertion = missingTags.map((t) => `  - ${t}`).join('\n')
                    frontmatterBody = frontmatterBody.replace(
                        /^(tags:\s*\n)/m,
                        (_match, p1: string) => `${p1}${insertion}\n`
                    )
                    return markdown.replace(originalBody, () => frontmatterBody)
                }
            } else {
                const tagsBlock = `tags:\n${requiredTags.map((t) => `  - ${t}`).join('\n')}`
                frontmatterBody = `${tagsBlock}\n${frontmatterBody}`
                return markdown.replace(originalBody, () => frontmatterBody)
            }
            return markdown
        }

        // No frontmatter at all — prepend it
        const frontmatter = `---\ntags:\n${requiredTags.map((t) => `  - ${t}`).join('\n')}\n---\n\n`
        return frontmatter + markdown
    }

    getImageFilesInFolder(folder: TFolder, includeSubfolders: boolean): TFile[] {
        const images: TFile[] = []

        for (const child of folder.children) {
            if (child instanceof TFile && this.isImageFile(child)) {
                images.push(child)
            } else if (includeSubfolders && child instanceof TFolder) {
                images.push(...this.getImageFilesInFolder(child, true))
            }
        }

        return images
    }

    async transcribeFolder(
        folder: TFolder,
        includeSubfolders: boolean,
        onProgress?: (current: number, total: number, fileName: string) => void
    ): Promise<TranscriptionResult[]> {
        const imageFiles = this.getImageFilesInFolder(folder, includeSubfolders)

        if (imageFiles.length === 0) {
            return []
        }

        let completed = 0
        return processWithConcurrency(
            imageFiles,
            MAX_CONCURRENT_TRANSCRIPTIONS,
            async (file: TFile) => {
                completed++
                onProgress?.(completed, imageFiles.length, file.name)
                return this.transcribeFile(file)
            }
        )
    }
}
