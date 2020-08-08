import Cyanic from '../instance'
import { Stack } from '../utils'
import Observable from './observable'
import queueJob from './scheduler'


let id = 0

export default class Job {
	
	static targetStack: Stack<Job> = new Stack()
	static queue: Set<Job> = new Set()

	vm: Cyanic
	dependencies: Set<Observable> = new Set()
	newDependencies: Set<Observable> = new Set()
	func: Function
	id: number
	destroyed = false

	constructor(func: Function) {
		this.func = func
		this.id = id++
	}

	addDependency(dep: Observable) {
		this.newDependencies.add(dep)
	}

	cleanupDependencies() {
		this.dependencies.forEach(d => { if (!this.newDependencies.has(d)) d.removeDependent(this) })
		let tmp = this.dependencies
		this.dependencies = this.newDependencies
		this.newDependencies = tmp
		this.newDependencies.clear()
	}

	queue() {
		queueJob(this)
		return this
	}

	run() {
		if (this.destroyed) return
		Job.targetStack.push(this)
		const value = this.func.call(undefined)
		Job.targetStack.pop()
		this.cleanupDependencies()
		return this
	}

	destroy() {
		this.dependencies.forEach(o => {
			o.removeDependent(this)
		})
		this.dependencies.clear()
		this.destroyed = true
	}
}
