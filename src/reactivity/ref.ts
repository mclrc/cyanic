import Observable from './observable'
import makeReactive from './makeReactive'

export default <T = any>(initial?: T) => new ReactiveRef<T>(initial)

export class ReactiveRef<T = any> {
	private _value: T = null
	observable = new Observable()

	constructor(initial?: T) {
		if (initial)
			this._value = makeReactive(initial)
	}

	get value() {
		this.observable.depend()
		return this._value
	}
	set value(value) {
		this._value = makeReactive(value)
		this.observable.notify()
	}

	valueOf() { return this.value }
	toString() { return this.value }
	[Symbol.toPrimitive]() { return this.value }
}