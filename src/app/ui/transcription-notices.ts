import { Notice } from 'obsidian'
import type { TranscriptionResult } from '../domain/transcription-result'

/**
 * How long the result of one transcription stays on screen. Longer than the
 * default notice: the message says where the text went, which is the part to
 * read.
 */
export const RESULT_NOTICE_DURATION_MS = 10_000

/** What one transcription did, and where its text is. */
export function describeResult(fileName: string, result: TranscriptionResult): string {
    if (!result.success) {
        return `Failed to transcribe ${fileName}: ${result.error ?? 'Unknown error'}`
    }
    if (result.inserted === true) {
        return `Transcribed ${fileName}. Inserted into: ${result.outputFile}`
    }
    if (result.skipped === true) {
        return `Skipped ${fileName}, already transcribed. Output: ${result.outputFile}`
    }
    return `Transcribed ${fileName}. Output: ${result.outputFile}`
}

/** Show the result of one transcription. */
export function showResultNotice(fileName: string, result: TranscriptionResult): void {
    new Notice(describeResult(fileName, result), RESULT_NOTICE_DURATION_MS)
}
