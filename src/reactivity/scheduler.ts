import Job from './job'


const jobQueue = new Array<Job>()
const queuedJobs = new Set<Job>()
const isQueued = (j: Job) => queuedJobs.has(j)

let flushUpcoming = false

function flush() {
	flushUpcoming = false

	const jobsToExecute = [...jobQueue.sort((a, b) => b.id - a.id)]
	jobQueue.length = 0
	queuedJobs.clear()

	jobsToExecute.forEach(job =>job.run())
}

export default function queueJob(j: Job) {
	if (isQueued(j)) return;
	jobQueue.push(j)
	queuedJobs.add(j)
	if (!flushUpcoming) {
		flushUpcoming = true
		queueMicrotask(flush)
	}
}
