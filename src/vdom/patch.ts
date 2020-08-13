import VNode from './vnode'


// Helper to create Map (key->vnode) from VNode array
const mapToKeys = (arr: VNode[]) => arr.reduce((map, c) => {
	const key = c.props && c.props.get('key')
	if (key)
		map.set(key, c)
	return map
}, new Map<string, VNode>() as any)

// Helper to create Map (nodeValue->vnode) from VNode array
const mapToTextContent = (arr: VNode[]) => arr.reduce((map, c) => {
	if (c.nodeValue)
		map.set(c.nodeValue, c)
	return map
}, new Map<string, VNode>())



export function $patch(
	$parent: HTMLElement, $el: HTMLElement | Text,
	oldVNode: VNode,
	newVNode: VNode,
	insertionIndex: number | null = null
): HTMLElement | Text {

	$parent = ($parent || (oldVNode.parent && oldVNode.parent.$el) || (newVNode.parent && newVNode.parent.$el)) as HTMLElement
	if (!$parent)
		throw new Error('$parent cannot be null')

	if (!oldVNode || !$el) {
		return $insertOrAppend($parent, newVNode.$createElement(), insertionIndex)
	}

	newVNode.$el = $el

	if (!isSameVNode(oldVNode, newVNode)) {
		$el.remove()
		return $insertOrAppend($parent, newVNode.$createElement(), insertionIndex)
	} else {
		if (insertionIndex !== null && $parent.childNodes[insertionIndex] !== $el) {
			$el.remove()
			$insertOrAppend($parent, $el, insertionIndex)
		}

		if (newVNode.type !== '#text') {
			$patchProps($el as HTMLElement, oldVNode.props, newVNode.props)
			$patchChildren($el as HTMLElement, oldVNode.children, newVNode.children)
		}
	}
	return $el
}


export function $patchChildren(
	$parent: HTMLElement,
	oldChildren: VNode[],
	newChildren: VNode[]
) {

	// Maps to get node with a given key in O(1)
	const oldNodeMap = mapToKeys(oldChildren)
	const newNodeMap = mapToKeys(newChildren)

	const newTextNodeMap = mapToTextContent(newChildren)
	const oldTextNodeMap = mapToTextContent(oldChildren)

	// Remove deleted VNodes DOM elements
	oldChildren.forEach(c => {
		if (
			!(c.props && newNodeMap.get(c.props.get('key'))) &&
			!newTextNodeMap.get(c.nodeValue)
		) {
			c.$el.remove()
		}
	})

	newChildren.forEach((childNode, index) => {

		const key = childNode.props && childNode.props.get('key')
		const oldCorrespondingNode: VNode =
			(key && oldNodeMap.get(key)) ||
			oldTextNodeMap.get(childNode.nodeValue)

		if (oldCorrespondingNode)
			$patch(
				$parent as HTMLElement,
				oldCorrespondingNode.$el,
				oldCorrespondingNode,
				childNode,
				index
			)
		else
			$insertOrAppend($parent as HTMLElement, childNode.$createElement(), index)
	})
}


export function $patchProps(
	$el: HTMLElement,
	oldProps: Map<string, any> = null,
	newProps: Map<string, any>,
	includeKey: boolean = false
) {

	const propsPresent = new Map<string, boolean>()

	newProps.forEach((value, key) => {
		if (key.startsWith('js:')) {
			$el[key.slice(3)] = value
			return
		}
		if (
			!(oldProps && newProps.get(key) === oldProps.get(key)) &&
			(includeKey || key !== 'key')
		) {
			$el.setAttribute(key, value)
		}
		propsPresent.set(key, true)
	})

	for (let i = 0; i < $el.attributes.length; i++) {
		if (!propsPresent.has($el.attributes[i].name)) {
			$el.removeAttribute($el.attributes[i].name)
		}
	}
}


export function isSameVNode(a: VNode, b: VNode): boolean {
	return (
		!(a.type === '#text' && a.nodeValue !== b.nodeValue) &&
		(a.props?.get('key')) === (b.props?.get('key')) &&
		a.type === b.type
	)
}


function $insertOrAppend(
	$parent: HTMLElement,
	$el: HTMLElement | Text,
	index: number
): HTMLElement | Text {

	if (index >= $parent.childNodes.length)
		$parent.appendChild($el)
	else
		$parent.insertBefore($el, $parent.childNodes[index])

	return $el
}
