import { openOrFocusTab } from './utils'
import { onMessage } from 'webext-bridge/background'
import { registerService } from '@webext-core/proxy-service'
import { TestService } from './utils'
import { TEST_SERVICE_KEY } from './keys'
import App from './app'

let loopOneCounter = 0,
	loop = false

const IS_FIREFOX = import.meta.env.BROWSER === 'firefox'

let TAB_IS_OPEN = false,
	TAB_ID = null

export default defineBackground(() => {
	// // 3. Instantiate your service
	const testService = new TestService()
	// let remoteData = []

	// // 4. Register the service BEFORE awaiting anything
	registerService(TEST_SERVICE_KEY, testService)

	const tabUrl = browser.runtime.getURL('/tab.html')

	/**
	 * XXX need to set TAB_IS_OPEN to false when the tab is closed
	 */

	/**
	 * Example of handling browser action clicks to open or focus a tab with our page. You can remove this if you don't need it, but it's a common pattern in extensions so I included it as a starting point.
	 */
	function actionHandler(event) {
		// Query all tabs to find if one with our page is already open
		browser.tabs
			.query({})
			.then((tabs) => {
				const existingTab = tabs.find((tab) => tab.url === tabUrl)
				if (existingTab && existingTab.id) {
					// Tab already open - switch to it
					browser.tabs.update(existingTab.id, { active: true })
					// Also bring the window to focus if the tab is in a different window
					if (existingTab.windowId) {
						console.log('Existing tab found', existingTab, TAB_IS_OPEN)
						browser.windows.update(existingTab.windowId, { focused: true })
					}
				} else {
					// Tab not open - create a new one
					browser.tabs
						.create({
							url: tabUrl,
						})
						.then((tab) => {
							console.log('New tab opened:', tab)
							TAB_ID = tab.id
							TAB_IS_OPEN = true

							// Optionally, you could also listen for when this tab is closed to reset TAB_IS_OPEN
							const tabClosedListener = (closedTabId) => {
								console.log('Fired onclose event')
								if (closedTabId === TAB_ID) {
									TAB_IS_OPEN = false
									TAB_ID = null
									browser.tabs.onRemoved.removeListener(tabClosedListener)
									console.log('Tab closed, state reset')
								}
							}
							browser.tabs.onRemoved.addListener(tabClosedListener)
						})
						.catch((error) => {
							console.error('Error opening tab:', error)
							// Fallback: open the tab without trying to focus
							// browser.tabs.create({ url: tabUrl })
						})
				}
			})
			.finally((event) => {
				console.log('XXX in finally after tab open')
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

		console.log('currentRecord', currentRecord)

		service.setRecord(currentRecord)

		if (TAB_IS_OPEN) {
			browser.runtime.sendMessage({
				type: 'RECORD_LOADED',
				payload: {
					timestamp: Date.now(),
					data: currentRecord,
				},
			})
		}
	}, 5000)

	browser.runtime.onMessage.addListener((message) => {
		console.log('???', message.type)
		// console.log('Message received in background:', message)
		if (message.type === 'LOAD_RECORDS') {
			console.log('Received LOAD_RECORDS message')

			browser.runtime.sendMessage({
				type: 'RECORDS_LOADED',
				payload: {
					timestamp: Date.now(),
					data: allData, // Send the full dataset back to the tab
				},
			})
		} else if (message.type === 'LOAD_RECORD') {
			// console.log('Received LOAD_RECORD message with id:', message.payload.id)

			let currentRecord = allData[Math.floor(Math.random() * allData.length)]
			browser.runtime
				.sendMessage({
					type: 'RECORD_LOADED',
					payload: {
						timestamp: Date.now(),
						data: currentRecord, // Send the full dataset back to the tab
					},
					src: 'background',
					target: 'tab',
				})
				.then(() => {
					console.log('Record sent back to tab successfully')
				})
				.catch((error) => {
					console.error('Error sending record back to tab:', error)
				})
		}
	})
})
