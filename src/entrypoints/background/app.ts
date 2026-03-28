export type TimerTriggeredDetail = {
	timerId: string
	name?: string
	scheduledAt: number
	triggeredAt: number
	data?: unknown
}

export type IntervalTriggeredDetail = {
	intervalId: string
	name?: string
	startedAt: number
	triggeredAt: number
	tick: number
	data?: unknown
}

export class App extends EventTarget {
	private timers = new Map<string, ReturnType<typeof setTimeout>>()
	private timerMeta = new Map<
		string,
		{ name?: string; scheduledAt: number; data?: unknown }
	>()
	private intervals = new Map<string, ReturnType<typeof setInterval>>()
	private intervalMeta = new Map<
		string,
		{ name?: string; startedAt: number; tick: number; data?: unknown }
	>()

	startTimer(
		delayMs: number,
		options?: { id?: string; name?: string; data?: unknown },
	): string {
		const timerId = options?.id ?? crypto.randomUUID()

		this.clearTimer(timerId)

		const scheduledAt = Date.now()
		this.timerMeta.set(timerId, {
			name: options?.name,
			scheduledAt,
			data: options?.data,
		})

		const handle = setTimeout(() => {
			const meta = this.timerMeta.get(timerId)
			if (!meta) return

			this.timers.delete(timerId)
			this.timerMeta.delete(timerId)

			const detail: TimerTriggeredDetail = {
				timerId,
				name: meta.name,
				scheduledAt: meta.scheduledAt,
				triggeredAt: Date.now(),
				data: meta.data,
			}

			this.dispatchEvent(
				new CustomEvent<TimerTriggeredDetail>('timer', { detail }),
			)
		}, delayMs)

		this.timers.set(timerId, handle)
		return timerId
	}

	clearTimer(timerId: string): boolean {
		const handle = this.timers.get(timerId)
		if (!handle) return false

		clearTimeout(handle)
		this.timers.delete(timerId)
		this.timerMeta.delete(timerId)
		return true
	}

	clearAllTimers(): void {
		for (const handle of this.timers.values()) {
			clearTimeout(handle)
		}
		this.timers.clear()
		this.timerMeta.clear()
	}

	startInterval(
		intervalMs: number,
		options?: { id?: string; name?: string; data?: unknown },
	): string {
		const intervalId = options?.id ?? crypto.randomUUID()

		this.clearInterval(intervalId)

		const startedAt = Date.now()
		this.intervalMeta.set(intervalId, {
			name: options?.name,
			startedAt,
			tick: 0,
			data: options?.data,
		})

		const handle = setInterval(() => {
			const meta = this.intervalMeta.get(intervalId)
			if (!meta) return

			meta.tick += 1

			const detail: IntervalTriggeredDetail = {
				intervalId,
				name: meta.name,
				startedAt: meta.startedAt,
				triggeredAt: Date.now(),
				tick: meta.tick,
				data: meta.data,
			}

			this.dispatchEvent(
				new CustomEvent<IntervalTriggeredDetail>('interval', { detail }),
			)
		}, intervalMs)

		this.intervals.set(intervalId, handle)
		return intervalId
	}

	clearInterval(intervalId: string): boolean {
		const handle = this.intervals.get(intervalId)
		if (!handle) return false

		clearInterval(handle)
		this.intervals.delete(intervalId)
		this.intervalMeta.delete(intervalId)
		return true
	}

	clearAllIntervals(): void {
		for (const handle of this.intervals.values()) {
			clearInterval(handle)
		}
		this.intervals.clear()
		this.intervalMeta.clear()
	}

	onTimer(
		listener: (event: CustomEvent<TimerTriggeredDetail>) => void,
	): () => void {
		const wrappedListener: EventListener = (event) =>
			listener(event as CustomEvent<TimerTriggeredDetail>)
		this.addEventListener('timer', wrappedListener)

		return () => {
			this.removeEventListener('timer', wrappedListener)
		}
	}

	onInterval(
		listener: (event: CustomEvent<IntervalTriggeredDetail>) => void,
	): () => void {
		const wrappedListener: EventListener = (event) =>
			listener(event as CustomEvent<IntervalTriggeredDetail>)
		this.addEventListener('interval', wrappedListener)

		return () => {
			this.removeEventListener('interval', wrappedListener)
		}
	}
}

export default App
