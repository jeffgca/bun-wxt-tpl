<script>
	import { onMount } from 'svelte'

	import { createProxyService } from '@webext-core/proxy-service'
	import { TEST_SERVICE_KEY } from '../background/keys'
	import { JsonView } from '@zerodevx/svelte-json-view'

	let currentRecord = $state({})

	// 5. Get a proxy of your service
	const testService = createProxyService(TEST_SERVICE_KEY)

	const emoji = {
		yes: '✅',
		no: '❌',
	}

	let connectedLabel = $state(emoji.no)

	$inspect(connectedLabel)

	let result = $state('Loading...')
	let json = $state([])

	let appState = $state({
		count: 0,
		isConnected: false,
	})

	browser.runtime.onMessage.addListener((message) => {
		console.log('message from backghround', message)
		if (message.type === 'PONG_FROM_BACKGROUND') {
			console.log('Received message in tab:', message.payload)
		} else if (message.type === 'RECORD_LOADED') {
			console.log('Record updated message received in tab:', message.payload)
			currentRecord = message.payload.data
		} else if (message.type === 'RECORDS_LOADED') {
			console.log('Records loaded message received in tab:', message.payload)
			json = message.payload.data
		}
	})

	function handleClick() {
		json = {}

		browser.runtime.sendMessage({
			type: 'LOAD_RECORDS',
			src: 'tab',
			target: 'background',
		})
	}

	onMount(async () => {
		console.log('in onMount')
		result = 'Loading from onMount...'

		let isConnected = await testService.testConnection()
		// console.log('XXX isConnected', isConnected)
		connectedLabel = isConnected ? emoji.yes : emoji.no

		setTimeout(async () => {
			console.log('saying hello?')
			result = await testService.sayHello()
			console.log('testService', result)
		}, 500)

		browser.runtime.sendMessage({
			type: 'PING_FROM_TAB',
			src: 'tab',
			target: 'background',
		})

		browser.runtime.sendMessage({
			type: 'LOAD_RECORDS',
			src: 'tab',
			target: 'background',
		})

		browser.runtime.sendMessage({
			type: 'LOAD_RECORD',
			src: 'tab',
			target: 'background',
			data: currentRecord,
		})
	})
</script>

<div class="main">
	<div class="prose">
		<h1>This is tab.svelte</h1>
		<p>The result from the background service is: {result}</p>

		<p>Are we connected? {connectedLabel}</p>
	</div>

	<div>
		<h2>Current Record:</h2>
		<JsonView json={currentRecord} />
	</div>
	<button class="btn" onclick={handleClick}>Click</button>

	<div class="data-view">
		<JsonView {json} />
	</div>
</div>

<style>
	.main {
		padding: 1rem;
	}

	.data-view {
		margin-top: 1rem;
	}
</style>
