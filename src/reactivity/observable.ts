import Job from "./job"


export default class Observable {
	
	subscribers = new Set<Job>()

	depend() {
		const watcher = Job.targetStack.peek()
		if (!watcher) return this
		watcher.addDependency(this)
		this.subscribers.add(watcher)
		return this
	}

	removeDependent(w: Job) {
		this.subscribers.delete(w)
	}

	notify(): Observable {
		this.subscribers.forEach(f => f.queue())
		return this
	}
}
