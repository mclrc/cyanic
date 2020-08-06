import { Dict, secureEval, makeDict } from '../utils'
import parseHTML from './parser'
import { VNode, h } from '../vdom'


// Helpers
export const toCamelCase = (source: string) =>
	source.replace(/-([a-zA-Z])/g, (match, c1) => c1.toUpperCase())

const genKey = () => `v-${Math.random() * 10}`.replace('.', '')

const mustacheBinding = /{{([^}]+)}}/g

const parseMustacheBindings = (str: string) =>
	`"${str.replace(/\n/g, '\\n').replace(mustacheBinding, (match, p1) => `" + (${p1}) + "`)}"`

const escape = (str: string) => `\`${str.replace(/(?<!\\)`/g, '\\`')}\``

const parseDataBinding = (key: string, value: string) =>
	`"${key.slice(1)}": ${value},\n`


// Directives
const directives: Dict<(vn: VNode, dv: string) => string> = {
	vIf: (node, condition) => `(${condition} ? ${compileVNode(node)} : [])`,
	vFor (node, head) {
		const [, varName, indexName, arrName] = /(\w+),?\s+(\w*)\s*in\s*([\w\.\[\]']+)/.exec(head)

		if (!node.props.get(':key'))
			node.props.set(':key', varName)

		const result = `${arrName}.map((${varName}, ${indexName === '' ? 'index' : indexName}) => ${compileVNode(node)})`

		return result
	},
	vModel(node, field) {
		node.props.set(':js:value', field)
		node.props.set('@input', `${field}=$evt.target.value`)
		return compileVNode(node)
	}
}

function compilePropDict(dict: Dict) {
	return `{${Object.keys(dict).reduce((acc, key) => {
		if (key.startsWith('@'))
			acc += `'js:on${key.slice(1)}': $evt => { ${dict[key]} },`
		else if (key.startsWith(':'))
			acc += parseDataBinding(key, dict[key])
		else
			acc += `'${key}':${typeof dict[key] === 'string' ? parseMustacheBindings(dict[key].replace(/(?<!\\)"/g, '\\"')) : dict[key]}, `
		return acc
	}, '')}}`
}

function compileChildren(children: VNode[]) {
	return `[${children.reduce((acc, c) => {
		acc += compileVNode(c) + ', '
		return acc
	}, '')}]`
}

export function compileVNode(node: VNode) {
	if (node.type === '#text') return `h(${parseMustacheBindings(node.nodeValue)})`
	const directive = [...node.props.entries()].find(p => toCamelCase(p[0]) in directives)
	if (directive) {
		node.props.delete(directive[0])
		return directives[toCamelCase(directive[0])](node, directive[1])
	}
	return `h(${escape(node.type)}, ${compilePropDict({ key: genKey(), ...makeDict(node.props) })},${compileChildren(node.children)})`
}

export default function compile(template: string) {
	const vnode = parseHTML(template)[0]
	const code = 'return ' + compileVNode(vnode)

	return secureEval(code, { h })
}
