export class TestService {
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

	async fetchData(): Promise<string> {
		console.log('in fetchData')
		let res = await fetch('https://www.eko-recordings.ca/data/index.json')

		if (!res.ok) {
			console.log('XXX res', res)
			return 'Error fetching data: ' + res.status
		}
		return await res.json()
	}

	on(event: string, callback: (message: string, data: {}) => void) {
		// Simulate some event that triggers the callback

		// if (!)
		this.eventListeners.push(callback)
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
}
