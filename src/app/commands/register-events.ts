import { Notice, TFile, TFolder } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { ProgressNotice } from '../ui/progress-notice'

export function registerEvents(plugin: TranscriberPlugin): void {
    plugin.registerEvent(
        plugin.app.workspace.on('file-menu', (menu, file) => {
            if (file instanceof TFile && plugin.transcriptionService.isImageFile(file)) {
                menu.addItem((item) => {
                    item.setTitle('Transcribe image')
                        .setIcon('file-text')
                        .onClick(() => {
                            void transcribeFileWithNotice(plugin, file)
                        })
                })
            }

            if (file instanceof TFolder) {
                menu.addItem((item) => {
                    item.setTitle('Transcribe all images in folder')
                        .setIcon('files')
                        .onClick(() => {
                            void transcribeFolderWithProgress(plugin, file)
                        })
                })
            }
        })
    )
}

async function transcribeFileWithNotice(plugin: TranscriberPlugin, file: TFile): Promise<void> {
    new Notice(`Transcribing ${file.name}...`)
    const result = await plugin.transcriptionService.transcribeFile(file)
    if (result.success) {
        new Notice(`Transcribed ${file.name} successfully`)
    } else {
        new Notice(`Failed to transcribe ${file.name}: ${result.error}`)
    }
}

async function transcribeFolderWithProgress(
    plugin: TranscriberPlugin,
    folder: TFolder
): Promise<void> {
    const settings = plugin.settings
    const progress = new ProgressNotice(`Scanning ${folder.name} for images...`)

    const results = await plugin.transcriptionService.transcribeFolder(
        folder,
        settings.includeSubfolders,
        (current, total, fileName) => {
            progress.update(`Transcribing (${current}/${total}): ${fileName}`)
        }
    )

    progress.hide()

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    if (results.length === 0) {
        new Notice(`No images found in ${folder.name}`)
    } else if (failed === 0) {
        new Notice(`Transcribed ${succeeded} image${succeeded !== 1 ? 's' : ''} successfully`)
    } else {
        new Notice(`Transcribed ${succeeded} image${succeeded !== 1 ? 's' : ''}, ${failed} failed`)
    }
}
