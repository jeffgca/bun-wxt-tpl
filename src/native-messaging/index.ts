#!/usr/bin/env -S bun run --no-install --smol
// Bun Native Messaging host
// guest271314, 10-9-2022

import { appendFile, exists, writeFile } from 'node:fs/promises'
import path from "node:path";

// Relative to the current file (ESM / TypeScript)
// const abs1 = path.resolve(import.meta.dirname, "./log/output.txt");

let LOGFILE = path.resolve(import.meta.dirname, './log/nm_bun.log')

console.log('LOGFILE', LOGFILE)

let LOGFILE_EXISTS = await exists(LOGFILE)
if (!LOGFILE_EXISTS) {
	await writeFile(LOGFILE, '', 'utf8')
}



writeLog('Starting Native Messaging host...').catch(console.error)

const encoder = new TextEncoder()

export function encodeMessage(message) {
	return encoder.encode(JSON.stringify(message))
}

/**
 * Appends a timestamped log line to a text file.
 * @param {string|object} info - Log content to write.
 * @param {string} filePath - Log file path.
 * @returns {Promise<void>} A promise that resolves when the log line is written.
 */
export async function writeLog(info) {
	const timestamp = new Date().toISOString()
	const content = typeof info === 'string' ? info : JSON.stringify(info)
	await appendFile(LOGFILE, `[${timestamp}] ${content}\n`, 'utf8')
}

/**
 * Asynchronously reads framed messages from stdin, yielding each message as a Uint8Array.
 * Each message is expected to be prefixed with a 4-byte little-endian unsigned integer
 * indicating the length of the message payload that follows.
 */
export async function* getMessage() {
	let pending = new Uint8Array(0)
	for await (const chunk of Bun.file('/dev/stdin').stream()) {
		// writeLog({ receivedChunk: new TextDecoder().decode(chunk) }).catch(console.error);
		const merged = new Uint8Array(pending.length + chunk.length)
		merged.set(pending, 0)
		merged.set(chunk, pending.length)

		let offset = 0
		while (offset + 4 <= merged.length) {
			const view = new DataView(
				merged.buffer,
				merged.byteOffset + offset,
				merged.length - offset,
			)
			const messageLength = view.getUint32(0, true)

			writeLog({ messageLength }).catch(console.error)

			if (offset + 4 + messageLength > merged.length) {
				break
			}

			yield merged.subarray(offset + 4, offset + 4 + messageLength)
			offset += 4 + messageLength
		}

		pending = merged.subarray(offset)

		writeLog({ pendingLength: pending.length }).catch(console.error)
	}
}

/**
 * Asynchronously sends a framed message to stdout. The message is prefixed with a 4-byte
 * little-endian unsigned integer indicating the length of the message payload that follows.
 * @param {Uint8Array} message - The message payload to send,
 * @returns {Promise<void>} A promise that resolves when the message has been sent.
 */
export async function sendMessage(message) {
	await Bun.write(Bun.stdout, new Uint32Array([message.length]))
	await Bun.write(Bun.stdout, message)
}

export function encodeMessage(message) {
	return encoder.encode(JSON.stringify(message))
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

// Only run the message loop when executed directly (not imported by tests)
if (typeof Bun !== 'undefined' && import.meta.main) {
	try {
		for await (const message of getMessage()) {
			// writeLog({ receivedRaw: message }).catch(console.error);
			let decoded = JSON.parse(new TextDecoder().decode(message))
			// writeLog({ received: JSON.parse(decoded) }).catch(console.error);
			// writeLog({ received: message }).catch(console.error);

			writeLog({ 'xxx-decoded': decoded.id }).catch(console.error)

			if (decoded.action === 'ping') {
				decoded = { id: decoded.id, action: 'pong' }
			} else if (decoded.action === 'echo') {
				decoded = decoded.payload
			} else {
				decoded = { error: 'Unknown action' }
			}

			let encoded = Uint8Array.from(encodeMessage(decoded))
			await sendMessage(encoded)
		}
	} catch (e) {
		process.exit()
	}
}
