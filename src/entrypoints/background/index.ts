import { openOrFocusTab } from './utils'
import { onMessage } from 'webext-bridge/background'
import { registerService } from '@webext-core/proxy-service'
import { TestService } from './utils'
import { TEST_SERVICE_KEY } from './keys'

let loopOneCounter = 0

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

	// background recurring timer

	let loopOne = setInterval(() => {
		console.log('in interval one', { loopOneCounter })
		loopOneCounter++
	}, 5000)

	// browser action onClick handler
	browser.action.onClicked.addListener(async (event) => {
		const tabUrl = browser.runtime.getURL('/tab.html')

		console.log('clicked', event)

		// Query all tabs to find if one with our page is already open
		const tabs = await browser.tabs.query({})
		const existingTab = tabs.find((tab) => tab.url === tabUrl)

		if (existingTab && existingTab.id) {
			// Tab already open - switch to it
			await browser.tabs.update(existingTab.id, { active: true })
			// Also bring the window to focus if the tab is in a different window
			if (existingTab.windowId) {
				await browser.windows.update(existingTab.windowId, { focused: true })
			}
		} else {
			// Tab not open - create a new one
			await browser.tabs.create({
				url: tabUrl,
			})
		}
	})
})
