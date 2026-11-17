import { describe, expect, test } from 'bun:test'
import { describeResult } from './transcription-notices'

describe('describeResult', () => {
    test('says where the transcription file is', () => {
        expect(
            describeResult('scan.png', {
                sourceFile: 'media/scan.png',
                outputFile: '000_incoming/OCR_scan.md',
                success: true
            })
        ).toBe('Transcribed scan.png. Output: 000_incoming/OCR_scan.md')
    })

    test('names the note the text was inserted into', () => {
        expect(
            describeResult('scan.png', {
                sourceFile: 'media/scan.png',
                outputFile: 'notes/Meeting.md',
                success: true,
                inserted: true
            })
        ).toBe('Transcribed scan.png. Inserted into: notes/Meeting.md')
    })

    test('says so when the file existed and nothing was transcribed', () => {
        expect(
            describeResult('scan.png', {
                sourceFile: 'media/scan.png',
                outputFile: 'media/scan.md',
                success: true,
                skipped: true
            })
        ).toBe('Skipped scan.png, already transcribed. Output: media/scan.md')
    })

    test('gives the error of a failed transcription', () => {
        expect(
            describeResult('scan.png', {
                sourceFile: 'media/scan.png',
                outputFile: 'media/scan.md',
                success: false,
                error: 'Ollama is not running'
            })
        ).toBe('Failed to transcribe scan.png: Ollama is not running')
    })
})
