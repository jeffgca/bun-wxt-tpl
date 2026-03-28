import { openOrFocusTab } from './utils'
import { onMessage } from 'webext-bridge/background'
import { registerService } from '@webext-core/proxy-service'
import { TestService } from './utils'
import { TEST_SERVICE_KEY } from './keys'
import App from './app'

let loopOneCounter = 0,
	loop = false

const IS_FIREFOX = import.meta.env.BROWSER === 'firefox'

export default defineBackground(() => {
	// // 3. Instantiate your service
	const testService = new TestService()
	// let remoteData = []

	// // 4. Register the service BEFORE awaiting anything
	registerService(TEST_SERVICE_KEY, testService)
	/**
	 * Example of handling browser action clicks to open or focus a tab with our page. You can remove this if you don't need it, but it's a common pattern in extensions so I included it as a starting point.
	 */
	function actionHandler(event) {
		const tabUrl = browser.runtime.getURL('/tab.html')
		// Query all tabs to find if one with our page is already open
		browser.tabs.query({}).then((tabs) => {
			const existingTab = tabs.find((tab) => tab.url === tabUrl)
			if (existingTab && existingTab.id) {
				// Tab already open - switch to it
				browser.tabs.update(existingTab.id, { active: true })
				// Also bring the window to focus if the tab is in a different window
				if (existingTab.windowId) {
					browser.windows.update(existingTab.windowId, { focused: true })
				}
			} else {
				// Tab not open - create a new one
				browser.tabs.create({
					url: tabUrl,
				})
			}
		})
	}

	/**
	 * attach the click handler to the browser action (toolbar button). This uses optional chaining to support both Manifest V2 and V3 APIs (browser.browserAction vs browser.action).
	 */
	;(browser.action ?? browser.browser_action).onClicked.addListener(
		actionHandler,
	)

	let service = new TestService(),
		allData = []

	service.fetchData().then((data) => {
		console.log('XXX', data)
		allData = data
	})

	let loop = setInterval(() => {
		console.log('Looping...', ++loopOneCounter)

		let currentRecord = allData[Math.floor(Math.random() * allData.length)]

		browser.runtime.sendMessage({
			type: 'RECORD_UPDATED',
			payload: {
				timestamp: Date.now(),
				data: currentRecord,
			},
		})
	}, 5000)

	browser.runtime.onMessage.addListener((message) => {
		console.log('Message received in background:', message)
		if (message.type === 'PING_FROM_TAB') {
			console.log('Received PING_FROM_TAB message:', message.payload)
			browser.runtime.sendMessage({
				type: 'PONG_FROM_BACKGROUND',
				payload: {
					timestamp: Date.now(),
					data: 'Hello from the background!',
				},
			})
		} else if (message.type === 'LOAD_RECORDS') {
			console.log('Received LOAD_RECORDS message')

			browser.runtime.sendMessage({
				type: 'RECORDS_LOADED',
				payload: {
					timestamp: Date.now(),
					data: allData, // Send the full dataset back to the tab
				},
			})
		}
	})

	// const app = new App()

	// // 3. Instantiate your service
	// const testService = new TestService()
	// let remoteData = []

	// // 4. Register the service BEFORE awaiting anything
	// registerService(TEST_SERVICE_KEY, testService)

	// testService.on('recordUpdated', (message, data) => {
	// 	console.log('Record updated event received in background:', message, data)

	// 	browser.runtime.sendMessage({
	// 		type: 'RECORD_UPDATED',
	// 		payload: {
	// 			timestamp: Date.now(),
	// 			data: remoteData[Math.floor(Math.random() * remoteData.length)],
	// 		},
	// 	})
	// })

	// testService.fetchData().then((result) => {
	// 	console.log('Data from TestService:', result)
	// 	remoteData = result
	// })

	// app.onTimer((event) => {
	// 	const { timerId, name, scheduledAt, triggeredAt, data } = event.detail
	// 	console.log('Timer triggered', {
	// 		timerId,
	// 		name,
	// 		scheduledAt,
	// 		triggeredAt,
	// 		elapsedMs: triggeredAt - scheduledAt,
	// 		data,
	// 	})
	// })

	// app.onInterval((event) => {
	// 	testService.setRecord(
	// 		remoteData[Math.floor(Math.random() * remoteData.length)],
	// 	)
	// 	// const { intervalId, name, startedAt, triggeredAt, tick, data } =
	// 	// 	event.detail
	// 	// console.log('Interval triggered', {
	// 	// 	intervalId,
	// 	// 	name,
	// 	// 	startedAt,
	// 	// 	triggeredAt,
	// 	// 	tick,
	// 	// 	elapsedMs: triggeredAt - startedAt,
	// 	// 	data,
	// 	// })

	// 	browser.runtime.sendMessage({
	// 		type: 'RECORD_UPDATED',
	// 		payload: {
	// 			timestamp: Date.now(),
	// 			data: remoteData[Math.floor(Math.random() * remoteData.length)],
	// 		},
	// 	})
	// })

	// // app.startTimer(2000, {
	// // 	name: 'background-startup-timer',
	// // 	data: { source: 'background-init' },
	// // })

	// app.startInterval(5000, {
	// 	name: 'background-heartbeat',
	// 	data: { source: 'background-init' },
	// })

	// console.log(
	// 	'Hello background!',
	// 	{ id: browser.runtime.id },
	// 	{ isFirefox: IS_FIREFOX },
	// )
})
