<script>
	import { onMount } from 'svelte'

	import { createProxyService } from '@webext-core/proxy-service'
	import { TEST_SERVICE_KEY } from '../background/keys'
	import { JsonView } from '@zerodevx/svelte-json-view'

	// 5. Get a proxy of your service
	const testService = createProxyService(TEST_SERVICE_KEY)

	let loadingLabel = 'Loading...'
	let json = $state([])

	let result = loadingLabel

	async function foo() {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve('Hello from foo!')
			}, 200)
		})
	}

	let result2 = await foo()
	console.log('result2', result2)

	function handleClick() {
		json = {}
		testService
			.fetchData()
			.then((res) => {
				json = res
			})
			.catch((err) => {
				json = { error: err.message }
			})
	}

	onMount(async () => {
		setTimeout(async () => {
			result = await testService.sayHello()
			console.log('testService', result)
		}, 1000)
	})
</script>

<div class="main">
	<div class="prose">
		<h1 class="">This is tab.svelte</h1>
		<p class="">The result from the background service is: {result}</p>
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
