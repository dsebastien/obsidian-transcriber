import { Notice, TFile } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { getImageFilesFromNote } from '../utils/note-images'
import { ProgressNotice } from '../ui/progress-notice'
import { MAX_CONCURRENT_TRANSCRIPTIONS } from '../domain/constants'
import { processWithConcurrency } from '../../utils/concurrency'
import { log } from '../../utils/log'

export function createTranscribeNoteImagesCommand(plugin: TranscriberPlugin): {
    id: string
    name: string
    checkCallback: (checking: boolean) => boolean | void
} {
    return {
        id: 'transcribe-note-images',
        name: 'Transcribe all images in current note',
        checkCallback(checking: boolean): boolean | void {
            const activeFile = plugin.app.workspace.getActiveFile()
            if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
                return false
            }

            if (checking) {
                return true
            }

            void transcribeNoteImages(plugin, activeFile)
        }
    }
}

async function transcribeNoteImages(plugin: TranscriberPlugin, note: TFile): Promise<void> {
    try {
        const imageFiles = getImageFilesFromNote(plugin.app, note)

        if (imageFiles.length === 0) {
            new Notice('No images found in this note')
            return
        }

        const progress = new ProgressNotice(
            `Found ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''} in note...`
        )

        let completed = 0
        const results = await processWithConcurrency(
            imageFiles,
            MAX_CONCURRENT_TRANSCRIPTIONS,
            async (file: TFile) => {
                completed++
                progress.update(`Transcribing (${completed}/${imageFiles.length}): ${file.name}`)
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
            `Unexpected error during note image transcription: ${err instanceof Error ? err.message : String(err)}`,
            'error'
        )
        new Notice(`Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}
