import { describe, expect, test } from 'bun:test'
import { processWithConcurrency } from './concurrency'

describe('processWithConcurrency', () => {
    test('processes all items', async () => {
        const items = [1, 2, 3, 4, 5]
        const results = await processWithConcurrency(items, 2, async (n) => n * 2)
        expect(results).toEqual([2, 4, 6, 8, 10])
    })

    test('handles empty array', async () => {
        const results = await processWithConcurrency([], 3, async (n: number) => n)
        expect(results).toEqual([])
    })

    test('respects concurrency limit', async () => {
        let activeTasks = 0
        let maxActiveTasks = 0

        const items = [1, 2, 3, 4, 5, 6]
        await processWithConcurrency(items, 2, async (n) => {
            activeTasks++
            if (activeTasks > maxActiveTasks) {
                maxActiveTasks = activeTasks
            }
            await new Promise((resolve) => setTimeout(resolve, 10))
            activeTasks--
            return n
        })

        expect(maxActiveTasks).toBeLessThanOrEqual(2)
    })

    test('preserves order of results', async () => {
        const items = [3, 1, 2]
        const results = await processWithConcurrency(items, 3, async (n) => {
            await new Promise((resolve) => setTimeout(resolve, n * 10))
            return `item-${n}`
        })
        expect(results).toEqual(['item-3', 'item-1', 'item-2'])
    })
})
