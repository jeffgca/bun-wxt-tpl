import { openOrFocusTab } from './utils'
import { onMessage } from 'webext-bridge/background'
import { registerService } from '@webext-core/proxy-service'
import { TestService } from './utils'
import { TEST_SERVICE_KEY } from './keys'

let loopOneCounter = 0,
	loop = false

const IS_FIREFOX = import.meta.env.BROWSER === 'firefox'

export default defineBackground(() => {
	// 3. Instantiate your service
	const testService = new TestService()

	// 4. Register the service BEFORE awaiting anything
	registerService(TEST_SERVICE_KEY, testService)

	console.log(
		'Hello background!',
		{ id: browser.runtime.id },
		{ isFirefox: IS_FIREFOX },
	)

	// testService.testConnection().then((result) => {
	// 	console.log('Initial connection test result:', result)
	// })

	// browser.runtime.onMessage.addListener(async (message, sender) => {
	// 	console.log('Received message in background:', message)

	// 	if (message.type === 'PING_FROM_TAB') {
	// 		const result = await testService.testConnection()
	// 		console.log('Connection test result:', result)
	// 		return result

	// 		browser.tabs.sendMessage(sender.tab!.id!, {
	// 			type: 'PONG_FROM_BACKGROUND',
	// 			result,
	// 		})
	// 	}
	// })

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

	;(browser.action ?? browser.browser_action).onClicked.addListener(
		actionHandler,
	)
})
