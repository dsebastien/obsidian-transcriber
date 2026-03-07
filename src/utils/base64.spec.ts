import { describe, expect, test } from 'bun:test'
import { arrayBufferToBase64 } from './base64'

describe('arrayBufferToBase64', () => {
    test('converts an empty buffer', () => {
        const buffer = new ArrayBuffer(0)
        expect(arrayBufferToBase64(buffer)).toBe('')
    })

    test('converts a simple buffer to base64', () => {
        const encoder = new TextEncoder()
        const buffer: ArrayBuffer = encoder.encode('Hello').buffer
        expect(arrayBufferToBase64(buffer)).toBe(btoa('Hello'))
    })

    test('converts binary data correctly', () => {
        const bytes = new Uint8Array([0, 1, 2, 255, 254, 253])
        const result = arrayBufferToBase64(bytes.buffer)
        // Verify round-trip
        const decoded = atob(result)
        expect(decoded.length).toBe(6)
        expect(decoded.charCodeAt(0)).toBe(0)
        expect(decoded.charCodeAt(3)).toBe(255)
    })
})
