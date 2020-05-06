export interface Dict<T = any> { [key: string]: T }


export type Primitive = string | number | null | undefined | boolean
export const isPrimitive = (value: any) => !(value instanceof Object)


export function shallowClone(source: any): any {
	return isPrimitive(source) ? source :
		source instanceof Array ? [...source] :
			Object.assign(Object.create(Object.getPrototypeOf(source)), { ...source })
}


export class Stack<T = any> {
	private els: T[]
	
	constructor(arr: T[] = []) {
		this.els = [...arr]
	}

	clear() { this.els = []; return this }
	clone() { return new Stack<T>(this.els) }
	toArray() { return [...this.els] }

	push(el: T) { this.els.push(el); return el }
	peek() { return this.els[this.els.length - 1] }
	pop() { return this.els.pop() }

	get height() { return this.els.length }
}

export function hash(input: string): string {
	let hash = 0, i, chr
	for (i = 0; i < input.length; i++) {
		chr = input.charCodeAt(i)
		hash = ((hash << 5) - hash) + chr
		hash |= 0
	}
	return hash.toString()
}


export function makeMap<T = any>(source: Dict<T>): Map<string, T> {
	return source ? Object.keys(source).reduce((map, key) => {
		map.set(key, source[key])
		return map
	}, new Map<string, T>() as any) : new Map<string, T>()
}

export function makeDict<T = any>(source: Map<string, T>): Dict<T> {
	return [...source.entries()].reduce((dict, pair) => {
		dict[pair[0]] = pair[1]
		return dict
	}, {} as Dict<T>)
}

export function mapObject<T = any>(obj: any, op: Function): T {
	return Object.keys(obj).reduce((prev, key) => {
		prev[key] = op(obj[key])
		return prev
	}, Object.create(obj.constructor.prototype))
}


const sandboxProxies = new WeakMap()

export function secureEval(code: string, additionalContext: any = {}) {
	code = `with(sandbox) {${code}}`
	const func = new Function("sandbox", code)

	const has = (target: Object, key: string) => true
	const get = (target: Object, key: any) =>
		key === Symbol.unscopables ? undefined :
			(target[key] !== undefined ? target[key] : additionalContext[key])

	return function evalWrapper(sandbox: Object) {
		if (!sandboxProxies.has(sandbox)) {
			const sandboxProxy = new Proxy(sandbox, { has, get })
			sandboxProxies.set(sandbox, sandboxProxy)
		}
		return func(sandboxProxies.get(sandbox))
	}
}
