export class TestService {
	constructor() {
		this.currentRecord = {}
		this.eventListeners = {}
	}

	async ping() {
		return 'pong'
	}

	async sayHello(forcError = false): Promise<string> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (forcError) {
					reject(new Error('Forced error'))
					return
				} else {
					resolve('Hello from TestService!')
				}
			}, 100)
		})
	}

	setRecord(record: unknown) {
		console.log('Record set in TestService:', record)
		this.currentRecord = record

		if (this.eventListeners['recordUpdated']) {
			this.eventListeners['recordUpdated'].forEach((callback) =>
				callback('recordUpdated', { record }),
			)
		}
	}

	async fetchData(): Promise<string> {
		console.log('in fetchData')
		let res = await fetch('https://www.eko-recordings.ca/data/index.json')

		if (!res.ok) {
			console.log('XXX res', res)
			return 'Error fetching data: ' + res.status
		}
		return await res.json()
	}

	async testConnection() {
		// Simulate a connection test
		try {
			let result = await fetch('https://www.eko-recordings.ca/data/index.json')
			if (result.ok) {
				return 'Connection successful'
			}
			return 'Connection failed with status: ' + result.status
		} catch (Err) {
			return 'Connection error: ' + Err.message
		}
	}

	onUpdateState(callback: (event: string, data: unknown) => void) {
		if (!this.eventListeners['recordUpdated']) {
			this.eventListeners['recordUpdated'] = []
		}
		this.eventListeners['recordUpdated'].push(callback)
	}

	async updateState() {
		// Simulate fetching some state and then triggering an update
		let newRecord = {
			timestamp: Date.now(),
			value: Math.random(),
		}
		this.setRecord(newRecord)
	}
}
