import { Job, ref } from '../reactivity'
import Cyanic from '.'
import { Dict, makeMap, makeDict } from '../utils'
import Template from '../template-processing/template'


interface PropDescriptor {
	name: string
	type?: any
	default?: any
}

let currentInstance = null;
export const setCurrentInstance = (vm: Cyanic) => currentInstance = vm

export function useEffect(func: Function) {
	currentInstance.$jobs.push(new Job(func).run())
}
export function useHook(name: 'created' | 'destroyed' | 'mounted' | 'rendered' | 'beforeRender' | 'beforeDestroy', callback: Function) {
	currentInstance[`$${name}`] = callback
}
export function useProps(...props: PropDescriptor[]) {
	currentInstance.$propNames = props.map(p => p.name)
	currentInstance.$props = props.reduce((acc, p) => {
		acc.set(p.name, ref(p.default))
		return acc
	}, new Map())
	return makeDict(currentInstance.$props)
}
export function useComponents(components: Dict<Function>) {
	currentInstance.$components = makeMap(components)
}
export function useTemplate(template: string) {
	currentInstance.$template = Template.get(template)
}
export function computed<T = any>(getter: Function) {
	const r = ref<T>(null)
	currentInstance.$jobs.push(new Job(() => r.value = getter()).run())
	return r
}