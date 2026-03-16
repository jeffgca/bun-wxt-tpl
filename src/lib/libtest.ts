export class TestService {
	constructor() {
		console.log('TestService instantiated')
	}

	async testMethod(arg: string): Promise<string> {
		console.log('testMethod called with arg:', arg)
		return `Received: ${arg}`
	}
}
