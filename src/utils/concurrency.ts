export async function processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = []
    let index = 0

    async function runNext(): Promise<void> {
        while (index < items.length) {
            const currentIndex = index
            index++
            const item = items[currentIndex]!
            const result = await processor(item)
            results[currentIndex] = result
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext())
    await Promise.all(workers)
    return results
}
