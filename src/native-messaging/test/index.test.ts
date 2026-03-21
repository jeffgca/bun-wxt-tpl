// Tests for native-messaging host (index.ts)
// Runs under Bun's test runner (bun test).
// Bun.file and Bun.write are spied on instead of replacing the read-only global.

import { jest, spyOn, describe, test, expect, beforeEach } from 'bun:test'

// ---------------------------------------------------------------------------
// Mock Bun globals before importing the module
// ---------------------------------------------------------------------------

function makeReadableStream(...chunks) {
	return {
		[Symbol.asyncIterator]() {
			let index = 0
			return {
				async next() {
					if (index < chunks.length) {
						return { value: chunks[index++], done: false }
					}
					return { value: undefined, done: true }
				},
			}
		},
	}
}

// stdinChunks is set per test; Bun.file().stream() reads it at call time.
let stdinChunks = []

// Spy on individual Bun methods instead of replacing the read-only global.
const mockBunWrite = spyOn(Bun, 'write').mockResolvedValue(0)
spyOn(Bun, 'file').mockImplementation((_path) => ({
	stream: () => makeReadableStream(...stdinChunks),
}))

// import.meta.main is false when imported, so the main loop won't run.
const { encodeMessage, getMessage, sendMessage } = await import('../index.ts')

// ---------------------------------------------------------------------------
// Helper: build a Native Messaging framed byte sequence
// ---------------------------------------------------------------------------

function buildFrame(jsonString) {
	const payload = new TextEncoder().encode(jsonString)
	const frame = new Uint8Array(4 + payload.length)
	const view = new DataView(frame.buffer)
	view.setUint32(0, payload.length, /* littleEndian= */ true)
	frame.set(payload, 4)
	return frame
}

// ---------------------------------------------------------------------------
// encodeMessage
// ---------------------------------------------------------------------------

describe('encodeMessage', () => {
	test('encodes a simple object to JSON bytes', () => {
		const result = encodeMessage({ hello: 'world' })
		expect(result).toBeInstanceOf(Uint8Array)
		expect(new TextDecoder().decode(result)).toBe('{"hello":"world"}')
	})

	test('encodes a string value', () => {
		const result = encodeMessage('ping')
		expect(new TextDecoder().decode(result)).toBe('"ping"')
	})

	test('encodes a number', () => {
		const result = encodeMessage(42)
		expect(new TextDecoder().decode(result)).toBe('42')
	})

	test('encodes an array', () => {
		const result = encodeMessage([1, 2, 3])
		expect(new TextDecoder().decode(result)).toBe('[1,2,3]')
	})

	test('returns a Uint8Array with correct byte length', () => {
		const json = '{"key":"value"}'
		const result = encodeMessage({ key: 'value' })
		expect(result.byteLength).toBe(json.length)
	})
})

// ---------------------------------------------------------------------------
// getMessage
// ---------------------------------------------------------------------------

describe('getMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		stdinChunks = []
	})

	test('yields a single complete message delivered in one chunk', async () => {
		const frame = buildFrame('{"action":"ping"}')
		stdinChunks = [frame]

		const messages = []
		for await (const msg of getMessage()) {
			messages.push(msg)
		}

		expect(messages).toHaveLength(1)
		expect(new TextDecoder().decode(messages[0])).toBe('{"action":"ping"}')
	})

	test('yields multiple messages from a single stream', async () => {
		const frame1 = buildFrame('{"id":1}')
		const frame2 = buildFrame('{"id":2}')
		const combined = new Uint8Array(frame1.length + frame2.length)
		combined.set(frame1, 0)
		combined.set(frame2, frame1.length)
		stdinChunks = [combined]

		const messages = []
		for await (const msg of getMessage()) {
			messages.push(msg)
		}

		expect(messages).toHaveLength(2)
		expect(new TextDecoder().decode(messages[0])).toBe('{"id":1}')
		expect(new TextDecoder().decode(messages[1])).toBe('{"id":2}')
	})

	test('reassembles a message split across multiple chunks', async () => {
		const frame = buildFrame('{"split":true}')
		// Split: header in first chunk, payload split across two more
		const header = frame.subarray(0, 4)
		const payloadPartA = frame.subarray(4, 4 + 7)
		const payloadPartB = frame.subarray(4 + 7)
		stdinChunks = [header, payloadPartA, payloadPartB]

		const messages = []
		for await (const msg of getMessage()) {
			messages.push(msg)
		}

		expect(messages).toHaveLength(1)
		expect(new TextDecoder().decode(messages[0])).toBe('{"split":true}')
	})

	test('yields no messages for an empty stream', async () => {
		stdinChunks = []

		const messages = []
		for await (const msg of getMessage()) {
			messages.push(msg)
		}

		expect(messages).toHaveLength(0)
	})
})

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe('sendMessage', () => {
	beforeEach(() => {
		mockBunWrite.mockClear()
	})

	test('writes a 4-byte little-endian length header followed by the payload', async () => {
		const payload = new TextEncoder().encode('{"response":"ok"}')
		await sendMessage(payload)

		expect(mockBunWrite).toHaveBeenCalledTimes(2)

		// First call: Uint32Array length prefix
		const [, lengthArg] = mockBunWrite.mock.calls[0]
		expect(lengthArg).toBeInstanceOf(Uint32Array)
		expect(lengthArg[0]).toBe(payload.length)

		// Second call: the payload itself
		const [, payloadArg] = mockBunWrite.mock.calls[1]
		expect(payloadArg).toBe(payload)
	})

	test('writes to Bun.stdout', async () => {
		const payload = new Uint8Array([1, 2, 3])
		await sendMessage(payload)

		expect(mockBunWrite.mock.calls[0][0]).toBe(Bun.stdout)
		expect(mockBunWrite.mock.calls[1][0]).toBe(Bun.stdout)
	})
})
