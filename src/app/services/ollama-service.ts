import { requestUrl } from 'obsidian'
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian'
import { log } from '../../utils/log'
import { arrayBufferToBase64 } from '../../utils/base64'
import { ollamaChatResponseSchema, ollamaTagsResponseSchema } from '../domain/schemas'
import type {
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaTagsResponse
} from '../domain/ollama-types'

export type RequestFn = (request: RequestUrlParam | string) => Promise<RequestUrlResponse>

export interface ConnectionTestResult {
    ok: boolean
    error?: string
    models?: string[]
}

export class OllamaService {
    private baseUrl: string
    private modelName: string
    private readonly requestFn: RequestFn

    constructor(baseUrl: string, modelName: string, requestFn?: RequestFn) {
        this.baseUrl = baseUrl
        this.modelName = modelName
        this.requestFn = requestFn ?? requestUrl
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

        log(`Sending transcription request to ${this.baseUrl}`, 'debug')

        const response = await this.requestFn({
            url: `${this.baseUrl}/api/chat`,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify(requestBody),
            throw: false
        })

        if (response.status !== 200) {
            throw new Error(`Ollama returned ${response.status}: ${response.text}`)
        }

        const data: unknown = response.json
        const parsed: OllamaChatResponse = ollamaChatResponseSchema.parse(data)
        return parsed.message.content
    }
}
