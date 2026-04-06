import { Notice, TFile, TFolder } from 'obsidian'
import type { Editor, MarkdownFileInfo } from 'obsidian'
import type { TranscriberPlugin } from '../plugin'
import { ProgressNotice } from '../ui/progress-notice'
import { log } from '../../utils/log'

const IMAGE_EMBED_WIKILINK = /!\[\[([^\]]+)\]\]/
const IMAGE_EMBED_MARKDOWN = /!\[(?:[^\]]*)\]\(([^)]+)\)/

function resolveImageEmbedOnLine(
    plugin: TranscriberPlugin,
    line: string,
    sourcePath: string
): TFile | null {
    const wikiMatch = IMAGE_EMBED_WIKILINK.exec(line)
    const mdMatch = IMAGE_EMBED_MARKDOWN.exec(line)
    const linkPath = wikiMatch?.[1] ?? mdMatch?.[1]
    if (!linkPath) return null

    const resolved = plugin.app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath)
    if (!resolved) return null
    if (!plugin.transcriptionService.isImageFile(resolved)) return null
    return resolved
}

export function registerEvents(plugin: TranscriberPlugin): void {
    plugin.registerEvent(
        plugin.app.workspace.on('file-menu', (menu, file) => {
            if (file instanceof TFile && plugin.transcriptionService.isImageFile(file)) {
                menu.addItem((item) => {
                    item.setTitle('Transcribe image')
                        .setIcon('file-text')
                        .onClick(() => {
                            transcribeFileWithNotice(plugin, file).catch((err) => {
                                log(
                                    `Unexpected error during transcription: ${err instanceof Error ? err.message : String(err)}`,
                                    'error'
                                )
                                new Notice(
                                    `Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`
                                )
                            })
                        })
                })
            }

            if (file instanceof TFolder) {
                menu.addItem((item) => {
                    item.setTitle('Transcribe all images in folder')
                        .setIcon('files')
                        .onClick(() => {
                            transcribeFolderWithProgress(plugin, file).catch((err) => {
                                log(
                                    `Unexpected error during folder transcription: ${err instanceof Error ? err.message : String(err)}`,
                                    'error'
                                )
                                new Notice(
                                    `Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`
                                )
                            })
                        })
                })
            }
        })
    )

    plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu, editor: Editor, info: MarkdownFileInfo) => {
            const sourceFile = info.file
            if (!sourceFile) return

            const cursor = editor.getCursor()
            const line = editor.getLine(cursor.line)
            const imageFile = resolveImageEmbedOnLine(plugin, line, sourceFile.path)

            if (imageFile) {
                menu.addItem((item) => {
                    item.setTitle('Transcribe this image')
                        .setIcon('file-text')
                        .onClick(() => {
                            transcribeFileWithNotice(plugin, imageFile).catch((err) => {
                                log(
                                    `Unexpected error during transcription: ${err instanceof Error ? err.message : String(err)}`,
                                    'error'
                                )
                                new Notice(
                                    `Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`
                                )
                            })
                        })
                })
            }
        })
    )
}

async function transcribeFileWithNotice(plugin: TranscriberPlugin, file: TFile): Promise<void> {
    const progress = new ProgressNotice(`Transcribing ${file.name}...`)
    try {
        const result = await plugin.transcriptionService.transcribeFile(file)
        progress.hide()
        if (result.success) {
            new Notice(`Transcribed ${file.name} successfully`)
        } else {
            new Notice(`Failed to transcribe ${file.name}: ${result.error}`)
        }
    } catch (err) {
        progress.hide()
        throw err
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
