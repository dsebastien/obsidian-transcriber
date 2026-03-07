export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
    images?: string[]
}

export interface OllamaChatRequest {
    model: string
    messages: OllamaChatMessage[]
    stream: false
}

export interface OllamaChatResponse {
    model: string
    message: OllamaChatMessage
    done: boolean
}

export interface OllamaModelInfo {
    name: string
    model: string
    modified_at: string
    size: number
}

export interface OllamaTagsResponse {
    models: OllamaModelInfo[]
}
