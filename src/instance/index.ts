import { Job, ReactiveRef } from '../reactivity'
import { VNode, $patch } from '../vdom'
import { setCurrentInstance } from './hooks'
import Template from '../template-processing/template'


export default class Cyanic {
	$name: string
	$template: Template
	$components = new Map<string, Function>()
	$children = new Map<string, Cyanic>()
	$props = new Map<string, ReactiveRef>()
	$propNames = new Array<string>()
	$vroot: VNode
	$key: string
	$keepAlive = false

	$jobs = new Array<Job>()

	$created: Function = () => {}
	$mounted: Function = () => {}
	$beforeRender: Function = () => {}
	$beforeDestroy: Function = () => {}
	$destroyed: Function = () => {}

	constructor(setup: Function) {
		this.$jobs.push(new Job(this.$render.bind(this)))
		
		setCurrentInstance(this)
		Object.assign(this, setup())

		if (this.$name)
			this.$components.set(this.$name, setup)

		this.$created()
	}

	$destroy() {
		this.$beforeDestroy()
		this.$jobs.forEach(w => w.destroy())
		this.$jobs.length = 0
		this.$destroyed()
	}

	$mount($mountpoint: string | HTMLElement | VNode) {
		if (!($mountpoint instanceof VNode)) {
			if (typeof $mountpoint === 'string') {
				$mountpoint = document.querySelector($mountpoint) as HTMLElement
			}
			console.assert($mountpoint, 'Failed to mount')

			const vnode = new VNode($mountpoint.parentElement.tagName.toLowerCase())
			vnode.$el = $mountpoint.parentElement

			if (!this.$template) this.$template = Template.get($mountpoint.outerHTML)
			
			$mountpoint.remove()

			return this.$mount(vnode)
		}

		if (!this.$template) return this

		if ($mountpoint.$el instanceof Text)
			throw new Error('Cannot mount to text node')

		this.$vroot = this.$vroot || new VNode()
		this.$vroot.parent = $mountpoint

		$mountpoint.$el.append(this.$vroot.$el || this.$vroot.$createElement())

		this.$pullNodeProps()

		if (!this.$key) {
			this.$key = $mountpoint.props.get('key')
			this.$mounted()
			this.$jobs[0].run()
		}

		return this
	}

	private $pullNodeProps() {
		this.$propNames.forEach(n => {
			this.$props.get(n).value = this.$vroot.parent.props.get(n)
		})
	}

	private $render() {
		if (!this.$template) return;
		this.$beforeRender()

		const oldState = this.$vroot.clone()
		const $el = this.$vroot.$el

		this.$vroot = this.$template.render(this)

		if ($el && $el.parentElement) {
			$patch($el.parentElement, $el, oldState, this.$vroot)
			this.$renderChildren()
		}
	}

	private $renderChildren() {
		const keysFound = new Set<string>()

		this.$components.forEach((setup, name) => {
			const vnodes = this.$vroot.getAllOfType(name)

			vnodes.forEach(n => {
				const key = n.props.get('key')
				const component =
					this.$children.get(key) ||
					new Cyanic(setup)

				component.$mount(n)
				this.$children.set(key, component)
				keysFound.add(key)
			})
		})

		this.$children.forEach((vm, key) => {
			if (!vm.$keepAlive && !keysFound.has(key)) {
				vm.$destroy()
				this.$children.delete(key)
			}
		})
	}
}
