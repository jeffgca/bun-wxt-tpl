import { mount } from 'svelte'
import './app.css'
import App from './Tab.svelte'

import { createProxyService } from '@webext-core/proxy-service'
import { TEST_SERVICE_KEY } from '../background/keys'

// 5. Get a proxy of your service
const testService = createProxyService(TEST_SERVICE_KEY)

let result = null

const emoji = {
	yes: '✅',
	no: '❌',
}

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

let isConnected = await testService.testConnection()
// console.log('XXX isConnected', isConnected)
let connectedLabel = isConnected ? emoji.yes : emoji.no

let appState = {}

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

const app = mount(App, {
	target: document.getElementById('app')!,
})
