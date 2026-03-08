import { requestUrl } from 'obsidian'
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian'
import { log } from '../../utils/log'
import { arrayBufferToBase64 } from '../../utils/base64'
import {
    ollamaChatResponseSchema,
    ollamaPullProgressSchema,
    ollamaTagsResponseSchema
} from '../domain/schemas'
import type {
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaPullProgress,
    OllamaTagsResponse
} from '../domain/ollama-types'

export type RequestFn = (request: RequestUrlParam | string) => Promise<RequestUrlResponse>
export type FetchFn = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface ConnectionTestResult {
    ok: boolean
    error?: string
    models?: string[]
}

export class OllamaService {
    private baseUrl: string
    private modelName: string
    private readonly requestFn: RequestFn
    private readonly fetchFn: FetchFn

    constructor(baseUrl: string, modelName: string, requestFn?: RequestFn, fetchFn?: FetchFn) {
        this.baseUrl = baseUrl
        this.modelName = modelName
        this.requestFn = requestFn ?? requestUrl
        this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis)
    }

    updateConfig(baseUrl: string, modelName: string): void {
        this.baseUrl = baseUrl
        this.modelName = modelName
    }

    async testConnection(): Promise<ConnectionTestResult> {
        try {
            const models = await this.listModels()
            return { ok: true, models }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            return { ok: false, error: message }
        }
    }

    async listModels(): Promise<string[]> {
        const response = await this.requestFn({
            url: `${this.baseUrl}/api/tags`,
            method: 'GET',
            throw: false
        })

        if (response.status !== 200) {
            throw new Error(`Ollama server returned ${response.status}`)
        }

        const data: unknown = response.json
        const parsed: OllamaTagsResponse = ollamaTagsResponseSchema.parse(data)
        return parsed.models.map((m) => m.name)
    }

    async pullModel(
        modelName: string,
        onProgress?: (progress: OllamaPullProgress) => void
    ): Promise<void> {
        log(`Pulling model ${modelName} from ${this.baseUrl}`, 'debug')

        // Use fetch (not requestUrl) because requestUrl doesn't support streaming responses
        const response = await this.fetchFn(`${this.baseUrl}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName, stream: true })
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Ollama returned ${response.status}: ${text}`)
        }

        if (!response.body) {
            throw new Error('Response body is empty')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
            const { done, value } = await reader.read()

            if (done) {
                break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            // Keep last (potentially incomplete) line in buffer
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue

                const json: unknown = JSON.parse(trimmed)
                const progress: OllamaPullProgress = ollamaPullProgressSchema.parse(json)

                if (onProgress) {
                    onProgress(progress)
                }

                if (progress.status === 'error') {
                    throw new Error(`Pull failed: ${trimmed}`)
                }
            }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
            const json: unknown = JSON.parse(buffer.trim())
            const progress: OllamaPullProgress = ollamaPullProgressSchema.parse(json)
            if (onProgress) {
                onProgress(progress)
            }
        }

        log(`Model ${modelName} pulled successfully`, 'debug')
    }

    async transcribeImage(imageData: ArrayBuffer, prompt: string): Promise<string> {
        const base64Image = arrayBufferToBase64(imageData)

        const requestBody: OllamaChatRequest = {
            model: this.modelName,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                    images: [base64Image]
                }
            ],
            stream: false
        }

        log(
            `Sending transcription request to ${this.baseUrl}/api/chat (model: ${this.modelName})`,
            'debug'
        )

        const response = await this.requestFn({
            url: `${this.baseUrl}/api/chat`,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify(requestBody),
            throw: false
        })

        log(`Received response with status ${response.status}`, 'debug')

        if (response.status !== 200) {
            throw new Error(`Ollama returned ${response.status}: ${response.text}`)
        }

        const data: unknown = response.json
        const parsed: OllamaChatResponse = ollamaChatResponseSchema.parse(data)
        return parsed.message.content
    }
}
