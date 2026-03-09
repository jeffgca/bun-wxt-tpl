<script>
	import { onMount } from 'svelte'

	import { createProxyService } from '@webext-core/proxy-service'
	import { TEST_SERVICE_KEY } from '../background/keys'

	// 5. Get a proxy of your service
	const testService = createProxyService(TEST_SERVICE_KEY)

	onMount(async () => {
		// 6. Use the service as if it were local!
		console.log('testService', await testService.sayHello())
	})
</script>

<h1>This is tab.svelte</h1>
