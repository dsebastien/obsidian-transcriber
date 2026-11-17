import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { TranscriptionService } from './transcription-service'
import type { OllamaService } from './ollama-service'
import type { PluginSettings } from '../types/plugin-settings.intf'
import { createDefaultSettings } from '../types/plugin-settings.intf'
import { TFile, TFolder } from 'obsidian'
import type { App } from 'obsidian'

function createMockFile(path: string, extension: string): TFile {
    const file = Object.create(TFile.prototype) as TFile & Record<string, unknown>
    file['path'] = path
    file['name'] = path.split('/').pop() ?? path
    file['extension'] = extension
    file['basename'] = path.split('/').pop()?.replace(`.${extension}`, '') ?? ''
    return file
}

function createMockFolder(name: string, children: (TFile | TFolder)[]): TFolder {
    const folder = Object.create(TFolder.prototype) as TFolder & Record<string, unknown>
    folder['name'] = name
    folder['path'] = name
    folder['children'] = children
    return folder
}

describe('TranscriptionService', () => {
    let service: TranscriptionService
    let mockApp: App
    let mockOllamaTranscribe: ReturnType<typeof mock>
    let settings: PluginSettings
    let mockGetAbstractFileByPath: ReturnType<typeof mock>
    let mockModify: ReturnType<typeof mock>
    let mockCreate: ReturnType<typeof mock>
    let mockCreateFolder: ReturnType<typeof mock>
    let mockProcess: ReturnType<typeof mock>
    /** What `vault.process` wrote back, by note path. */
    let noteContents: Record<string, string>

    beforeEach(() => {
        settings = createDefaultSettings()

        mockGetAbstractFileByPath = mock(() => null)
        mockModify = mock(() => Promise.resolve())
        mockOllamaTranscribe = mock(() => Promise.resolve('# Transcribed'))

        mockCreate = mock(() => Promise.resolve(createMockFile('out.md', 'md')))
        mockCreateFolder = mock(() => Promise.resolve(createMockFolder('created', [])))
        noteContents = {}
        mockProcess = mock((note: TFile, fn: (data: string) => string) => {
            noteContents[note.path] = fn(noteContents[note.path] ?? '')
            return Promise.resolve(noteContents[note.path])
        })

        mockApp = {
            vault: {
                readBinary: mock(() => Promise.resolve(new ArrayBuffer(10))),
                create: mockCreate,
                createFolder: mockCreateFolder,
                modify: mockModify,
                process: mockProcess,
                getAbstractFileByPath: mockGetAbstractFileByPath
            },
            // No note is open in an editor: insert mode writes through the vault.
            workspace: {
                getActiveViewOfType: mock(() => null),
                getLeavesOfType: mock(() => [])
            },
            metadataCache: {
                getFirstLinkpathDest: mock((linkpath: string) => ({ path: linkpath }))
            }
        } as unknown as App

        const mockOllama: OllamaService = {
            transcribeImage: mockOllamaTranscribe
        } as unknown as OllamaService

        service = new TranscriptionService(mockApp, mockOllama, () => settings)
    })

    describe('isImageFile', () => {
        test('returns true for image files', () => {
            expect(service.isImageFile(createMockFile('photo.png', 'png'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.jpg', 'jpg'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.jpeg', 'jpeg'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.webp', 'webp'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.gif', 'gif'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.bmp', 'bmp'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.avif', 'avif'))).toBe(true)
            expect(service.isImageFile(createMockFile('photo.svg', 'svg'))).toBe(true)
        })

        test('returns false for non-image files', () => {
            expect(service.isImageFile(createMockFile('doc.md', 'md'))).toBe(false)
            expect(service.isImageFile(createMockFile('data.json', 'json'))).toBe(false)
            expect(service.isImageFile(createMockFile('style.css', 'css'))).toBe(false)
        })
    })

    describe('getOutputPath', () => {
        test('replaces extension with .md', () => {
            const file = createMockFile('photos/image.png', 'png')
            expect(service.getOutputPath(file)).toBe('photos/image.md')
        })

        test('handles files with dots in name', () => {
            const file = createMockFile('photos/my.photo.jpg', 'jpg')
            expect(service.getOutputPath(file)).toBe('photos/my.photo.md')
        })

        test('uses the output folder and the file name prefix from the settings', () => {
            settings.outputFolder = '000_incoming'
            settings.outputFilePrefix = 'OCR_'
            const file = createMockFile('media/image.png', 'png')
            expect(service.getOutputPath(file)).toBe('000_incoming/OCR_image.md')
        })
    })

    describe('transcribeFile', () => {
        test('creates markdown file from image', async () => {
            const file = createMockFile('photos/test.png', 'png')
            const result = await service.transcribeFile(file)

            expect(result.success).toBe(true)
            expect(result.sourceFile).toBe('photos/test.png')
            expect(result.outputFile).toBe('photos/test.md')
            expect(result.durationMs).toBeDefined()
        })

        test('skips existing files when overwrite is disabled', async () => {
            mockGetAbstractFileByPath.mockReturnValueOnce({})
            settings.overwriteExisting = false

            const file = createMockFile('photos/test.png', 'png')
            const result = await service.transcribeFile(file)

            expect(result.success).toBe(true)
            expect(result.skipped).toBe(true)
            expect(mockOllamaTranscribe).not.toHaveBeenCalled()
        })

        test('does not report a transcribed file as skipped', async () => {
            const result = await service.transcribeFile(createMockFile('photos/test.png', 'png'))
            expect(result.skipped).toBeUndefined()
            expect(result.inserted).toBeUndefined()
        })

        test('overwrites existing files when enabled', async () => {
            const existingFile = createMockFile('photos/test.md', 'md')
            // When overwriteExisting is true, the first check is skipped entirely.
            // The only getAbstractFileByPath call happens after transcription to decide create vs modify.
            mockGetAbstractFileByPath.mockReturnValue(existingFile)
            settings.overwriteExisting = true

            const file = createMockFile('photos/test.png', 'png')
            await service.transcribeFile(file)

            expect(mockModify).toHaveBeenCalled()
        })

        test('returns error on failure', async () => {
            mockOllamaTranscribe.mockRejectedValueOnce(new Error('Model not found'))

            const file = createMockFile('photos/test.png', 'png')
            const result = await service.transcribeFile(file)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Model not found')
        })
    })

    describe('transcribeFile with an output folder', () => {
        beforeEach(() => {
            settings.outputFolder = 'inbox/ocr'
            settings.outputFilePrefix = 'OCR_'
        })

        test('writes the file to the output folder under the prefixed name', async () => {
            const result = await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(result.success).toBe(true)
            expect(result.outputFile).toBe('inbox/ocr/OCR_test.md')
            expect(mockCreate).toHaveBeenCalledWith('inbox/ocr/OCR_test.md', '# Transcribed')
        })

        test('creates the output folder and the folders above it, outermost first', async () => {
            await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(mockCreateFolder.mock.calls.map((call): unknown => call[0])).toEqual([
                'inbox',
                'inbox/ocr'
            ])
        })

        test('creates no folder that exists', async () => {
            mockGetAbstractFileByPath.mockImplementation((path: string) =>
                path === 'inbox' || path === 'inbox/ocr' ? createMockFolder(path, []) : null
            )

            await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(mockCreateFolder).not.toHaveBeenCalled()
            expect(mockCreate).toHaveBeenCalled()
        })

        test('creates no folder when the file goes next to its image', async () => {
            settings.outputFolder = ''

            await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(mockCreateFolder).not.toHaveBeenCalled()
        })

        test('accepts a folder that another transcription created in the meantime', async () => {
            const created = new Set<string>()
            mockGetAbstractFileByPath.mockImplementation((path: string) =>
                created.has(path) ? createMockFolder(path, []) : null
            )
            mockCreateFolder.mockImplementation((path: string) => {
                // The folder appears, and this call still loses the race.
                created.add(path)
                return Promise.reject(new Error('Folder already exists.'))
            })

            const result = await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(result.success).toBe(true)
            expect(mockCreate).toHaveBeenCalled()
        })

        test('fails when the output folder cannot be created', async () => {
            mockCreateFolder.mockImplementation(() => Promise.reject(new Error('Disk is full')))

            const result = await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(result.success).toBe(false)
            expect(result.error).toBe('Disk is full')
            expect(mockCreate).not.toHaveBeenCalled()
        })

        test('fails when a file has the name of the output folder', async () => {
            mockGetAbstractFileByPath.mockImplementation((path: string) =>
                path === 'inbox' ? createMockFile('inbox', '') : null
            )

            const result = await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(result.success).toBe(false)
            expect(result.error).toBe('The output folder "inbox" is a file')
        })

        test('skips an image whose file exists in the output folder', async () => {
            mockGetAbstractFileByPath.mockImplementation((path: string) =>
                path === 'inbox/ocr/OCR_test.md' ? createMockFile(path, 'md') : null
            )

            const result = await service.transcribeFile(createMockFile('media/test.png', 'png'))

            expect(result.skipped).toBe(true)
            expect(result.outputFile).toBe('inbox/ocr/OCR_test.md')
            expect(mockOllamaTranscribe).not.toHaveBeenCalled()
        })
    })

    describe('transcribeFile in insert mode', () => {
        const image = createMockFile('media/scan.png', 'png')
        const note = createMockFile('notes/Meeting.md', 'md')

        beforeEach(() => {
            settings.insertIntoNote = true
            noteContents[note.path] = '# Meeting\n\n![[media/scan.png]]\n\nNext paragraph\n'
        })

        test('inserts the text after the embed and writes no file', async () => {
            const result = await service.transcribeFile(image, { targetNote: note })

            expect(result).toMatchObject({
                sourceFile: 'media/scan.png',
                outputFile: 'notes/Meeting.md',
                success: true,
                inserted: true
            })
            expect(noteContents[note.path]).toBe(
                '# Meeting\n\n![[media/scan.png]]\n\n# Transcribed\n\nNext paragraph\n'
            )
            expect(mockCreate).not.toHaveBeenCalled()
            expect(mockModify).not.toHaveBeenCalled()
            expect(mockCreateFolder).not.toHaveBeenCalled()
        })

        test('leaves the frontmatter tags out', async () => {
            settings.frontmatterTags = 'scan, ocr'

            await service.transcribeFile(image, { targetNote: note })

            expect(noteContents[note.path]).not.toContain('tags:')
            expect(noteContents[note.path]).not.toContain('---')
        })

        test('is not stopped by an existing transcription file', async () => {
            mockGetAbstractFileByPath.mockReturnValue(createMockFile('media/scan.md', 'md'))
            settings.overwriteExisting = false

            const result = await service.transcribeFile(image, { targetNote: note })

            expect(result.inserted).toBe(true)
            expect(result.skipped).toBeUndefined()
            expect(mockOllamaTranscribe).toHaveBeenCalled()
        })

        test('creates a file when no note is given', async () => {
            const result = await service.transcribeFile(image)

            expect(result.inserted).toBeUndefined()
            expect(result.outputFile).toBe('media/scan.md')
            expect(mockCreate).toHaveBeenCalledWith('media/scan.md', '# Transcribed')
            expect(mockProcess).not.toHaveBeenCalled()

            await service.transcribeFile(image, { targetNote: null })
            expect(mockProcess).not.toHaveBeenCalled()
        })

        test('creates a file when the setting is off, whatever note is given', async () => {
            settings.insertIntoNote = false

            const result = await service.transcribeFile(image, { targetNote: note })

            expect(result.inserted).toBeUndefined()
            expect(result.outputFile).toBe('media/scan.md')
            expect(mockProcess).not.toHaveBeenCalled()
        })

        test('reports a failed transcription against the note', async () => {
            mockOllamaTranscribe.mockRejectedValueOnce(new Error('Model not found'))

            const result = await service.transcribeFile(image, { targetNote: note })

            expect(result).toMatchObject({
                success: false,
                outputFile: 'notes/Meeting.md',
                error: 'Model not found'
            })
            expect(mockProcess).not.toHaveBeenCalled()
        })
    })

    describe('ensureFrontmatterTags', () => {
        test('prepends frontmatter when none exists', () => {
            const out = service.ensureFrontmatterTags('# Title\n\nBody.', ['a', 'b'])
            expect(out).toBe('---\ntags:\n  - a\n  - b\n---\n\n# Title\n\nBody.')
        })

        test('adds a tags block when frontmatter exists without tags', () => {
            const md = '---\ntitle: hello\n---\n\nBody.'
            const out = service.ensureFrontmatterTags(md, ['a'])
            expect(out).toBe('---\ntags:\n  - a\ntitle: hello\n---\n\nBody.')
        })

        test('merges only missing tags into existing tags block', () => {
            const md = '---\ntags:\n  - a\n  - b\n---\n\nBody.'
            const out = service.ensureFrontmatterTags(md, ['b', 'c'])
            expect(out).toBe('---\ntags:\n  - c\n  - a\n  - b\n---\n\nBody.')
        })

        test('leaves markdown unchanged when all required tags already present', () => {
            const md = '---\ntags:\n  - a\n  - b\n---\n\nBody.'
            const out = service.ensureFrontmatterTags(md, ['a', 'b'])
            expect(out).toBe(md)
        })

        test('does not interpret $ sequences in tag values (replace-pattern safety)', () => {
            // String.replace with a string replacement treats $& / $1 / $` as
            // special patterns. Tag values containing $ must not be expanded.
            const md = '---\ntitle: hello\n---\n\nBody.'
            const out = service.ensureFrontmatterTags(md, ['my$&tag', 'with$1ref'])
            expect(out).toContain('  - my$&tag')
            expect(out).toContain('  - with$1ref')
            expect(out).toContain('title: hello')
        })
    })

    describe('getImageFilesInFolder', () => {
        test('returns image files in folder', () => {
            const folder = createMockFolder('photos', [
                createMockFile('photos/a.png', 'png'),
                createMockFile('photos/b.md', 'md'),
                createMockFile('photos/c.jpg', 'jpg')
            ])

            const images = service.getImageFilesInFolder(folder, false)
            expect(images.length).toBe(2)
        })

        test('includes subfolders when enabled', () => {
            const subfolder = createMockFolder('photos/sub', [
                createMockFile('photos/sub/nested.png', 'png')
            ])
            const folder = createMockFolder('photos', [
                createMockFile('photos/a.png', 'png'),
                subfolder
            ])

            const images = service.getImageFilesInFolder(folder, true)
            expect(images.length).toBe(2)
        })

        test('excludes subfolders when disabled', () => {
            const subfolder = createMockFolder('photos/sub', [
                createMockFile('photos/sub/nested.png', 'png')
            ])
            const folder = createMockFolder('photos', [
                createMockFile('photos/a.png', 'png'),
                subfolder
            ])

            const images = service.getImageFilesInFolder(folder, false)
            expect(images.length).toBe(1)
        })
    })
})
