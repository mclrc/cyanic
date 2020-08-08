import Job from './job'
import ReactiveRef from './ref'

export const watch = (fun: Function) => new Job(fun).run()

export const ref = <T = any>(initial?: T) => new ReactiveRef<T>(initial)

export const defineComputed = (target: any, name: string, getter: Function) => watch(() => target[name] = getter())
