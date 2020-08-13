import Observable from './observable'
import { mapObject } from '../utils';


export default function makeReactive(state: any) {
	if (state?.__isProxy) return state
	return Array.isArray(state) ? makeArrayReactive(state) : state instanceof Object ? makeObjectReactive(state) : state
}

function makeObjectReactive(obj: any) {
	const observables = new Map<string | number | symbol, Observable>()

	return new Proxy(mapObject(obj, p => makeReactive(p)), {
		get(target, key, receiver) {
			if (key === '__isProxy') return true

			if (observables.has(key))
				observables.get(key).depend()
			else
				observables.set(key, new Observable().depend())

			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			if (target[key] === value) return true

			target[key] = makeReactive(value)
			observables.get(key)?.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			delete target[key]
			observables.get(key)?.notify()

			return true
		}
	})
}

function makeArrayReactive(arr: Array<any>) {
	const observable = new Observable()

	return new Proxy(arr.map(i => makeReactive(i)), {
		get(target, key, receiver) {
			if (key === '__isProxy') return true

			observable.depend()

			return typeof target[key] === 'function' ? target[key].bind(receiver) : target[key]
		},
		set(target, key, value) {
			if (target[key] === value) return true

			target[key] = makeReactive(value)
			observable.notify()

			return true
		},
		deleteProperty(target, key) {
			if (!(key in target)) return false

			delete target[key]
			observable.notify()

			return true
		}
	})
}
