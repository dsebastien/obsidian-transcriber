import { Notice, TFile } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { FolderSuggestModal } from '../ui/folder-suggest-modal'
import { ImageSelectModal } from '../ui/image-select-modal'
import { ProgressNotice } from '../ui/progress-notice'
import { MAX_CONCURRENT_TRANSCRIPTIONS } from '../domain/constants'
import { processWithConcurrency } from '../../utils/concurrency'
import { log } from '../../utils/log'

export function createTranscribeFolderImagesCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    callback: () => void
} {
    return {
        id: 'transcribe-folder-images',
        name: 'Transcribe images in folder...',
        callback(): void {
            new FolderSuggestModal(plugin.app, (folder) => {
                const settings = plugin.settings
                const imageFiles = plugin.transcriptionService.getImageFilesInFolder(
                    folder,
                    settings.includeSubfolders
                )

                if (imageFiles.length === 0) {
                    new Notice(`No images found in ${folder.path || '/'}`)
                    return
                }

                new ImageSelectModal(plugin.app, imageFiles, (selected) => {
                    void transcribeSelectedImages(plugin, selected)
                }).open()
            }).open()
        }
    }
}

async function transcribeSelectedImages(plugin: TranscriberPlugin, files: TFile[]): Promise<void> {
    try {
        const progress = new ProgressNotice(
            `Transcribing ${files.length} image${files.length !== 1 ? 's' : ''}...`
        )

        let completed = 0
        const results = await processWithConcurrency(
            files,
            MAX_CONCURRENT_TRANSCRIPTIONS,
            async (file: TFile) => {
                completed++
                progress.update(`Transcribing (${completed}/${files.length}): ${file.name}`)
                return plugin.transcriptionService.transcribeFile(file)
            }
        )

        progress.hide()

        const succeeded = results.filter((r) => r.success).length
        const failed = results.filter((r) => !r.success).length

        if (failed === 0) {
            new Notice(`Transcribed ${succeeded} image${succeeded !== 1 ? 's' : ''} successfully`)
        } else {
            new Notice(
                `Transcribed ${succeeded} image${succeeded !== 1 ? 's' : ''}, ${failed} failed`
            )
        }
    } catch (err) {
        log(
            `Unexpected error during batch transcription: ${err instanceof Error ? err.message : String(err)}`,
            'error'
        )
        new Notice(`Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}
