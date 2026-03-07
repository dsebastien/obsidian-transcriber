import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { TranscriptionService } from './transcription-service'
import type { OllamaService } from './ollama-service'
import type { PluginSettings } from '../types/plugin-settings.intf'
import { DEFAULT_SETTINGS } from '../types/plugin-settings.intf'
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

    beforeEach(() => {
        settings = { ...DEFAULT_SETTINGS }

        mockGetAbstractFileByPath = mock(() => null)
        mockModify = mock(() => Promise.resolve())
        mockOllamaTranscribe = mock(() => Promise.resolve('# Transcribed'))

        mockApp = {
            vault: {
                readBinary: mock(() => Promise.resolve(new ArrayBuffer(10))),
                create: mock(() => Promise.resolve(createMockFile('out.md', 'md'))),
                modify: mockModify,
                getAbstractFileByPath: mockGetAbstractFileByPath
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
            expect(mockOllamaTranscribe).not.toHaveBeenCalled()
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
