import { mount } from 'svelte'
import './app.css'
import App from './Tab.svelte'

const app = mount(App, {
	target: document.getElementById('app')!,
})

// Handle local IP discovery requests from background script
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	console.log('message type', message.type, 'sender', sender)
	await sendResponse({
		type: 'tab-message',
		message: 'Hello from the tab script!',
	})
})
