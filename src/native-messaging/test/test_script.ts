import { spawn } from 'node:child_process'
import { once } from 'node:events'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function frameMessage(message) {
	const payload = encoder.encode(JSON.stringify(message))
	const framed = new Uint8Array(4 + payload.length)
	const view = new DataView(framed.buffer)
	view.setUint32(0, payload.length, true)
	framed.set(payload, 4)
	return framed
}

function parseFrames(buffer) {
	const messages = []
	let offset = 0

	while (offset + 4 <= buffer.length) {
		const view = new DataView(
			buffer.buffer,
			buffer.byteOffset + offset,
			buffer.length - offset,
		)
		const messageLength = view.getUint32(0, true)
		if (offset + 4 + messageLength > buffer.length) {
			break
		}

		const payload = buffer.subarray(offset + 4, offset + 4 + messageLength)
		messages.push(JSON.parse(decoder.decode(payload)))
		offset += 4 + messageLength
	}

	return {
		messages,
		pending: buffer.subarray(offset),
	}
}

const indexPath = new URL('../index.ts', import.meta.url).pathname

async function main() {
	const child = spawn('bun', ['run', indexPath], {
		cwd: process.cwd(),
		stdio: ['pipe', 'pipe', 'pipe'],
	})

	const requests = [
		{ id: 1, action: 'ping' },
		{ id: 2, action: 'echo', payload: [1, 2, 3] },
	]

	let stdoutBuffer = new Uint8Array(0)
	const responses = []

	child.stdout.on('data', (chunk) => {
		const merged = new Uint8Array(stdoutBuffer.length + chunk.length)
		merged.set(stdoutBuffer, 0)
		merged.set(chunk, stdoutBuffer.length)
		const parsed = parseFrames(merged)
		responses.push(...parsed.messages)
		stdoutBuffer = parsed.pending
	})

	let stderr = ''
	child.stderr.on('data', (chunk) => {
		stderr += chunk.toString()
	})

	for (const request of requests) {
		console.log('request', request)
		child.stdin.write(frameMessage(request))
	}
	child.stdin.end()

	const [exitCode] = await once(child, 'exit')

	if (exitCode !== 0) {
		throw new Error(`nm_bun.js exited with code ${exitCode}\n${stderr}`)
	}

	if (stdoutBuffer.length !== 0) {
		throw new Error(
			`Received incomplete response frame (${stdoutBuffer.length} trailing bytes)`,
		)
	}

	if (responses.length !== requests.length) {
		throw new Error(
			`Expected ${requests.length} responses but received ${responses.length}\n${JSON.stringify(responses, null, 2)}`,
		)
	}

	if (responses[0].action !== 'pong' || responses[0].id !== 1) {
		throw new Error(
			`Unexpected response to ping: ${JSON.stringify(responses[0])}`,
		)
	}

	if (
		responses[1].length !== 3 ||
		responses[1][0] !== 1 ||
		responses[1][1] !== 2 ||
		responses[1][2] !== 3
	) {
		throw new Error(
			`Unexpected response to echo: ${JSON.stringify(responses[1])}`,
		)
	}

	console.log('stdio integration test passed')
}

main().catch((error) => {
	console.error(error.message)
	process.exit(1)
})
