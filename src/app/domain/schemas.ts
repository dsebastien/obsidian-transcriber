import { z } from 'zod'

export const ollamaChatMessageSchema = z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
})

export const ollamaChatResponseSchema = z.object({
    model: z.string(),
    message: ollamaChatMessageSchema,
    done: z.boolean()
})

export const ollamaModelInfoSchema = z.object({
    name: z.string(),
    model: z.string(),
    modified_at: z.string(),
    size: z.number()
})

export const ollamaTagsResponseSchema = z.object({
    models: z.array(ollamaModelInfoSchema)
})
