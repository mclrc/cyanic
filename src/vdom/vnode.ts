import { $patchProps } from "./patch";
import { makeMap, Dict } from '../utils'


const createNode = (
	type: string,
	props: Dict = null,
	children: VNode[] = null
) => new VNode(type, makeMap<any>(props || {}), children || [])

const createTextNode = (text: string) => {
	const result = new VNode('#text')
	result.nodeValue = text
	return result
}

export function h(typeOrName: string, props?: Dict<any>, content?: VNode[] | VNode) {
	if (!props && !content) return createTextNode(typeOrName)

	let childrensArray: VNode[] = []

	if (content instanceof Array)
		childrensArray = content
	else if (content instanceof VNode)
		childrensArray = [content]
	else if (typeof content === 'string')
		childrensArray = [createTextNode(content)]

	return createNode(typeOrName, props, childrensArray.flat(Infinity))
}

export default class VNode {

	type: string
	props: Map<string, any>
	parent: VNode
	children: VNode[] = []
	$el: HTMLElement | Text
	nodeValue?: string

	constructor(
		type: string = 'div',
		props: Map<string, any> = null,
		children: VNode[] = null
	) {
		this.type = type

		if (type !== '#text') {
			this.props = props || new Map<string, any>()
			if (children)
				children.forEach(c => c ? this.append(c) : void 0)
		}
	}

	clone() {
		if (this.type === '#text') {
			const copy = new VNode('#text')
			copy.nodeValue = this.nodeValue
			copy.$el = this.$el
			return copy
		}
		const clonedProps = new Map<string, any>()
		this.props.forEach((value, key) => {
			clonedProps.set(key, value)
		})
		const copy = new VNode(this.type, clonedProps)
		copy.$el = this.$el
		copy.children = this.children.map(c => c.clone())
		return copy
	}

	$createElement(includeKey: boolean = false): HTMLElement | Text {
		if (this.type === '#text') {
			this.$el = document.createTextNode(this.nodeValue)
		} else {
			this.$el = document.createElement(this.type)
			$patchProps(this.$el, null, this.props, includeKey)

			this.children.map(c =>
				c.$createElement(includeKey)).forEach(this.$el.appendChild.bind(this.$el)
				)
		}

		return this.$el
	}

	getAllOfType(type: string): VNode[] {
		if (!this.children)
			return []
		return this.children.reduce(
			(arr: VNode[], c: VNode) => {
				if (c.type === type)
					arr.push(c)
				return arr.concat(c.getAllOfType(type))
			},
			new Array<VNode>()
		)
	}

	append(child: VNode) {
		child.parent = this
		this.children.push(child)
	}

	static fromObject(obj: any) {
		if (obj.type === '#text') {
			return new VNode('#text', null, obj.nodeValue)
		}
		const node = new VNode(obj.type, obj.props, [])
		node.props.set('key', node.props instanceof Map ? node.props.get('key') : node.props['key'])
		if (obj.children)
			node.children = obj.children.map(VNode.fromObject)
		return node
	}
}
