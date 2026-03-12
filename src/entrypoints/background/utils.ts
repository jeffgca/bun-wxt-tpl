/**
 * Utility function to open a new tab with the specified URL or focus it if it's already open.
 */
export async function openOrFocusTab(url: string) {
	console.log('openOrFocusTab', url)

	// TBD
}

export class TestService {
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
		let res = await fetch('https://www.eko-recordings.ca/data/index.json')

		if (!res.ok) {
			return 'Error fetching data: ' + res.status
		}
		return await res.json()
	}
}
