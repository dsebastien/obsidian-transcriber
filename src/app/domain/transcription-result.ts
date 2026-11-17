export interface TranscriptionResult {
    sourceFile: string
    /**
     * The note that holds the transcription: the transcription file, or the
     * note the text was inserted into when `inserted` is true.
     */
    outputFile: string
    success: boolean
    /** The transcription file already existed and was left as it is. */
    skipped?: boolean
    /** The text went into an existing note; no transcription file was written. */
    inserted?: boolean
    error?: string
    durationMs?: number
}
