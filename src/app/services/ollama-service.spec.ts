import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { OllamaService } from './ollama-service'
import type { FetchFn, RequestFn } from './ollama-service'
import type { RequestUrlResponse } from 'obsidian'
import type { OllamaPullProgress } from '../domain/ollama-types'

function createNdjsonStream(lines: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    const ndjson = lines.map((l) => l + '\n').join('')
    return new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(ndjson))
            controller.close()
        }
    })
}

function createChunkedNdjsonStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
        }
    })
}

describe('OllamaService', () => {
    let service: OllamaService
    let mockRequest: ReturnType<typeof mock<RequestFn>>
    let mockFetch: ReturnType<typeof mock<FetchFn>>

    beforeEach(() => {
        mockRequest = mock<RequestFn>()
        mockFetch = mock<FetchFn>()
        service = new OllamaService('http://localhost:11434', 'qwen3.5:9b', mockRequest, mockFetch)
    })

    describe('testConnection', () => {
        test('returns ok when server responds', async () => {
            mockRequest.mockResolvedValue({
                status: 200,
                json: {
                    models: [
                        {
                            name: 'qwen3.5:9b',
                            model: 'qwen3.5:9b',
                            modified_at: '',
                            size: 0
                        }
                    ]
                }
            } as unknown as RequestUrlResponse)

            const result = await service.testConnection()
            expect(result.ok).toBe(true)
            expect(result.models).toEqual(['qwen3.5:9b'])
        })

        test('returns error when server is unreachable', async () => {
            mockRequest.mockRejectedValue(new Error('Connection refused'))

            const result = await service.testConnection()
            expect(result.ok).toBe(false)
            expect(result.error).toBe('Connection refused')
        })
    })

    describe('listModels', () => {
        test('returns model names', async () => {
            mockRequest.mockResolvedValue({
                status: 200,
                json: {
                    models: [
                        { name: 'model-a', model: 'model-a', modified_at: '', size: 100 },
                        { name: 'model-b', model: 'model-b', modified_at: '', size: 200 }
                    ]
                }
            } as unknown as RequestUrlResponse)

            const models = await service.listModels()
            expect(models).toEqual(['model-a', 'model-b'])
        })

        test('throws on non-ok response', async () => {
            mockRequest.mockResolvedValue({
                status: 404,
                text: 'Not Found'
            } as unknown as RequestUrlResponse)

            try {
                await service.listModels()
                expect.unreachable('Should have thrown')
            } catch (error) {
                expect((error as Error).message).toContain('Ollama server returned 404')
            }
        })
    })

    describe('transcribeImage', () => {
        test('sends correct request and returns content', async () => {
            mockRequest.mockResolvedValue({
                status: 200,
                json: {
                    model: 'qwen3.5:9b',
                    message: { role: 'assistant', content: '# Transcribed content' },
                    done: true
                }
            } as unknown as RequestUrlResponse)

            const imageData: ArrayBuffer = new TextEncoder().encode('fake-image').buffer
            const result = await service.transcribeImage(imageData, 'Transcribe this')

            expect(result).toBe('# Transcribed content')
            expect(mockRequest).toHaveBeenCalledTimes(1)

            const callArgs = mockRequest.mock.calls[0]![0] as {
                url: string
                method: string
                body: string
            }
            expect(callArgs.url).toBe('http://localhost:11434/api/chat')
            expect(callArgs.method).toBe('POST')

            const parsed = JSON.parse(callArgs.body) as { model: string; stream: boolean }
            expect(parsed.model).toBe('qwen3.5:9b')
            expect(parsed.stream).toBe(false)
        })

        test('throws on error response', async () => {
            mockRequest.mockResolvedValue({
                status: 404,
                text: 'model not found'
            } as unknown as RequestUrlResponse)

            const imageData = new ArrayBuffer(0)
            try {
                await service.transcribeImage(imageData, 'test')
                expect.unreachable('Should have thrown')
            } catch (error) {
                expect((error as Error).message).toContain('Ollama returned 404')
            }
        })
    })

    describe('pullModel', () => {
        test('calls onProgress for each NDJSON line', async () => {
            const body = createNdjsonStream([
                '{"status":"pulling manifest"}',
                '{"status":"downloading","digest":"sha256:abc","total":1000,"completed":500}',
                '{"status":"success"}'
            ])

            mockFetch.mockResolvedValue(new Response(body, { status: 200 }))

            const progress: OllamaPullProgress[] = []
            await service.pullModel('test-model', (p) => progress.push(p))

            expect(progress).toHaveLength(3)
            expect(progress[0]!.status).toBe('pulling manifest')
            expect(progress[1]!.status).toBe('downloading')
            expect(progress[1]!.total).toBe(1000)
            expect(progress[1]!.completed).toBe(500)
            expect(progress[2]!.status).toBe('success')
        })

        test('resolves on success status', async () => {
            const body = createNdjsonStream(['{"status":"success"}'])
            mockFetch.mockResolvedValue(new Response(body, { status: 200 }))

            const result = await service.pullModel('test-model')
            expect(result).toBeUndefined()
        })

        test('throws on HTTP error', async () => {
            mockFetch.mockResolvedValue(new Response('model not found', { status: 404 }))

            try {
                await service.pullModel('bad-model')
                expect.unreachable('Should have thrown')
            } catch (error) {
                expect((error as Error).message).toContain('Ollama returned 404')
            }
        })

        test('throws on error status in stream', async () => {
            const body = createNdjsonStream(['{"status":"pulling manifest"}', '{"status":"error"}'])
            mockFetch.mockResolvedValue(new Response(body, { status: 200 }))

            try {
                await service.pullModel('bad-model')
                expect.unreachable('Should have thrown')
            } catch (error) {
                expect((error as Error).message).toContain('Pull failed')
            }
        })

        test('handles partial line buffering across chunks', async () => {
            // Split a JSON line across two chunks
            const body = createChunkedNdjsonStream([
                '{"status":"pulling',
                ' manifest"}\n{"status":"success"}\n'
            ])

            mockFetch.mockResolvedValue(new Response(body, { status: 200 }))

            const progress: OllamaPullProgress[] = []
            await service.pullModel('test-model', (p) => progress.push(p))

            expect(progress).toHaveLength(2)
            expect(progress[0]!.status).toBe('pulling manifest')
            expect(progress[1]!.status).toBe('success')
        })

        test('sends correct request to Ollama API', async () => {
            const body = createNdjsonStream(['{"status":"success"}'])
            mockFetch.mockResolvedValue(new Response(body, { status: 200 }))

            await service.pullModel('qwen3.5:9b')

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, options] = mockFetch.mock.calls[0]! as [string, RequestInit]
            expect(url).toBe('http://localhost:11434/api/pull')
            expect(options.method).toBe('POST')
            const parsedBody = JSON.parse(options.body as string) as {
                model: string
                stream: boolean
            }
            expect(parsedBody.model).toBe('qwen3.5:9b')
            expect(parsedBody.stream).toBe(true)
        })
    })

    describe('updateConfig', () => {
        test('updates base URL and model', async () => {
            mockRequest.mockResolvedValue({
                status: 200,
                json: { models: [] }
            } as unknown as RequestUrlResponse)

            service.updateConfig('http://remote:11434', 'qwen3.5:2b')
            await service.listModels()

            const callArgs = mockRequest.mock.calls[0]![0] as { url: string }
            expect(callArgs.url).toBe('http://remote:11434/api/tags')
        })
    })
})
