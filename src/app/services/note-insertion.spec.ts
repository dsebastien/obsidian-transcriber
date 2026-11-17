import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { MarkdownView, TFile } from 'obsidian'
import type { App } from 'obsidian'
import { insertIntoNote } from './note-insertion'

function createFile(path: string): TFile {
    const file = Object.create(TFile.prototype) as TFile & Record<string, unknown>
    file['path'] = path
    return file
}

type Position = { line: number; ch: number }

/**
 * An editor over a string, with the three calls the insertion uses. The real
 * replaceRange with one position inserts at it, which is all this does.
 */
function createEditor(initial: string, cursor: Position): { value: () => string; editor: unknown } {
    let content = initial
    const offsetOf = (position: Position): number => {
        const lines = content.split('\n')
        let offset = 0
        for (let line = 0; line < position.line; line++) {
            offset += (lines[line] ?? '').length + 1
        }
        return offset + position.ch
    }
    return {
        value: () => content,
        editor: {
            getValue: () => content,
            getCursor: () => cursor,
            getLine: (line: number) => content.split('\n')[line] ?? '',
            replaceRange: (text: string, position: Position) => {
                const offset = offsetOf(position)
                content = content.slice(0, offset) + text + content.slice(offset)
            }
        }
    }
}

function createView(
    notePath: string,
    editor: unknown,
    mode: 'source' | 'preview' = 'source'
): MarkdownView {
    const view = Object.create(MarkdownView.prototype) as MarkdownView
    const fields = view as unknown as Record<string, unknown>
    fields['file'] = createFile(notePath)
    fields['editor'] = editor
    fields['getMode'] = () => mode
    return view
}

describe('insertIntoNote', () => {
    const note = createFile('notes/Meeting.md')
    const image = createFile('media/scan.png')

    let activeView: MarkdownView | null
    let leaves: { view: unknown }[]
    let processed: Record<string, string>
    let mockProcess: ReturnType<typeof mock>
    let app: App

    beforeEach(() => {
        activeView = null
        leaves = []
        processed = {}
        mockProcess = mock((file: TFile, fn: (data: string) => string) => {
            processed[file.path] = fn(processed[file.path] ?? '')
            return Promise.resolve(processed[file.path])
        })
        app = {
            workspace: {
                getActiveViewOfType: () => activeView,
                getLeavesOfType: () => leaves
            },
            vault: { process: mockProcess },
            metadataCache: {
                // Resolves a link by its file name, as Obsidian does for a short link.
                getFirstLinkpathDest: (linkpath: string) =>
                    linkpath.endsWith('scan.png') ? image : createFile(`media/${linkpath}`)
            }
        } as unknown as App
    })

    test('writes after the embed through the editor of the active note', async () => {
        const { editor, value } = createEditor('intro\n![[scan.png|300]]\noutro', {
            line: 0,
            ch: 0
        })
        activeView = createView(note.path, editor)

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('after-embed')
        expect(value()).toBe('intro\n![[scan.png|300]]\n\nTEXT\n\noutro')
        expect(mockProcess).not.toHaveBeenCalled()
    })

    test('writes at the cursor when the note does not embed the image', async () => {
        const { editor, value } = createEditor('first line\n\nlast line', { line: 1, ch: 0 })
        activeView = createView(note.path, editor)

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('at-cursor')
        expect(value()).toBe('first line\nTEXT\n\nlast line')
    })

    test('starts a paragraph when the cursor is at the end of a line of text', async () => {
        const { editor, value } = createEditor('first line', { line: 0, ch: 10 })
        activeView = createView(note.path, editor)

        await insertIntoNote(app, note, image, 'TEXT')

        expect(value()).toBe('first line\n\nTEXT\n')
    })

    test('uses the editor of a note that is open in another pane', async () => {
        const other = createEditor('other note', { line: 0, ch: 0 })
        const target = createEditor('![[scan.png]]', { line: 0, ch: 0 })
        activeView = createView('notes/Other.md', other.editor)
        leaves = [
            { view: {} }, // a view that is not loaded yet
            { view: createView('notes/Other.md', other.editor) },
            { view: createView(note.path, target.editor) }
        ]

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('after-embed')
        expect(target.value()).toBe('![[scan.png]]\n\nTEXT\n')
        expect(other.value()).toBe('other note')
        expect(mockProcess).not.toHaveBeenCalled()
    })

    test('writes through the vault when the note is in Reading view', async () => {
        // A Reading view has an editor object, and a change made through it
        // is not saved (seen live: reported as inserted, absent from the file).
        const reading = createEditor('![[scan.png]]\nnext', { line: 0, ch: 0 })
        activeView = createView(note.path, reading.editor, 'preview')
        leaves = [{ view: activeView }]
        processed[note.path] = '![[scan.png]]\nnext'

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('after-embed')
        expect(processed[note.path]).toBe('![[scan.png]]\n\nTEXT\n\nnext')
        expect(reading.value()).toBe('![[scan.png]]\nnext')
    })

    test('prefers a pane that edits the note over the active Reading view', async () => {
        const reading = createEditor('![[scan.png]]', { line: 0, ch: 0 })
        const editing = createEditor('![[scan.png]]', { line: 0, ch: 0 })
        activeView = createView(note.path, reading.editor, 'preview')
        leaves = [{ view: activeView }, { view: createView(note.path, editing.editor) }]

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('after-embed')
        expect(editing.value()).toBe('![[scan.png]]\n\nTEXT\n')
        expect(reading.value()).toBe('![[scan.png]]')
        expect(mockProcess).not.toHaveBeenCalled()
    })

    test('writes through the vault when the note is in no editor', async () => {
        processed[note.path] = '![[scan.png]]\nnext'

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('after-embed')
        expect(processed[note.path]).toBe('![[scan.png]]\n\nTEXT\n\nnext')
    })

    test('appends through the vault when there is no embed and no editor', async () => {
        processed[note.path] = '# Title\n'

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('end-of-note')
        expect(processed[note.path]).toBe('# Title\n\nTEXT\n')
    })

    test('does not take the embed of another image for this one', async () => {
        const { editor, value } = createEditor('![[other.png]]\n', { line: 1, ch: 0 })
        activeView = createView(note.path, editor)

        expect(await insertIntoNote(app, note, image, 'TEXT')).toBe('at-cursor')
        expect(value()).toBe('![[other.png]]\nTEXT\n')
    })

    test('keeps the order of the note when images finish out of order', async () => {
        const first = createFile('media/one.png')
        const second = createFile('media/two.png')
        app.metadataCache.getFirstLinkpathDest = (linkpath: string) =>
            linkpath === 'one.png' ? first : second
        const { editor, value } = createEditor('![[one.png]]\n![[two.png]]', { line: 0, ch: 0 })
        activeView = createView(note.path, editor)

        await Promise.all([
            insertIntoNote(app, note, second, 'TWO'),
            insertIntoNote(app, note, first, 'ONE')
        ])

        expect(value()).toBe('![[one.png]]\n\nONE\n\n![[two.png]]\n\nTWO\n')
    })
})
