export interface TranscriptionResult {
    sourceFile: string
    outputFile: string
    success: boolean
    error?: string
    durationMs?: number
}
