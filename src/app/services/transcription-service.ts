import { TFile, TFolder } from 'obsidian'
import type { App } from 'obsidian'
import { IMAGE_EXTENSIONS, MAX_CONCURRENT_TRANSCRIPTIONS } from '../domain/constants'
import type { TranscriptionResult } from '../domain/transcription-result'
import type { PluginSettings } from '../types/plugin-settings.intf'
import type { OllamaService } from './ollama-service'
import { processWithConcurrency } from '../../utils/concurrency'
import { log } from '../../utils/log'

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
        const pathWithoutExt = imageFile.path.slice(0, -(imageFile.extension.length + 1))
        return `${pathWithoutExt}.md`
    }

    async transcribeFile(file: TFile): Promise<TranscriptionResult> {
        const outputPath = this.getOutputPath(file)
        const startTime = Date.now()

        try {
            const settings = this.getSettings()

            if (!settings.overwriteExisting) {
                const existingFile = this.app.vault.getAbstractFileByPath(outputPath)
                if (existingFile) {
                    return {
                        sourceFile: file.path,
                        outputFile: outputPath,
                        success: true,
                        durationMs: Date.now() - startTime
                    }
                }
            }

            log(`Transcribing: ${file.path}`, 'debug')

            const imageData = await this.app.vault.readBinary(file)
            const markdown = await this.ollamaService.transcribeImage(
                imageData,
                settings.transcriptionPrompt
            )

            const existingFile = this.app.vault.getAbstractFileByPath(outputPath)
            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, markdown)
            } else {
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
