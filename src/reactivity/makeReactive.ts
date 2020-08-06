import Observable from './observable'
import { mapObject } from '../utils';


export default function makeReactive(state: any) {
	if (state && state.__isProxy) return state
	return Array.isArray(state) ? makeArrayReactive(state) : state instanceof Object ? makeObjectReactive(state) : state
}

function makeObjectReactive(obj: any) {
	obj = mapObject(obj, v => makeReactive(v))
	return new Proxy(obj, createObjectAccessorTraps())
}

function makeArrayReactive(arr: any[]) {
	arr = arr.map(i => makeReactive(i))
	return new Proxy(arr, createArrayAccessorTraps())
}


function createObjectAccessorTraps(): ProxyHandler<any> {
	const observables = new Map<string, Observable>()
	return {
		get: createObjectPropertyGetter(observables),
		set: createObjectPropertySetter(observables),
		deleteProperty: createPropertyDestructor(observables)
	}
}

function createArrayAccessorTraps(): ProxyHandler<Array<any>> {
	const observable = new Observable()
	return {
		get: createArrayPropertyGetter(observable),
		set: createArrayPropertySetter(observable),
		deleteProperty: createPropertyDestructor(observable)
	}
}


function createObjectPropertyGetter(observables: Map<string, Observable>) {
	return function (target: Object, key: string, receiver: typeof Proxy): any {
		if (key === '__isProxy') return true
		if (observables.has(key))
			observables.get(key).depend()
		else
			observables.set(key, new Observable().depend())

		return target[key] instanceof Function ? target[key].bind(receiver) : target[key];
	}
}

function createObjectPropertySetter(observables: Map<string, Observable>) {
	return function (target: Object, key: string, value: any): boolean {
		if (target[key] === value)
			return true

		target[key] = makeReactive(value);
		if (observables.has(key))
			observables.get(key).notify()

		return true
	}
}

const arrayMutators = [
	"copyWithin",
	"fill",
	"pop",
	"push",
	"reverse",
	"shift",
	"sort",
	"splice",
	"unshift"
]

function createArrayPropertyGetter(observable: Observable) {
	return function (target: Object, key: string, receiver: typeof Proxy) {
		if (key === '__isProxy') return true
		observable.depend()

		const val = target[key]

		if (val instanceof Function) {
			if (key === "push" || key === "unshift") {
				return function (item: any) {
					const i = makeReactive(item)
					Array.prototype[key].apply(target, [i])
					observable.notify()
					return i
				}
			}
			return val.bind(receiver)
		}

		return target[key]
	}
}

function createArrayPropertySetter(observable: Observable) {
	return function (target: Object, key: string, value: any) {
		if (target[key] === value)
			return true

		target[key] = makeReactive(value)
		observable.notify()

		return true
	}
}

function createPropertyDestructor(observableMapOrInstance: Map<string, Observable> | Observable) {
	return function (target: Object, key: string): boolean {
		if (key in target) {
			delete target[key];

			(observableMapOrInstance instanceof Observable ? observableMapOrInstance : observableMapOrInstance.get(key)).notify()

			return true
		}
		return false
	}
}
