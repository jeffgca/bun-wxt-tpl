<script>
	import { onMount } from 'svelte'
	import { JsonView } from '@zerodevx/svelte-json-view'

	import { setContext } from 'svelte'

	let currentRecord = $state({})

	let appState = $state({
		count: 0,
		isConnected: false,
		data: [],
	})

	setContext('appState', appState)

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

		let connectedLabel = $state(emoji.no)

		// $inspect(connectedLabel)

		let result = $state('Loading...')
		let json = $state([])

		// let appState = $state({
		// 	count: 0,
		// 	isConnected: false,
		// })
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
