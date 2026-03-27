<script>
	import { onMount } from 'svelte'

	import { createProxyService } from '@webext-core/proxy-service'
	import { TEST_SERVICE_KEY } from '../background/keys'
	import { JsonView } from '@zerodevx/svelte-json-view'

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
		}
	})

	function handleClick() {
		json = {}

		testService
			.fetchData()
			.then((res) => {
				json = res
			})
			.catch((err) => {
				console.error('Error fetching data:', err)
				json = { error: err.message }
			})
	}

	onMount(async () => {
		result = 'Loading from onMount...'

		// browser.runtime.sendMessage({
		// 	type: 'PING_FROM_TAB',
		// 	payload: 'Hello from the tab!',
		// 	timestamp: Date.now(),
		// })

		let isConnected = await testService.testConnection()
		connectedLabel = isConnected ? emoji.yes : emoji.no

		setTimeout(async () => {
			console.log('saying hello?')
			result = await testService.sayHello()
			console.log('testService', result)
		}, 500)
	})
</script>

<div class="main">
	<div class="prose">
		<h1>This is tab.svelte</h1>
		<p>The result from the background service is: {result}</p>

		<p>Are we connected? {connectedLabel}</p>
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
