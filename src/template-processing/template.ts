import VNode from '../vdom/vnode'
import compile from '../template-processing/compiler'
import { hash } from '../utils'


export default class Template {
	source: string
	render: (any) => VNode

	static compiled = new Map<string, Template>()

	static get(source: string) {
		return Template.compiled.get(hash(source)) || new Template(source) 
	}

	constructor(source: string) {
		this.source = source
		this.render = compile(source)
		Template.compiled.set(hash(source), this)
	}
}
