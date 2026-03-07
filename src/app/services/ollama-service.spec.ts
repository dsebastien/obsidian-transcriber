import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { OllamaService } from './ollama-service'
import type { RequestFn } from './ollama-service'
import type { RequestUrlResponse } from 'obsidian'

describe('OllamaService', () => {
    let service: OllamaService
    let mockRequest: ReturnType<typeof mock<RequestFn>>

    beforeEach(() => {
        mockRequest = mock<RequestFn>()
        service = new OllamaService('http://localhost:11434', 'qwen3.5:9b', mockRequest)
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
