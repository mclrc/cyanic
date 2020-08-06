import Job from './job'


const queuedJobs = new Set<Job>()
const isQueued = (j: Job) => queuedJobs.has(j)

let flushUpcoming = false

function flush() {
	flushUpcoming = false

	const jobsToExecute = Array.from(queuedJobs).sort((a, b) => b.id - a.id)
	queuedJobs.clear()

	jobsToExecute.forEach(job =>job.run())
}

export default function queueJob(j: Job) {
	if (isQueued(j)) return;
	queuedJobs.add(j)
	if (!flushUpcoming) {
		flushUpcoming = true
		queueMicrotask(flush)
	}
}
