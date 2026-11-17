import { MarkdownView } from 'obsidian'
import type { App, Editor, TFile } from 'obsidian'
import {
    appendToNote,
    blockAfterLine,
    blockAtCursor,
    findEmbedLine,
    insertAfterLine
} from '../utils/note-embeds'

/** Where a transcription landed in the note. */
export type InsertionPlace = 'after-embed' | 'at-cursor' | 'end-of-note'

/**
 * Whether `view` shows `note` in an editing mode (Live Preview or Source).
 * A view in Reading mode has an editor object too, but a change made through
 * it is not saved: the text would be reported as inserted and be lost.
 */
const isEditing = (view: MarkdownView, note: TFile): boolean =>
    view.file?.path === note.path && view.getMode() === 'source'

/**
 * The editor of a loaded Markdown view that edits `note`, the active view
 * first. A note being edited is written through its editor: the editor can
 * hold text that is not saved yet, and a write to the file would discard it.
 */
function findEditor(app: App, note: TFile): Editor | null {
    const active = app.workspace.getActiveViewOfType(MarkdownView)
    if (active !== null && isEditing(active, note)) {
        return active.editor
    }
    for (const leaf of app.workspace.getLeavesOfType('markdown')) {
        const view = leaf.view
        if (view instanceof MarkdownView && isEditing(view, note)) {
            return view.editor
        }
    }
    return null
}

/**
 * Put a transcription into `note`: in its own paragraph after the first line
 * that embeds `image`, else at the cursor, else (the note is not being
 * edited: closed, or in Reading view) at the end of the note.
 *
 * Each write reads the text and changes it in one synchronous step, or inside
 * `vault.process`, so transcriptions that finish at the same time cannot
 * overwrite each other.
 */
export async function insertIntoNote(
    app: App,
    note: TFile,
    image: TFile,
    markdown: string
): Promise<InsertionPlace> {
    const embedsImage = (linkpath: string): boolean =>
        app.metadataCache.getFirstLinkpathDest(linkpath, note.path)?.path === image.path

    const editor = findEditor(app, note)
    if (editor !== null) {
        const lines = editor.getValue().split('\n')
        const index = findEmbedLine(lines, embedsImage)
        if (index !== -1) {
            editor.replaceRange(blockAfterLine(lines, index, markdown), {
                line: index,
                ch: (lines[index] ?? '').length
            })
            return 'after-embed'
        }
        const cursor = editor.getCursor()
        editor.replaceRange(blockAtCursor(editor.getLine(cursor.line), cursor.ch, markdown), cursor)
        return 'at-cursor'
    }

    let place: InsertionPlace = 'end-of-note'
    await app.vault.process(note, (content) => {
        const index = findEmbedLine(content.split('\n'), embedsImage)
        if (index !== -1) {
            place = 'after-embed'
            return insertAfterLine(content, index, markdown)
        }
        place = 'end-of-note'
        return appendToNote(content, markdown)
    })
    return place
}
