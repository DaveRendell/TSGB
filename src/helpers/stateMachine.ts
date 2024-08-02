interface BaseState { name: string }

interface StateMachineOptions {
	logStateChanges: boolean
	logPrefix: string | undefined
}

const DEFAULT_OPTIONS: StateMachineOptions = {
	logStateChanges: false,
	logPrefix: undefined,
}

export default class StateMachine<State extends BaseState> {
	private stateInternal: State
	private stateMachineOptions: StateMachineOptions

	constructor(
		initialState: State,
		options: Partial<StateMachineOptions> = {},
	) {
		this.stateInternal = initialState
		this.stateMachineOptions = { ...DEFAULT_OPTIONS, ...options }
	}

	get state(): State {
		return this.stateInternal
	}

	set state(state: State) {
		if (this.stateMachineOptions.logStateChanges) {
			const prefix = this.stateMachineOptions.logPrefix
				? `[${this.stateMachineOptions.logPrefix}] `
				: ""

			console.log(prefix + `Setting state to ${state.name} (previous state: ${this.state.name})`)
		}
		this.stateInternal = state
	}
}