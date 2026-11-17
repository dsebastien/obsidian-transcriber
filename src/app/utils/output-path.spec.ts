import { describe, expect, test } from 'bun:test'
import {
    buildOutputPath,
    folderAncestry,
    isValidFileNamePrefix,
    normalizeFolderPath
} from './output-path'

describe('buildOutputPath', () => {
    test('keeps the file next to the image when no folder and no prefix are set', () => {
        expect(buildOutputPath('photos/image.png', 'png', '', '')).toBe('photos/image.md')
        expect(buildOutputPath('image.png', 'png', '', '')).toBe('image.md')
    })

    test('keeps dots that belong to the image name', () => {
        expect(buildOutputPath('photos/my.photo.jpg', 'jpg', '', '')).toBe('photos/my.photo.md')
    })

    test('sends every transcription to the output folder', () => {
        expect(buildOutputPath('media/a/image.png', 'png', '000_incoming', '')).toBe(
            '000_incoming/image.md'
        )
        expect(buildOutputPath('image.png', 'png', 'notes/ocr', '')).toBe('notes/ocr/image.md')
    })

    test('normalizes the output folder before using it', () => {
        expect(buildOutputPath('media/image.png', 'png', ' /notes\\ocr/ ', '')).toBe(
            'notes/ocr/image.md'
        )
    })

    test('treats a blank or root output folder as "next to the image"', () => {
        expect(buildOutputPath('media/image.png', 'png', '   ', '')).toBe('media/image.md')
        expect(buildOutputPath('media/image.png', 'png', '/', '')).toBe('media/image.md')
    })

    test('puts the prefix in front of the image name, with or without an output folder', () => {
        expect(buildOutputPath('media/image.png', 'png', '', 'OCR_')).toBe('media/OCR_image.md')
        expect(buildOutputPath('media/image.png', 'png', 'inbox', 'OCR_')).toBe(
            'inbox/OCR_image.md'
        )
        expect(buildOutputPath('image.png', 'png', '', 'OCR ')).toBe('OCR image.md')
    })
})

describe('normalizeFolderPath', () => {
    test('gives the vault root as an empty string', () => {
        expect(normalizeFolderPath('')).toBe('')
        expect(normalizeFolderPath('  ')).toBe('')
        expect(normalizeFolderPath('/')).toBe('')
        expect(normalizeFolderPath('.')).toBe('')
    })

    test('drops outer slashes, empty segments and backslashes', () => {
        expect(normalizeFolderPath('/a//b/')).toBe('a/b')
        expect(normalizeFolderPath('a\\b')).toBe('a/b')
        expect(normalizeFolderPath(' a / b ')).toBe('a/b')
    })
})

describe('folderAncestry', () => {
    test('lists each folder to create, outermost first', () => {
        expect(folderAncestry('a/b/c')).toEqual(['a', 'a/b', 'a/b/c'])
        expect(folderAncestry('a')).toEqual(['a'])
    })

    test('lists nothing for the vault root', () => {
        expect(folderAncestry('')).toEqual([])
        expect(folderAncestry('/')).toEqual([])
    })
})

describe('isValidFileNamePrefix', () => {
    test('accepts text that can be part of a file name', () => {
        expect(isValidFileNamePrefix('')).toBe(true)
        expect(isValidFileNamePrefix('OCR_')).toBe(true)
        expect(isValidFileNamePrefix('Scan - ')).toBe(true)
    })

    test('refuses path separators and characters a file name cannot hold', () => {
        for (const prefix of ['a/', 'a\\', 'a:', 'a*', 'a?', 'a"', 'a<', 'a>', 'a|']) {
            expect(isValidFileNamePrefix(prefix)).toBe(false)
        }
    })
})
