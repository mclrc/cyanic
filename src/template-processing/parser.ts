import { Dict, Stack } from '../utils'
import { VNode, h } from '../vdom'


const regex = (() => {
	// Matches any HTML tag and captures its type
	const anyTag = /<\s*\/?\s*([^\s\/<>="']+)\s*((?:[^\s\/<>="']+(?:="[^"]+")?\s*)+)?\s*(\/)?\s*>/
	// Matches closing HTML tag and captures its type
	const endTag = /<\/\s*(\w+)\s*>/
	// Matches and captures text content at the beginning of a string. Does not match whitespace only
	const startsWithTextContent = /^\s*((?:[^\s<>]+\s*)+)/
	// Matches HTML opening tag. Captures its type and raw attributes string
	const openingTag = /<\s*([^\s\/<>="']+)\s*((?:[^\s\/<>="']+(?:="[^"]+")?\s*)+)?\s*(\/)?\s*>/
	// Matches a single key/value? pair. Captures key and value
	const attribute = /([^\s/"'=]+)(?:="([^"]*)")?/g
	// Matches a comment
	const commentTag = /<!--.+-->/

	return { anyTag, endTag, startsWithTextContent, attribute, openingTag, commentTag }
})()

const isComment = (tag: string) => regex.commentTag.test(tag)

// JS has no builtin way to collect all the matches and include capture groups for regular expressions.
// Hence, a helper to do just that
function findAll(str: string, regex: RegExp, matches: RegExpExecArray[] = []): RegExpExecArray[] {
	const match = regex.exec(str)
	match && matches.push(match) && findAll(str, regex, matches)
	return matches
}

// Creates object containing the properties in the passed raw attribute string
function parseProps(propString: string): Dict {
	return findAll(propString, regex.attribute).reduce((props, pair) => {
		props[pair[1]] = pair[2] || true
		return props
	}, {} as any)
}

export default function parse(html: string): VNode[] {
	const stack = new Stack<VNode>()
	const closedSet = new Set<VNode>()

	while (html !== '') {
		const nextTag = regex.anyTag.exec(html) as RegExpExecArray

		if (regex.startsWithTextContent.test(html))
			stack.push(h(html.substr(0, nextTag ? nextTag.index : html.length)) as VNode)

		if (!nextTag) {
			break
		} else if (isComment(nextTag[0])) {
			html = html.slice(nextTag.index + nextTag[0].length)
			continue
		}

		const openingTag = regex.openingTag.exec(nextTag[0])

		if (openingTag) {

			const nodeToAdd = h(
				nextTag[1],
				openingTag && openingTag[2] ? parseProps(openingTag[2]) : {}
			) as VNode
			stack.push(nodeToAdd)

			if (openingTag[3])
				closedSet.add(nodeToAdd)

		} else {

			const content = []

			while (stack.peek() && (stack.peek().type !== nextTag[1] || closedSet.has(stack.peek())))
				content.unshift(stack.pop())

			const container = stack.peek()

			if (!container)
				throw new Error('No corresponding opening tag found for ' + nextTag[0])

			content.forEach(container.append.bind(container))
			closedSet.add(container)
		}

		html = html.slice(nextTag.index + nextTag[0].length)
	}
	return stack.toArray()
}
